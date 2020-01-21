import {
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    OnApplicationBootstrap,
    OnApplicationShutdown
} from "@nestjs/common";
import {LoggerService} from "nest-logger";
import {Cron, NestSchedule} from "nest-schedule";
import Axios from "axios";
import uuid from "uuid/v4";
import uniqBy from "lodash.uniqby";
import {DefaultBootstrapNodesContainer} from "./DefaultBootstrapNodesContainer";
import {NodeType} from "./types";
import {RegisterNodeRequest} from "./types/request";
import {NodeResponse} from "./types/response";
import {getIpAddress} from "../utils/ip";
import {getRandomElement} from "../utils/random-element";
import {config} from "../config";

@Injectable()
export class DiscoveryService extends NestSchedule implements OnApplicationBootstrap, OnApplicationShutdown {
    private bootstrapNodeStarted: boolean = false;
    private registeredNodes: NodeResponse[] = [];
    private nodeId?: string = undefined;

    constructor(@Inject("libp2pNode") private readonly libp2pNode: any | null,
                private readonly defaultBootstrapNodesContainer: DefaultBootstrapNodesContainer,
                private readonly log: LoggerService) {
        super()
    }

    public getNodes(): NodeResponse[] {
        return this.registeredNodes;
    }

    @Cron("* * * * *", {
        waiting: true
    })
    public async checkNodesStatus(): Promise<void> {
        if (config.IS_BOOTSTRAP_NODE) {
            this.log.info("Checking status of registered nodes");
            for (const node of this.registeredNodes) {
                try {
                    await Axios.get(`http://${node.ipAddress}:${node.port}/api/v1/status`)
                } catch (error) {
                    this.log.info(`Node with IP ${node.ipAddress} and id ${node.id} seems to be down, removing it`);
                    this.registeredNodes = this.registeredNodes
                        .filter(registeredNode => registeredNode.ipAddress !== node.ipAddress && registeredNode.port !== node.port);
                    this.libp2pNode.pubsub.publish("node_deletion", Buffer.from(JSON.stringify({nodeId: node.id})));
                }
            }
        }
    }

    public async registerNode(registerNodeRequest: RegisterNodeRequest): Promise<NodeResponse> {
        if (!config.IS_BOOTSTRAP_NODE) {
            throw new HttpException("Registration can only be done through bootstrap node, and this is not one of them", HttpStatus.FORBIDDEN);
        }

        const nodeResponse: NodeResponse = {
            id: uuid(),
            addresses: registerNodeRequest.walletAddresses,
            ipAddress: registerNodeRequest.ipAddress,
            port: registerNodeRequest.port,
            type: registerNodeRequest.type
        };
        this.registeredNodes.push(nodeResponse);
        this.libp2pNode.pubsub.publish("node_registration", Buffer.from(JSON.stringify(nodeResponse)));
        return nodeResponse;
    }

    public async onApplicationBootstrap(): Promise<any> {
        const ipAddress = await getIpAddress(config.USE_LOCAL_IP_ADDRESS_FOR_REGISTRATION);
        if (this.libp2pNode !== null) {
            this.log.info("Starting up bootstrap node");
            this.libp2pNode.peerInfo.multiaddrs.add(`/ip4/${ipAddress}/tcp/${config.BOOTSTRAP_NODE_PORT}`);

            this.libp2pNode.start().then(() => {
                this.bootstrapNodeStarted = true;
                this.log.info("Started bootstrap node");
                this.log.info(`Peer ID is ${this.libp2pNode.peerInfo.id._idB58String}`);
                this.subscribeToNodeRegistrationEvent();
                this.subscribeToNodeDeletionEvent();
                this.subscribeToPeerConnectEvent();
            });
        } else {
            await this.registerSelf(ipAddress);
        }
    }

    private subscribeToNodeRegistrationEvent(): void {
        this.libp2pNode.pubsub.subscribe("node_registration", (message: any) => {
            this.log.debug("New node registered");
            const node: NodeResponse = JSON.parse(message.data.toString());
            this.registeredNodes.push(node);
            this.registeredNodes = uniqBy(this.registeredNodes, "id");
        });
    }

    private subscribeToNodeDeletionEvent(): void {
        this.libp2pNode.pubsub.subscribe("node_deletion", (message: any) => {
            this.log.debug("Node unregistered");
            const nodeUnregisteredMessage: {nodeId: string} = JSON.parse(message.data.toString());
            this.log.debug(`Removing node with ID ${nodeUnregisteredMessage.nodeId}`);
            this.registeredNodes = this.registeredNodes.filter(node => node.id !== nodeUnregisteredMessage.nodeId);
        })
    }

    private subscribeToPeerConnectEvent(): void {
        this.libp2pNode.on("peer:connect", (peer: any) => {
            this.log.debug(`Connected to peer ${peer.id.toB58String()}`);
            this.registeredNodes.forEach(node => this.libp2pNode.pubsub.publish("node_registration", Buffer.from(JSON.stringify(node))));
        });
    }

    private async registerSelf(ipAddress: string): Promise<void> {
        this.log.info("Starting not as bootstrap node");
        const bootstrapNode = getRandomElement(this.defaultBootstrapNodesContainer.getBootstrapNodes());
        this.log.info(`Chosen bootstrap node is ${bootstrapNode.libp2pAddress}`);
        const registerNodeRequest: RegisterNodeRequest = {
            bootstrap: false,
            ipAddress,
            port: config.SERVICE_NODE_API_PORT,
            type: NodeType.SERVICE_NODE,
            walletAddresses: []
        };
        this.log.info("Registering to bootstrap node");
        const nodeResponse: NodeResponse = (
            await Axios.post(
                `http://${bootstrapNode.ipAddress}:${bootstrapNode.port}/api/v1/discovery/nodes`,
                registerNodeRequest
            ))
            .data;
        this.nodeId = nodeResponse.id;
        this.log.info(`Registered to bootstrap node. Received id is ${this.nodeId}`);
    }

    public async onApplicationShutdown(signal?: string): Promise<any> {
        if (this.libp2pNode !== null) {
            await this.libp2pNode.stop();
        }
    }
}

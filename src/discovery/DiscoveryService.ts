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
import pipe from "it-pipe";
import multiaddr from "multiaddr";
import {BootstrapNodesContainer} from "./BootstrapNodesContainer";
import {NodeType} from "./types";
import {RegisterNodeRequest} from "./types/request";
import {NodeResponse} from "./types/response";
import {getIpAddress} from "../utils/ip";
import {getRandomElement} from "../utils/random-element";
import {config} from "../config";
import {AccountService} from "../account";

@Injectable()
export class DiscoveryService extends NestSchedule implements OnApplicationBootstrap, OnApplicationShutdown {
    private bootstrapNodeStarted: boolean = false;
    private registeredNodes: NodeResponse[] = [];
    private nodeId?: string = undefined;

    constructor(@Inject("libp2pNode") private readonly libp2pNode: any | null,
                private readonly bootstrapNodesContainer: BootstrapNodesContainer,
                private readonly accountService: AccountService,
                private readonly log: LoggerService) {
        super();
    }

    public getNodes(): NodeResponse[] {
        return this.registeredNodes;
    }

    @Cron("* * * * *", {
        waiting: true
    })
    public async checkNodesStatus(): Promise<void> {
        if (config.IS_BOOTSTRAP_NODE && this.bootstrapNodeStarted) {
            this.log.info("Checking status of registered nodes");
            const nodeIdsToRemove: string[] = [];
            for (const node of this.registeredNodes) {
                try {
                    await Axios.get(`http://${node.ipAddress}:${node.port}/api/v1/status`)
                } catch (error) {
                    this.log.info(`Node with IP ${node.ipAddress}, port ${node.port} and id ${node.id} seems to be down`);
                    nodeIdsToRemove.push(node.id);
                }
            }
            if (nodeIdsToRemove.length !== 0) {
                this.log.info(`Removing nodes with IDs ${JSON.stringify(nodeIdsToRemove)}`);
                this.registeredNodes = this.registeredNodes.filter(node => !nodeIdsToRemove.includes(node.id));
                nodeIdsToRemove.forEach(nodeId => this.libp2pNode.pubsub.publish("node_deletion", Buffer.from(JSON.stringify({nodeId}))));
            }
        }
    }

    public async getNodesByAddress(address: string): Promise<NodeResponse[]> {
        return this.registeredNodes.filter(node => node.addresses.includes(address))
    }

    public async getNodesByType(type: NodeType): Promise<NodeResponse[]> {
        return this.registeredNodes.filter(node => node.type === type);
    }

    public async getNodesByAddressAndType(address: string, type: NodeType): Promise<NodeResponse[]> {
        this.log.debug(`Searching for nodes with ${address} address and ${type} type`);
        return this.registeredNodes
            .filter(node => node.type === type)
            .filter(node => node.addresses.includes(address));
    }

    public async registerNode(registerNodeRequest: RegisterNodeRequest): Promise<NodeResponse> {
        if (!config.IS_BOOTSTRAP_NODE) {
            throw new HttpException("Registration can only be done through bootstrap node, and this is not one of them", HttpStatus.FORBIDDEN);
        }

        const id = uuid();
        const nodeResponse: NodeResponse = {
            id,
            addresses: registerNodeRequest.walletAddresses,
            ipAddress: registerNodeRequest.ipAddress,
            port: registerNodeRequest.port,
            type: registerNodeRequest.type,
            bootstrap: registerNodeRequest.bootstrap
        };
        this.registeredNodes.push(nodeResponse);
        this.libp2pNode.pubsub.publish("node_registration", Buffer.from(JSON.stringify(nodeResponse)));
        return nodeResponse;
    }

    public async onApplicationBootstrap(): Promise<any> {
        const ipAddress = await getIpAddress({
          useLocalIpAddress: config.USE_LOCAL_IP_ADDRESS_FOR_REGISTRATION
        });
        if (this.libp2pNode !== null) {
            this.log.info("Starting as bootstrap node");
            this.libp2pNode.peerInfo.multiaddrs.add(multiaddr(`/ip4/0.0.0.0/tcp/${config.BOOTSTRAP_NODE_PORT}`));
            this.subscribeToPeerConnectEvent();
            await this.libp2pNode.start();
            await this.handleInitialNodeListRetrieval();
            this.subscribeToNodeRegistrationEvent();
            this.subscribeToNodeDeletionEvent();
            this.bootstrapNodeStarted = true;
            console.log(this.libp2pNode.peerInfo.multiaddrs.toArray().map((multiaddress: any) => `${multiaddress}/p2p/${this.libp2pNode.peerInfo.id.toB58String()}`));
            this.log.info("Started bootstrap node");
            this.log.info(`Peer ID is ${this.libp2pNode.peerInfo.id.toB58String()}`);
            await this.registerSelf(ipAddress);
        } else {
            this.log.info("Starting not as bootstrap node");
            await this.registerSelf(ipAddress);
        }
    }

    private async handleInitialNodeListRetrieval(): Promise<void> {
        this.libp2pNode.handle("/node_list_retrieval/1.0.0", async (connection: any) => {
            const {stream} = connection;

            const nodesJson: string[] = await pipe(
                stream,
                async (source: any): Promise<string[]> => {
                    const result: string[] = [];
                    for await (const data of source) {
                        result.push(data.toString());
                    }
                    return result;
                }
            );

            this.log.debug("Received list of nodes");
            nodesJson.forEach(nodeJson => this.log.debug(nodeJson));

            let nodeList: NodeResponse[] = nodesJson.map(nodeJson => JSON.parse(nodeJson));
            nodeList = [
                ...this.registeredNodes,
                ...nodeList
            ];
            this.registeredNodes = nodeList;
        })
    }

    private subscribeToNodeRegistrationEvent(): void {
        this.libp2pNode.pubsub.subscribe("node_registration", (message: any) => {
            const node: NodeResponse = JSON.parse(message.data.toString());
            this.log.debug(`Node with IP ${node.ipAddress} registered`);
            this.registeredNodes.push(node);
            this.registeredNodes = uniqBy(this.registeredNodes, "id");
        });
    }

    private subscribeToNodeDeletionEvent(): void {
        this.libp2pNode.pubsub.subscribe("node_deletion", (message: any) => {
            const nodeUnregisteredMessage: {nodeId: string} = JSON.parse(message.data.toString());
            this.log.debug(`Removing node with ID ${nodeUnregisteredMessage.nodeId}`);
            setTimeout(
                () => this.registeredNodes = this.registeredNodes.filter(node => node.id !== nodeUnregisteredMessage.nodeId),
                    3000
            );
        })
    }

    private subscribeToPeerConnectEvent(): void {
        this.libp2pNode.on("peer:connect", async (peer: any) => {
            this.log.debug(`Connected to peer ${peer.id.toB58String()}`);
            const {stream} = await this.libp2pNode.dialProtocol(peer, "/node_list_retrieval/1.0.0");
            this.log.debug(`Dialing node ${peer.id.toB58String()} and sending it list of nodes`);
            pipe(
                this.registeredNodes.map(node => JSON.stringify(node)),
                stream.sink
            );
        });
    }

    private async registerSelf(ipAddress: string): Promise<void> {
        const walletAddresses = (await this.accountService.getAllLocalAccounts()).map(account => account.address);
        if (config.IS_BOOTSTRAP_NODE) {
            const id = uuid();
            this.nodeId = id;
            const nodeRegisteredEvent: NodeResponse = {
                bootstrap: true,
                ipAddress,
                port: config.SERVICE_NODE_API_PORT,
                type: NodeType.SERVICE_NODE,
                addresses: walletAddresses,
                id
            };
            this.libp2pNode.pubsub.publish("node_registration", Buffer.from(JSON.stringify(nodeRegisteredEvent)));
        } else {
            const bootstrapNode = getRandomElement(this.bootstrapNodesContainer.getBootstrapNodes());
            this.log.info(`Chosen bootstrap node is ${bootstrapNode.libp2pAddress}`);
            const registerNodeRequest: RegisterNodeRequest = {
                bootstrap: false,
                ipAddress,
                port: config.SERVICE_NODE_API_PORT,
                type: NodeType.SERVICE_NODE,
                walletAddresses
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
    }

    public async onApplicationShutdown(signal?: string): Promise<any> {
        if (this.libp2pNode !== null) {
            this.log.info("Deleting itself from list of nodes and stopping libp2pNode");
            this.libp2pNode.pubsub.publish("node_deletion", Buffer.from(JSON.stringify({nodeId: this.nodeId})));
            await this.libp2pNode.stop();
        }
    }
}

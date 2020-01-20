import {
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    OnApplicationBootstrap,
    OnApplicationShutdown
} from "@nestjs/common";
import {LoggerService} from "nest-logger";
import Axios from "axios";
import uuid from "uuid/v4";
import {DefaultBootstrapNodesContainer} from "./DefaultBootstrapNodesContainer";
import {NodeType} from "./types";
import {getIpAddress} from "../utils/ip";
import {RegisterNodeRequest} from "./types/request";
import {NodeResponse} from "./types/response";
import {getRandomElement} from "../utils/random-element";
import {config} from "../config";

@Injectable()
export class DiscoveryService implements OnApplicationBootstrap, OnApplicationShutdown {
    private bootstrapNodeStarted: boolean = false;
    private registeredNodes: NodeResponse[] = [];
    private nodeId?: string = undefined;

    constructor(@Inject("libp2pNode") private readonly libp2pNode: any | null,
                private readonly defaultBootstrapNodesContainer: DefaultBootstrapNodesContainer,
                private readonly log: LoggerService) {
    }

    public getNodes(): NodeResponse[] {
        return this.registeredNodes;
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
        const ipAddress = "0.0.0.0";
        if (this.libp2pNode !== null) {
            this.log.info("Starting up bootstrap node");
            this.libp2pNode.peerInfo.multiaddrs.add(`/ip4/${ipAddress}/tcp/${config.BOOTSTRAP_NODE_PORT}`);

            this.libp2pNode.start().then(() => {
                this.bootstrapNodeStarted = true;
                this.log.info("Started bootstrap node");
                this.log.info(`Peer ID is ${this.libp2pNode.peerInfo.id._idB58String}`);
                console.log(this.libp2pNode.peerInfo);
                this.libp2pNode.pubsub.subscribe("node_registration", (message: any) => {
                    this.log.debug("Message received");
                    console.log(message);
                    const node: NodeResponse = JSON.parse(message.data.toString());
                    console.log(node);
                    this.registeredNodes.push(node);
                });
            });
        } else {
            await this.registerSelf(ipAddress);
        }
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

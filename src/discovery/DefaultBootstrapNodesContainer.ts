import {Injectable, OnModuleInit} from "@nestjs/common";
import {BootstrapNode} from "./types";

// tslint:disable-next-line:no-var-requires
const bootstrapNodes: {bootstrapNodes: BootstrapNode[]} = require("../../bootstrap-nodes.json");

@Injectable()
export class DefaultBootstrapNodesContainer implements OnModuleInit {
    private bootstrapNodes: BootstrapNode[] = [];

    onModuleInit(): any {
        console.log(bootstrapNodes);
        this.bootstrapNodes = bootstrapNodes.bootstrapNodes;
    }

    public getBootstrapNodes(): BootstrapNode[] {
        return this.bootstrapNodes;
    }

    public getBootstrapNodesLibp2pAddresses(): string[] {
        return this.bootstrapNodes.map(bootstrapNode => bootstrapNode.libp2pAddress);
    }
}

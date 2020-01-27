import {Injectable, OnModuleInit} from "@nestjs/common";
import {LoggerService} from "nest-logger";
import {BootstrapNode} from "./types";
import {config} from "../config";

// tslint:disable-next-line:no-var-requires
const bootstrapNodes: {bootstrapNodes: BootstrapNode[]} = require("../../bootstrap-nodes.json");

@Injectable()
export class BootstrapNodesContainer implements OnModuleInit {
    private bootstrapNodes: BootstrapNode[] = require("../../bootstrap-nodes.json").bootstrapNodes;

    constructor(private readonly log: LoggerService) {
    }

    public onModuleInit(): void {
        this.log.debug("Starting with the following bootstrap nodes:");

        if (config.LOGGING_LEVEL.trim().toUpperCase() === "DEBUG") {
            console.log(bootstrapNodes);
        }
    }

    public getBootstrapNodes(): BootstrapNode[] {
        return this.bootstrapNodes;
    }

    public getBootstrapNodesLibp2pAddresses(): string[] {
        return this.bootstrapNodes.map(bootstrapNode => bootstrapNode.libp2pAddress);
    }
}

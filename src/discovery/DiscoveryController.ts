import {Body, Controller, Get, Post, Query} from "@nestjs/common";
import {DiscoveryService} from "./DiscoveryService";
import {getNodeTypeFromString} from "./types";
import {NodeResponse} from "./types/response";
import {RegisterNodeRequest} from "./types/request";

@Controller("api/v1/discovery")
export class DiscoveryController {
    constructor(private readonly discoveryService: DiscoveryService) {
    }

    @Get("nodes")
    public async getNodes(@Query("address") address?: string,
                          @Query("type") type?: string): Promise<NodeResponse[]> {
        if (address) {
            if (type) {
                return this.discoveryService.getNodesByAddressAndType(address, getNodeTypeFromString(type));
            } else {
                return this.discoveryService.getNodesByAddress(address);
            }
        } else if (type) {
            return t
        }

        return this.discoveryService.getNodes();
    }

    @Post("nodes")
    public registerNode(@Body() registerNodeRequest: RegisterNodeRequest): Promise<NodeResponse> {
        return this.discoveryService.registerNode(registerNodeRequest);
    }
}

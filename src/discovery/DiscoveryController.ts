import {Body, Controller, Get, Post} from "@nestjs/common";
import {DiscoveryService} from "./DiscoveryService";
import {NodeResponse} from "./types/response";
import {RegisterNodeRequest} from "./types/request";

@Controller("api/v1/discovery")
export class DiscoveryController {
    constructor(private readonly discoveryService: DiscoveryService) {
    }

    @Get("nodes")
    public getNodes(): NodeResponse[] {
        return this.discoveryService.getNodes();
    }

    @Post("nodes")
    public registerNode(@Body() registerNodeRequest: RegisterNodeRequest): Promise<NodeResponse> {
        return this.discoveryService.registerNode(registerNodeRequest);
    }
}

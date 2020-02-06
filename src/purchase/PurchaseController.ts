import {Body, Controller, Post} from "@nestjs/common";
import {PurchaseService} from "./PurchaseService";
import {PurchaseDataDto} from "./types/request";
import {DataPurchaseResponse} from "./types/response";

@Controller("api/v1/purchases")
export class PurchaseController {
    constructor(private readonly purchaseService: PurchaseService) {
    }

    @Post()
    public purchaseData(@Body() purchaseDataDto: PurchaseDataDto): Promise<DataPurchaseResponse> {
        return this.purchaseService.purchaseData(purchaseDataDto);
    }
}

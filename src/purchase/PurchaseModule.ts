import {Module} from "@nestjs/common";
import {PurchaseController} from "./PurchaseController";
import {PurchaseService} from "./PurchaseService";
import {AccountModule} from "../account";

@Module({
    controllers: [PurchaseController],
    providers: [PurchaseService],
    imports: [AccountModule]
})
export class PurchaseModule {}

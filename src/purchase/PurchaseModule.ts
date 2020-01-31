import {Module} from "@nestjs/common";
import {PurchaseController} from "./PurchaseController";
import {PurchaseService} from "./PurchaseService";
import {AccountModule} from "../account";
import {Web3Module} from "../web3";

@Module({
    controllers: [PurchaseController],
    providers: [PurchaseService],
    imports: [AccountModule, Web3Module]
})
export class PurchaseModule {}

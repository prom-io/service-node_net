import {Module} from "@nestjs/common";
import Axios from "axios";
import {PurchaseController} from "./PurchaseController";
import {PurchaseService} from "./PurchaseService";
import {AccountModule} from "../account";
import {Web3Module} from "../web3";
import {DiscoveryModule} from "../discovery";

@Module({
    controllers: [PurchaseController],
    providers: [
        PurchaseService,
        {
            provide: "purchaseServiceAxiosInstance",
            useValue: Axios.create()
        }
    ],
    imports: [AccountModule, Web3Module, DiscoveryModule]
})
export class PurchaseModule {}

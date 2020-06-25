import {Module} from "@nestjs/common";
import {AccountModule} from "./account";
import {LoggerModule} from "./logging";
import {NedbModule} from "./nedb";
import {BillingApiModule} from "./billing-api";
import {FileModule} from "./file";
import {TransactionModule} from "./transaction";
import {PurchaseModule} from "./purchase";
import {DiscoveryModule} from "./discovery";
import {StatusCheckModule} from "./status-check";
import {DataValidatorApiModule} from "./data-validator-api";

@Module({
    imports: [
        AccountModule,
        LoggerModule,
        NedbModule,
        BillingApiModule,
        FileModule,
        TransactionModule,
        PurchaseModule,
        DiscoveryModule,
        StatusCheckModule,
        DataValidatorApiModule
    ]
})
export class AppModule {}

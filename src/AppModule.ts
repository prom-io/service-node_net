import {Module} from "@nestjs/common";
import {AccountModule} from "./account";
import {LoggerModule} from "./logging";
import {NedbModule} from "./nedb";
import {BillingApiModule} from "./billing-api";
import {FileModule} from "./file";
import {TransactionModule} from "./transaction";
import {PurchaseModule} from "./purchase";

@Module({
    imports: [
        AccountModule,
        LoggerModule,
        NedbModule,
        BillingApiModule,
        FileModule,
        TransactionModule,
        PurchaseModule
    ]
})
export class AppModule {}

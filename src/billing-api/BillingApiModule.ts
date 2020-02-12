import {Module, Global} from "@nestjs/common";
import Axios from "axios";
import {BillingApiClient} from "./BillingApiClient";
import {config} from "../config";

@Global()
@Module({
    providers: [
        {
            provide: "billingApiAxiosInstance",
            useValue: Axios.create({
                baseURL: config.BILLING_API_BASE_URL
            })
        },
        BillingApiClient
    ],
    exports: [
        BillingApiClient
    ]
})
export class BillingApiModule {}

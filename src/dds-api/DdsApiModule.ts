import {Module} from "@nestjs/common";
import Axios from "axios";
import {DdsApiClient} from "./DdsApiClient";
import {config} from "../config";

@Module({
    providers: [
        {
            provide: "ddsApiAxiosInstance",
            useValue: Axios.create({
                baseURL: config.DDS_API_BASE_URL
            })
        },
        DdsApiClient
    ],
    exports: [
        DdsApiClient
    ]
})
export class DdsApiModule {}

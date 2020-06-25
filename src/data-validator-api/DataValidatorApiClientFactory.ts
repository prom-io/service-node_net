import {Injectable} from "@nestjs/common"
import {DataValidatorApiClient} from "./DataValidatorApiClient";

export interface CreateDataValidatorApiClientOptions {
    scheme: string,
    ipAddress: string,
    port: number
}

@Injectable()
export class DataValidatorApiClientFactory {
    public createDataValidatorApiClientInstance(options: CreateDataValidatorApiClientOptions): DataValidatorApiClient {
        return new DataValidatorApiClient(options.scheme, options.ipAddress, options.port)
    }
}

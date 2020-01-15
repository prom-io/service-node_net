import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {BillingApiClient} from "../billing-api";
import {PurchaseDataDto} from "./types/request";
import {AccountService} from "../account";
import {purchaseDataDtoToPayForDataPurchaseRequest} from "./mappers";
import {LoggerService} from "nest-logger";
import {AxiosError} from "axios";

@Injectable()
export class PurchaseService {
    constructor(
        private readonly billingApiClient: BillingApiClient,
        private readonly accountService: AccountService,
        private readonly log: LoggerService
    ) {
    }

    public async purchaseData(purchaseDataDto: PurchaseDataDto): Promise<{success: boolean}> {
        this.log.debug(`Starting processing purchase of file ${purchaseDataDto.fileId} by data mart ${purchaseDataDto.dataMartAddress}`);
        const serviceNodeAddress = (await this.accountService.getDefaultAccount()).address;

        return this.billingApiClient.payForDataPurchase(purchaseDataDtoToPayForDataPurchaseRequest(purchaseDataDto, serviceNodeAddress))
            .then(() => {
                this.log.debug("Transaction has been successfully completed");
                return {success: true};
            })
            .catch((error: AxiosError) => {
                let message = "Billing API is unreachable";
                const responseStatus = HttpStatus.INTERNAL_SERVER_ERROR;

                if (error.response) {
                    message = `Billing API responded with ${error.response.status} status when tried to pay for data purchase`;
                }

                this.log.error(message);
                console.log(error);
                throw new HttpException(message, responseStatus);
            })
    }
}

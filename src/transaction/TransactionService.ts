import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {LoggerService} from "nest-logger";
import {billingTransactionResponseToTransactionResponse} from "./mappers";
import {BillingApiClient} from "../billing-api";
import {TransactionType} from "../billing-api/types/response";
import {TransactionResponse} from "./types/response";

@Injectable()
export class TransactionService {
    constructor(private readonly billingApiClient: BillingApiClient, private readonly log: LoggerService) {
    }

    public async getTransactionsOfAddress(
        address: string,
        type: TransactionType,
        page: number,
        pageSize: number
    ): Promise<TransactionResponse[]> {
        this.log.debug(`Retrieving transactions of address ${address} with ${type} type`);

        try {
            return (await this.billingApiClient.getTransactionsOfAddressByType(
                address,
                type,
                page + 1,
                pageSize
            ))
                .data
                .items
                .map(transaction => billingTransactionResponseToTransactionResponse(transaction))
        } catch (error) {
            let errorMessage: string;
            if (error.response) {
                errorMessage = `Error occurred when tried to fetch transactions, Service node responded with ${error.response.status} status`;
            } else {
                errorMessage = "Billing API is unreachable";
            }

            this.log.error(errorMessage);
            console.log(error);

            throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async getAllTransactionsOfAddress(
        address: string,
        page: number,
        pageSize: number
    ): Promise<TransactionResponse[]> {
        return (await this.billingApiClient.getTransactions(address, page, pageSize))
            .data
            .data
            .map(transaction => billingTransactionResponseToTransactionResponse(transaction))
    }
}

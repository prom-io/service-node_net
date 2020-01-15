import {Injectable} from "@nestjs/common";
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
        return (await this.billingApiClient.getTransactionsOfAddressByType(
            address,
            type,
            page,
            pageSize
        ))
            .data
            .data
            .map(transaction => billingTransactionResponseToTransactionResponse(transaction))
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

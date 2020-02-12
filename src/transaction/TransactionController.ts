import {Controller, Get, Param, Query} from "@nestjs/common";
import {TransactionService} from "./TransactionService";
import {TransactionResponse} from "./types/response";
import {TransactionType} from "../billing-api/types/response";
import {getValidPage, getValidPageSize} from "../utils/pagination";

@Controller("api/v1/transactions")
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) {
    }

    @Get(":address")
    public getTransactionsOfAddress(
        @Param("address") address: string,
        @Query("page") page: string,
        @Query("size") pageSize: string,
        @Query("type") type?: string
    ): Promise<TransactionResponse[]> {
        const validPage = getValidPage(page);
        const validPageSize = getValidPageSize(pageSize);

        if (type && (type === "dataUpload" || type === "dataPurchase")) {
            const transactionType = type === "dataUpload" ? TransactionType.DATA_UPLOAD : TransactionType.DATA_PURCHASE;
            return this.transactionService.getTransactionsOfAddress(address, transactionType, validPage, validPageSize);
        } else {
            return this.transactionService.getAllTransactionsOfAddress(address, validPage, validPageSize);
        }
    }
}

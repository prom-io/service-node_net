import {BillingTransactionResponse} from "./BillingTransactionResponse";

export interface BillingTransactionsResponse {
    items: BillingTransactionResponse[],
    meta: {
        totalItems: number,
        itemsCount: number,
        itemsPerPage: string,
        totalPages: number,
        currentPage: string
    }
}

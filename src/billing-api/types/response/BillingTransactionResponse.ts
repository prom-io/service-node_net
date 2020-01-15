import {TransactionType} from "./TransactionType";

export interface BillingTransactionResponse {
    id: string,
    hash: string,
    txType: TransactionType,
    dataOwner: string,
    dataMart: string,
    dataValidator: string,
    blockNumber: number,
    serviceNode: string,
    queueNumber: number,
    value: string,
    status: boolean,
    created_at: string
}

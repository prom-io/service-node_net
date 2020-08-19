import {TransactionType} from "./TransactionType";

export interface BillingTransactionResponse {
    id: number,
    fileUuid: string,
    hash: string,
    txType: TransactionType,
    dataOwner: string,
    dataMart: string,
    dataValidator: string,
    blockNumber: number,
    serviceNode: string,
    queueNumber: number,
    amount: string,
    status: boolean,
    createdAt: string,
    valueInServiceNode: string,
    valueInDataMart: string,
    valueInDataValidator: string,
    valueInDataOwner: string,
    valueOutServiceNode: string,
    valueOutDataValidator: string,
    valueOutDataMart: string,
    valueOutDataOwner: string
}

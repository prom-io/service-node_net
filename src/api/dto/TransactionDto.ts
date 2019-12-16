import {TransactionType} from "../../billing-api";

// tslint:disable-next-line:interface-name
export interface TransactionDto {
    id: string,
    hash: string,
    value: number,
    dataValidator: string,
    dataMart: string,
    dataOwner: string,
    blockNumber: number,
    queueNumber: number,
    status: boolean,
    serviceNode: string,
    created_at: string,
    type: TransactionType
}

import {TransactionType} from "../../billing-api";

// tslint:disable-next-line:interface-name
export interface TransactionDto {
    id: string,
    hash: string,
    value: number,
    from: string,
    to: string,
    status: boolean,
    serviceNode: string,
    type: TransactionType
}

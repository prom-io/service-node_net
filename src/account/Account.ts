import {IBaseEntity} from "../nedb/entity";

export interface Account extends IBaseEntity {
    address: string,
    accountType: string,
    default: boolean
}

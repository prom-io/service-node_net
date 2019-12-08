// tslint:disable:interface-name

import {FileMetadata} from "../dto";

export enum EntityType {
    ACCOUNT = "account",
    LOCAL_FILE_RECORD = "localFileRecord",
    DATA_OWNERS_OF_DATA_VALIDATOR = "dataOwnersOfDataValidator"
}

export interface IBaseEntity {
    _type: EntityType,
    _id?: string
}

export interface Account extends IBaseEntity{
    address: string,
    accountType: string
}

export interface LocalFileRecord extends IBaseEntity {
    name: string,
    localPath: string,
    extension: string,
    mimeType: string,
    size: number,
    metadata: FileMetadata,
    serviceNodeAddress: string,
    dataValidatorAddress: string,
    dataOwnerAddress: string,
    keepUntil: string,
    uploadedToDds: boolean,
    failed: boolean,
    ddsId?: string,
    price?: number,
    deletedLocally: boolean,
    createdAt: number
}

export interface DataOwnersOfDataValidator extends IBaseEntity {
    dataValidatorAddress: string,
    dataOwners: string[]
}

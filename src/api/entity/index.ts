// tslint:disable:interface-name

import {FileMetadata} from "../dto";

export interface IBaseEntity {
    _type: string,
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
    dataOwnerAddress: string
}

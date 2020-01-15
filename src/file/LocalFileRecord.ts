import {FileMetadata} from "./types";
import {IBaseEntity} from "../nedb/entity";

export interface LocalFileRecord extends IBaseEntity {
    name: string,
    localPath: string,
    extension: string,
    mimeType: string,
    size: number,
    metadata: FileMetadata,
    serviceNodeAddress: string,
    dataValidatorAddress: string,
    dataOwnerAddress?: string,
    privateKey?: string,
    keepUntil: string,
    uploadedToDds: boolean,
    failed: boolean,
    ddsId?: string,
    price: number,
    storagePrice?: number,
    deletedLocally: boolean,
}

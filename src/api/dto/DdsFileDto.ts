import {FileMetadata} from "./FileMetadata";

// tslint:disable-next-line:interface-name
export interface DdsFileDto {
    id: string,
    metadata: FileMetadata,
    dataValidator: string,
    dataOwner: string,
    serviceNode: string,
    keepUntil: string,
    extension: string,
    mimeType: string,
    size: number,
    price: number,
    name: string
}

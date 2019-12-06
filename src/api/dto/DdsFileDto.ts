import {FileMetadata} from "./FileMetadata";

// tslint:disable-next-line:interface-name
export interface DdsFileDto {
    id: string,
    metadata: FileMetadata,
    dataValidator: string,
    extension: string,
    mimeType: string,
    size: number,
    price: number,
    name: string
}

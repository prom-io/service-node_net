import {FileMetadata} from "./FileMetadata";

// tslint:disable-next-line:interface-name
export interface LocalFileRecordDto {
    id: string,
    name: string,
    extension: string,
    mimeType: string,
    size: number,
    metadata: FileMetadata,
    deletedLocally: boolean,
    createdAt: number
}

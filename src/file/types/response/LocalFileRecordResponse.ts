import {FileMetadata} from "../FileMetadata";

export interface LocalFileRecordResponse {
    id: string,
    name: string,
    extension: string,
    mimeType: string,
    size: number,
    metadata: FileMetadata,
    deletedLocally: boolean
}

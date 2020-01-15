import {FileMetadata} from "../FileMetadata";

export interface DdsFileResponse {
    id: string,
    metadata: FileMetadata,
    dataValidator: string,
    dataOwner?: string,
    serviceNode: string,
    keepUntil: string,
    extension: string,
    mimeType: string,
    size: number,
    price: number,
    name: string
}

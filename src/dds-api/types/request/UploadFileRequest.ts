import {DdsFileMetadata} from "../DdsFileMetadata";

export interface UploadFileRequest {
    name: string,
    data: string,
    duration: number | undefined,
    additional: DdsFileMetadata
}

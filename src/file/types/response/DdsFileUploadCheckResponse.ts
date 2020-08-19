import {FileUploadingStage} from "../FileUploadingStage";

export interface DdsFileUploadCheckResponse {
    fullyUploaded: boolean,
    failed: boolean,
    failedAtStage?: FileUploadingStage,
    ddsFileId?: string,
    price?: number,
    storagePrice?: number,
    dataOwner?: string,
    privateKey?: string
}

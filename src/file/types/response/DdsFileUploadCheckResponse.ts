export interface DdsFileUploadCheckResponse {
    fullyUploaded: boolean,
    failed: boolean,
    ddsFileId?: string,
    price?: number,
    storagePrice?: number,
    dataOwner?: string,
    privateKey?: string
}

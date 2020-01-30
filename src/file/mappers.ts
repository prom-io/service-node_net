import {differenceInSeconds} from "date-fns";
import {CreateLocalFileRecordDto} from "./types/request";
import {LocalFileRecord} from "./LocalFileRecord";
import {EntityType} from "../nedb/entity";
import {DdsFileResponse, DdsFileUploadCheckResponse, LocalFileRecordResponse} from "./types/response";
import {BillingFileResponse} from "../billing-api/types/response";
import {UploadFileRequest} from "../dds-api/types/request";
import {PayForDataUploadRequest} from "../billing-api/types/request";

export const createDdsFileUploadCheckResponseFromLocalFileRecord = (localFileRecord: LocalFileRecord): DdsFileUploadCheckResponse => {
    if (localFileRecord.uploadedToDds) {
        return {
            ddsFileId: localFileRecord.ddsId,
            price: localFileRecord.price,
            failed: false,
            fullyUploaded: true,
            storagePrice: localFileRecord.storagePrice,
            dataOwner: localFileRecord.dataOwnerAddress,
            privateKey: localFileRecord.privateKey
        }
    } else if (localFileRecord.failed) {
        return {
            fullyUploaded: false,
            failed: true
        }
    } else {
        return {
            fullyUploaded: false,
            failed: false
        }
    }
};

export const createLocalFileRecordDtoToLocalFileRecord = (
    createLocalFileRecordDto: CreateLocalFileRecordDto,
    id: string, localPath: string,
    serviceNodeAddress: string
): LocalFileRecord => {
    return {
        _type: EntityType.LOCAL_FILE_RECORD,
        _id: id,
        localPath,
        extension: createLocalFileRecordDto.extension,
        metadata: createLocalFileRecordDto.additional,
        mimeType: createLocalFileRecordDto.mimeType,
        name: createLocalFileRecordDto.name,
        size: createLocalFileRecordDto.size,
        dataValidatorAddress: createLocalFileRecordDto.dataValidatorAddress,
        serviceNodeAddress,
        dataOwnerAddress: createLocalFileRecordDto.dataOwnerAddress || "0x0",
        keepUntil: createLocalFileRecordDto.keepUntil,
        uploadedToDds: false,
        failed: false,
        deletedLocally: false,
        price: createLocalFileRecordDto.price,
    };
};

export const localFileRecordToLocalFileRecordResponse = (localFileRecord: LocalFileRecord): LocalFileRecordResponse => ({
    size: localFileRecord.size,
    extension: localFileRecord.extension,
    name: localFileRecord.name,
    id: localFileRecord._id!,
    mimeType: localFileRecord.mimeType,
    metadata: localFileRecord.metadata,
    deletedLocally: localFileRecord.deletedLocally
});

export const localFileRecordToDdsFileResponse = (localFileRecord: LocalFileRecord): DdsFileResponse => ({
    id: localFileRecord.ddsId!,
    dataOwner: localFileRecord.dataOwnerAddress,
    dataValidator: localFileRecord.dataValidatorAddress,
    extension: localFileRecord.extension,
    keepUntil: localFileRecord.keepUntil,
    metadata: localFileRecord.metadata,
    mimeType: localFileRecord.mimeType,
    price: localFileRecord.price!,
    serviceNode: localFileRecord.serviceNodeAddress,
    size: localFileRecord.size,
    name: localFileRecord.name
});

export const billingFileToDdsFileResponse = (billingFile: BillingFileResponse): DdsFileResponse => ({
    id: billingFile.id,
    dataOwner: billingFile.data_owner,
    dataValidator: billingFile.owner,
    extension: billingFile.file_extension,
    metadata: JSON.parse(billingFile.meta_data),
    price: Number(billingFile.buy_sum),
    keepUntil: "",
    mimeType: billingFile.mime_type,
    name: billingFile.name,
    serviceNode: "",
    size: billingFile.size
});

export const localFileRecordToDdsUploadRequest = (localFileRecord: LocalFileRecord, data: string): UploadFileRequest => {
    const hashTags = JSON.stringify(localFileRecord.metadata.hashTags);

    return {
        name: localFileRecord.name,
        duration: differenceInSeconds(new Date(localFileRecord.keepUntil), new Date()),
        data,
        additional: {
            ...localFileRecord.metadata,
            hashTags
        }
    };
};

export const localFileRecordToPayForDataUploadRequest = (
    localFileRecord: LocalFileRecord,
    uploadPrice: number,
    fileId: string,
    privateKey: string
): PayForDataUploadRequest => ({
    sum: "" + uploadPrice,
    data_owner: localFileRecord.dataOwnerAddress,
    data_validator: localFileRecord.dataValidatorAddress,
    buy_sum: "" + localFileRecord.price,
    extension: localFileRecord.extension,
    id: fileId,
    mime_type: localFileRecord.mimeType,
    name: localFileRecord.name,
    service_node: localFileRecord.serviceNodeAddress,
    size: localFileRecord.size,
    meta_data: JSON.stringify(localFileRecord.metadata),
    private_key: privateKey
});

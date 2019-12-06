import {BillingFileResponse} from "../../billing-api";
import {
    CreateLocalFileRecordDto,
    DdsFileDto,
    DdsFileUploadCheckResponse,
    LocalFileRecordDto,
    UploadFileDto
} from "../dto";
import {EntityType, LocalFileRecord} from "../entity";

export const createUploadFileDtoFromLocalFileRecord = (localFileRecord: LocalFileRecord, data: string): UploadFileDto => {
    return UploadFileDto.fromObject({
        dataValidatorAddress: localFileRecord.dataValidatorAddress,
        serviceNodeAddress: localFileRecord.serviceNodeAddress,
        mimeType: localFileRecord.mimeType,
        additional: localFileRecord.metadata,
        size: localFileRecord.size,
        extension: localFileRecord.extension,
        keepUntil: localFileRecord.keepUntil,
        data,
        name: localFileRecord.name,
        dataOwnerAddress: localFileRecord.dataOwnerAddress
    });
};

export const createDdsFileUploadCheckResponseFromLocalFileRecord = (localFileRecord: LocalFileRecord): DdsFileUploadCheckResponse => {
    if (localFileRecord.uploadedToDds) {
        return {
            ddsFileId: localFileRecord.ddsId,
            price: localFileRecord.price,
            failed: false,
            fullyUploaded: true
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

export const createLocalFileRecordDtoToLocalFileRecord = (createLocalFileRecordDto: CreateLocalFileRecordDto, id: string, localPath: string): LocalFileRecord => {
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
        serviceNodeAddress: createLocalFileRecordDto.serviceNodeAddress,
        dataOwnerAddress: createLocalFileRecordDto.dataOwnerAddress,
        keepUntil: createLocalFileRecordDto.keepUntil,
        uploadedToDds: false,
        failed: false,
        deletedLocally: false
    };
};

export const localFileRecordToLocalFileRecordDto = (localFileRecord: LocalFileRecord): LocalFileRecordDto => ({
    size: localFileRecord.size,
    extension: localFileRecord.extension,
    name: localFileRecord.name,
    id: localFileRecord._id!,
    mimeType: localFileRecord.mimeType,
    metadata: localFileRecord.metadata,
    deletedLocally: localFileRecord.deletedLocally
});

export const localFileRecordToDdsFileDto = (localFileRecord: LocalFileRecord): DdsFileDto => ({
    id: localFileRecord.ddsId!,
    dataValidator: localFileRecord.dataValidatorAddress,
    extension: localFileRecord.extension,
    metadata: localFileRecord.metadata,
    mimeType: localFileRecord.mimeType,
    price: localFileRecord.price!,
    size: localFileRecord.size,
    name: localFileRecord.name
});

export const billingFileToDdsFile = (billingFile: BillingFileResponse): DdsFileDto => ({
    id: billingFile.id,
    size: Number(billingFile.size),
    price: Number(billingFile.sum),
    dataValidator: billingFile.owner,
    mimeType: billingFile.mime_type,
    metadata: {},
    extension: billingFile.file_extension,
    name: billingFile.name
});

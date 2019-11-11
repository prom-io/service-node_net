import {AxiosError} from "axios";
import {addMonths, differenceInSeconds, parse} from "date-fns";
import fileSystem from "fs";
import DataStore from "nedb";
import uuid from "uuid/v4"
import {BillingApiClient} from "../../billing-api";
import {DdsApiClient, DdsApiResponse, ExtendFileStorageResponse, FileInfo} from "../../dds-api";
import {
    CreateLocalFileRecordDto,
    DdsFileUploadCheckResponse,
    ExtendFileStorageDurationDto,
    LocalFileRecordDto,
    UploadChunkDto,
    UploadFileDto
} from "../dto";
import {LocalFileRecord} from "../entity";
import {
    BillingApiErrorException,
    DdsErrorException,
    FileNotFoundException,
    LocalFileNotFoundException
} from "../exceptions";

export class FilesService {
    private ddsApiClient: DdsApiClient;
    private billingApiClient: BillingApiClient;
    private repository: DataStore;

    constructor(ddsApiClient: DdsApiClient, billingApiClient: BillingApiClient, repository: DataStore) {
        this.ddsApiClient = ddsApiClient;
        this.billingApiClient = billingApiClient;
        this.repository = repository;
    }

    public createLocalFileRecord(createLocalFileRecordDto: CreateLocalFileRecordDto): Promise<LocalFileRecordDto> {
        return new Promise<LocalFileRecordDto>((resolve, reject) => {
            const fileId = uuid();
            const localPath = `${process.env.TEMPORARY_FILES_DIRECTORY}/${fileId}`;
            fileSystem.closeSync(fileSystem.openSync(localPath, "w"));
            const localFileRecord: LocalFileRecord = {
                _type: "localFileRecord",
                _id: fileId,
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
                failed: false
            };

            this.repository.insert(localFileRecord, (error, document) => resolve({
                size: document.size,
                extension: document.extension,
                name: document.name,
                id: document._id!,
                mimeType: localFileRecord.mimeType,
                metadata: localFileRecord.metadata
            }));
        })
    }

    public writeFileChunk(localFileId: string, uploadChunkDto: UploadChunkDto): Promise<{success: boolean}> {
        return new Promise<{success: boolean}>((resolve, reject) => {
            this.repository.findOne<LocalFileRecord>({_type: "localFileRecord", _id: localFileId}, ((error, document) => {
                if (document == null) {
                    reject(new LocalFileNotFoundException(`Could not find local file with id ${localFileId}`));
                } else {
                    fileSystem.appendFileSync(document.localPath, uploadChunkDto.chunkData);
                    resolve({success: true});
                }
            }))
        })
    }

    public uploadLocalFileToDds(localFileId: string): Promise<{success: boolean}> {
        return new Promise<{success: boolean}>((resolve, reject) => {
            this.repository.findOne<LocalFileRecord>({_type: "localFileRecord", _id: localFileId}, ((error, document) => {
                if (document == null) {
                    reject(new LocalFileNotFoundException(`Could not find local file with id ${localFileId}`));
                } else {
                    const data = fileSystem.readFileSync(document.localPath).toString();
                    const uploadFileDto = UploadFileDto.fromObject({
                        dataValidatorAddress: document.dataValidatorAddress,
                        serviceNodeAddress: document.serviceNodeAddress,
                        mimeType: document.mimeType,
                        additional: document.metadata,
                        size: document.size,
                        extension: document.extension,
                        keepUntil: document.keepUntil,
                        data,
                        name: document.name,
                        dataOwnerAddress: document.dataOwnerAddress
                    });
                    this.uploadData(uploadFileDto, localFileId);
                    resolve({success: true});
                }
            }))
        })
    }

    public checkIfLocalFileFullyUploadedToDds(localFileId: string): Promise<DdsFileUploadCheckResponse> {
        return new Promise<DdsFileUploadCheckResponse>((resolve, reject) => {
            this.repository.findOne<LocalFileRecord>({_type: "localFileRecord", _id: localFileId}, (error, document) => {
                if (document === null) {
                    reject(new LocalFileNotFoundException(`Could not find local file with id ${localFileId}`))
                } else {
                    if (document.uploadedToDds) {
                        resolve({
                            ddsFileId: document.ddsId,
                            price: document.price,
                            failed: false,
                            fullyUploaded: true
                        })
                    } else if (document.failed) {
                        resolve({
                            fullyUploaded: false,
                            failed: true
                        })
                    } else {
                        resolve({fullyUploaded: false, failed: false});
                    }
                }
            })
        })
    }

    // tslint:disable-next-line:no-unnecessary-initializer
    public uploadData(uploadFileDto: UploadFileDto, localFileId: string | undefined = undefined): Promise<DdsApiResponse<FileInfo>> {
        return new Promise(async (resolve, reject) => {
            try {
                const ddsResponse = await this.uploadFileToDds(uploadFileDto);
                const price = ddsResponse.data.attributes.price;
                await this.payForDataUpload(
                    uploadFileDto,
                    price,
                    ddsResponse.data.id
                );
                await this.ddsApiClient.notifyPaymentStatus({
                    status: "success",
                    file_id: ddsResponse.data.id,
                    amount: price
                });
                
                if (localFileId) {
                    this.repository.update<LocalFileRecord>(
                        {
                            _id:
                            localFileId
                        },
                        {
                            $set: {
                                failed: false,
                                price: ddsResponse.data.attributes.price,
                                ddsId: ddsResponse.data.id,
                                uploadedToDds: true
                            }
                        })
                }
                
                resolve(ddsResponse);
            } catch (error) {
                console.log("Error occurred when uploading file");
                if (error.response) {
                    console.log(error.response);
                }
                if (localFileId) {
                    this.repository.update<LocalFileRecord>({
                            _id: localFileId
                        },
                        {
                            $set: {
                                failed: true
                            }
                        })
                }
                
                reject(error);
            }
        })
    }

    public extendStorageDuration(fileId: string, extendFileStorageDurationDto: ExtendFileStorageDurationDto): Promise<DdsApiResponse<ExtendFileStorageResponse>> {
        return new Promise(async (resolve, reject) => {
            try {
                const extendStorageDurationResponse = await this.extendFileStorageDuration(fileId, extendFileStorageDurationDto);
                resolve(extendStorageDurationResponse);
            } catch (error) {
                reject(error);
            }
        })
    }

    public getFileInfo(fileId: string): Promise<DdsApiResponse<FileInfo>> {
        return new Promise((resolve, reject) => {
            this.ddsApiClient.getFileInfo(fileId)
                .then(({data}) => resolve(data))
                .catch(error => {
                    if (error.response) {
                        if (error.response.status === 404) {
                            reject(new FileNotFoundException(`File with id ${fileId} was not found`))
                        } else {
                            reject(new DdsErrorException(`DDS API responded with ${error.response.status} status`, error.response.status));
                        }
                    } else {
                        reject(new DdsErrorException("DDS API is unreachable"));
                    }
                })
        })
    }

    private uploadFileToDds(uploadFileDto: UploadFileDto): Promise<DdsApiResponse<FileInfo>> {
        const additional = uploadFileDto.additional;
        additional.extension = uploadFileDto.extension;
        additional.size = uploadFileDto.size.toString(10);
        additional.mimeType = uploadFileDto.mimeType;

        return new Promise((resolve, reject) => {
            this.ddsApiClient.uploadFile({
                additional: uploadFileDto.additional,
                data: uploadFileDto.data,
                duration: differenceInSeconds(
                    parse(uploadFileDto.keepUntil,
                        "yyyy-MM-dd'T'hh:mm:ss'Z'",
                        addMonths(new Date(), 1)
                    ), new Date()),
                name: uploadFileDto.name
            }).then(({data}) => {
                resolve({
                    ...data,
                    data: {
                        ...data.data,
                        attributes: {
                            ...data.data.attributes,
                            price: data.data.attributes.price / 10000 // Gotta do this replacement because stub DDS service returns
                                                                      // 100.5 ETH as storage price which is too huge.
                                                                      // TODO: remove this replacement when DDS starts to make actual calculations
                        }
                    }
                });
            }).catch((ddsError: AxiosError) => {
                console.log(ddsError);
                if (ddsError.response) {
                    reject(new DdsErrorException(`DDS responded with ${ddsError.response.status} status`, ddsError.response.status))
                } else {
                    reject(new DdsErrorException(`DDS is unreachable`))
                }
            })
        })
    }

    private payForDataUpload(uploadFileDto: UploadFileDto, price: number, fileId: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.billingApiClient.payForDataUpload({
                sum: "" + price,
                data_owner: uploadFileDto.dataOwnerAddress,
                owner: uploadFileDto.dataValidatorAddress,
                data_price: "" + price,
                extension: uploadFileDto.extension,
                id: fileId,
                mime_type: uploadFileDto.mimeType,
                name: uploadFileDto.name,
                service_node: uploadFileDto.serviceNodeAddress,
                size: uploadFileDto.size
            }).then(() => {
                resolve();
            }).catch((billingError: AxiosError) => {
                console.log(billingError);
                if (billingError.response) {
                    reject(new BillingApiErrorException(`Billing API responded with ${billingError.response.status} status`))
                } else {
                    reject(new BillingApiErrorException("Billing API is unreachable"));
                }
            })
        })
    }

    private extendFileStorageDuration(fileId: string, extendFileStorageDurationDto: ExtendFileStorageDurationDto): Promise<DdsApiResponse<ExtendFileStorageResponse>> {
        return new Promise((resolve, reject) => {
            this.ddsApiClient.extendFileStorageDuration(fileId, {
                duration: differenceInSeconds(
                    parse(extendFileStorageDurationDto.keepUntil,
                        "yyyy-MM-dd'T'hh:mm:ss'Z'",
                        addMonths(new Date(), 1)
                    ), new Date()),
                additional: extendFileStorageDurationDto.additional
            })
                .then(({data}) => resolve(data))
                .catch((error: AxiosError) => {
                    if (error.response) {
                        if (error.response.status === 404) {
                            reject(new FileNotFoundException(`Could not find file with id ${fileId}`));
                        } else {
                            reject(new DdsErrorException(`DDS API responded with ${error.response.status} status`, error.response.status));
                        }
                    } else {
                        reject(new DdsErrorException("DDS API is unreachable"));
                    }
                })
        })
    }
}

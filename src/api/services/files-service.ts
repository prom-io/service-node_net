import {AxiosError} from "axios";
import {addMonths, differenceInSeconds, parse} from "date-fns";
import {Response} from "express";
import fileSystem from "fs";
import uuid from "uuid/v4"
import {BillingApiClient} from "../../billing-api";
import {DdsApiClient, DdsApiResponse, ExtendFileStorageResponse, FileInfo} from "../../dds-api";
import {
    CreateLocalFileRecordDto,
    DdsFileDto,
    DdsFileUploadCheckResponse,
    ExtendFileStorageDurationDto,
    LocalFileRecordDto,
    PaginationDto,
    UploadChunkDto,
    UploadFileDto
} from "../dto";
import {LocalFileRecord} from "../entity";
import {
    BillingApiErrorException,
    DdsErrorException,
    FileNotFoundException,
    LocalFileHasAlreadyBeenDeletedException
} from "../exceptions";
import {FilesRepository} from "../repositories";
import {
    billingFileToDdsFile,
    createDdsFileUploadCheckResponseFromLocalFileRecord,
    createLocalFileRecordDtoToLocalFileRecord,
    createUploadFileDtoFromLocalFileRecord,
    localFileRecordToDdsFileDto,
    localFileRecordToLocalFileRecordDto
} from "../utils";

export class FilesService {
    private ddsApiClient: DdsApiClient;
    private billingApiClient: BillingApiClient;
    private filesRepository: FilesRepository;

    constructor(ddsApiClient: DdsApiClient, billingApiClient: BillingApiClient, filesRepository: FilesRepository) {
        this.ddsApiClient = ddsApiClient;
        this.billingApiClient = billingApiClient;
        this.filesRepository = filesRepository;
    }

    public findAllFiles(paginationDto: PaginationDto): Promise<DdsFileDto[]> {
        return this.filesRepository.findAllNotFailed(paginationDto)
            .then(files => files.map(file => localFileRecordToDdsFileDto(file)));
        /*
        return new Promise<DdsFileDto[]>((resolve, reject) => {
            this.billingApiClient.getFiles(paginationDto.page, paginationDto.size)
                .then(({data}) => resolve(data.data.map(file => billingFileToDdsFile(file))))
                .catch((error: AxiosError) => {
                    if (error.response) {
                        reject(new BillingApiErrorException(`Billing API responded with ${error.response.status} status`));
                    } else {
                        reject(new BillingApiErrorException("Billing API is unreachable"));
                    }
                })
        })
        */
    }

    public createLocalFileRecord(createLocalFileRecordDto: CreateLocalFileRecordDto): Promise<LocalFileRecordDto> {
        const fileId = uuid();
        const localPath = `${process.env.TEMPORARY_FILES_DIRECTORY}/${fileId}`;
        fileSystem.closeSync(fileSystem.openSync(localPath, "w"));
        const localFile: LocalFileRecord = createLocalFileRecordDtoToLocalFileRecord(
            createLocalFileRecordDto,
            fileId,
            localPath
        );

        return this.filesRepository.save(localFile).then(saved => localFileRecordToLocalFileRecordDto(saved));
    }

    public deleteLocalFileRecord(localFileId: string): Promise<void> {
        return this.filesRepository.findById(localFileId)
            .then(localFile => {
                if (localFile.deletedLocally) {
                    throw new LocalFileHasAlreadyBeenDeletedException(`Local file with id ${localFileId} has already been deleted`);
                } else {
                    if (fileSystem.existsSync(localFile.localPath)) {
                        fileSystem.unlink(localFile.localPath, error => {
                            if (error) {
                                console.log(error);
                            }

                            localFile.deletedLocally = true;
                            return this.filesRepository.save(localFile).then(() => {
                                return;
                            });
                        })
                    }
                }
            });
    }

    public writeFileChunk(localFileId: string, uploadChunkDto: UploadChunkDto): Promise<{success: boolean}> {
        return this.filesRepository.findById(localFileId).then(localFile => {
            fileSystem.appendFileSync(localFile.localPath, uploadChunkDto.chunkData);
            return {success: true};
        });
    }

    public uploadLocalFileToDds(localFileId: string): Promise<{success: boolean}> {
        return this.filesRepository.findById(localFileId)
            .then(localFile => {
                const data = fileSystem.readFileSync(localFile.localPath).toString();
                const uploadFileDto = createUploadFileDtoFromLocalFileRecord(localFile, data);
                this.uploadData(uploadFileDto, localFileId);
                return {success: true};
            });
    }

    public checkIfLocalFileFullyUploadedToDds(localFileId: string): Promise<DdsFileUploadCheckResponse> {
        return this.filesRepository.findById(localFileId)
            .then(localFile => createDdsFileUploadCheckResponseFromLocalFileRecord(localFile));
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
                    this.filesRepository.findById(localFileId).then(localFile => {
                        localFile.failed = false;
                        localFile.price = ddsResponse.data.attributes.price;
                        localFile.ddsId = ddsResponse.data.id;
                        localFile.uploadedToDds = true;

                        this.filesRepository.save(localFile).then(() => resolve(ddsResponse));
                    });
                }
            } catch (error) {
                console.log("Error occurred when uploading file");
                if (error.response) {
                    console.log(error.response);
                }

                if (localFileId) {
                    this.filesRepository.findById(localFileId)
                        .then(localFile => {
                            localFile.failed = true;
                            this.filesRepository.save(localFile).then(() => reject(error));
                        });
                }
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

    public getFile(fileId: string, httpResponse: Response): Promise<any> {
        console.log(`Retrieving file with id ${fileId}`);
        return this.ddsApiClient.getFile(fileId)
            .then(({data}) => {
                httpResponse.header('Content-Disposition', `attachment; filename=${fileId}`);
                data.pipe(httpResponse);
            });
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

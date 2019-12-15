import {AxiosError} from "axios";
import {addMonths, differenceInSeconds, parse} from "date-fns";
import {Response} from "express";
import fileSystem from "fs";
import path from "path";
import uuid from "uuid/v4"
import {BillingApiClient, PayForFileStorageExtensionRequest} from "../../billing-api";
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
    billingFileToDdsFileResponse,
    createDdsFileUploadCheckResponseFromLocalFileRecord,
    createLocalFileRecordDtoToLocalFileRecord,
    createUploadFileDtoFromLocalFileRecord,
    localFileRecordToDdsFileDto,
    localFileRecordToLocalFileRecordDto
} from "../utils";

const IGNORED_FILES = [
    "a9e5ec0f-517a-4292-b934-55ce578a473a",
    "6eea0b0c-c462-429f-a958-dfb496fc5e4c",
    "39bcd759-b547-4564-bb1e-6be03a23deda",
    "39bcd759-b547-4564-bb1e-6be03a23deda",
];

export class FilesService {
    private ddsApiClient: DdsApiClient;
    private billingApiClient: BillingApiClient;
    private filesRepository: FilesRepository;

    constructor(ddsApiClient: DdsApiClient, billingApiClient: BillingApiClient, filesRepository: FilesRepository) {
        this.ddsApiClient = ddsApiClient;
        this.billingApiClient = billingApiClient;
        this.filesRepository = filesRepository;
    }

    public async findAllFiles(paginationDto: PaginationDto): Promise<DdsFileDto[]> {
        const {data} = await this.billingApiClient.getFiles(paginationDto.page, paginationDto.size);
        console.log(data);
        return data.data.filter(file => !IGNORED_FILES.includes(file.id)).map(file => billingFileToDdsFileResponse(file))
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

    public async writeFileChunk(localFileId: string, uploadChunkDto: UploadChunkDto): Promise<{ success: boolean }> {
        const localFile = await this.filesRepository.findById(localFileId);
        fileSystem.appendFileSync(localFile.localPath, uploadChunkDto.chunkData);
        return {success: true};
    }

    public async uploadLocalFileToDds(localFileId: string): Promise<{ success: boolean }> {
        const localFile = await this.filesRepository.findById(localFileId);
        const data = fileSystem.readFileSync(localFile.localPath).toString();
        const uploadFileDto = createUploadFileDtoFromLocalFileRecord(localFile, data);
        this.uploadData(uploadFileDto, localFileId);
        return {success: true};
    }

    public async checkIfLocalFileFullyUploadedToDds(localFileId: string): Promise<DdsFileUploadCheckResponse> {
        const localFile = await this.filesRepository.findById(localFileId);
        return createDdsFileUploadCheckResponseFromLocalFileRecord(localFile);
    }

    // tslint:disable-next-line:no-unnecessary-initializer
    public uploadData(uploadFileDto: UploadFileDto, localFileId: string | undefined = undefined): Promise<DdsApiResponse<FileInfo>> {
        return new Promise(async (resolve, reject) => {
            try {
                const ddsResponse = await this.uploadFileToDds(uploadFileDto);
                const storagePrice = ddsResponse.data.attributes.price;
                await this.payForDataUpload(
                    uploadFileDto,
                    storagePrice,
                    ddsResponse.data.id
                );

                /*
                await this.ddsApiClient.notifyPaymentStatus({
                    status: "success",
                    file_id: ddsResponse.data.id,
                    amount: storagePrice
                });*/

                if (localFileId) {
                    this.filesRepository.findById(localFileId).then(localFile => {
                        localFile.failed = false;
                        localFile.price = uploadFileDto.price;
                        localFile.storagePrice = storagePrice;
                        localFile.ddsId = ddsResponse.data.id;
                        localFile.uploadedToDds = true;

                        this.filesRepository.save(localFile).then(() => resolve(ddsResponse));
                    });
                }
            } catch (error) {
                console.log("Error occurred when uploading file");
                console.log(error);
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

    public extendStorageDuration(fileId: string, extendFileStorageDurationDto: ExtendFileStorageDurationDto): Promise<{success: boolean}> {
        return new Promise(async (resolve, reject) => {
            try {
                const fileInfo = await this.getFileInfo(fileId);
                const extendStorageDurationResponse = await this.extendFileStorageDuration(fileId, extendFileStorageDurationDto);
                const payForFileStorageExtensionRequest: PayForFileStorageExtensionRequest = {
                    dataValidator: fileInfo.dataValidator,
                    serviceNode: fileInfo.serviceNode,
                    sum: extendStorageDurationResponse.data.attributes.price + ""
                };
                await this.billingApiClient.payForStorageDurationExtension(payForFileStorageExtensionRequest);
                resolve({success: true});
            } catch (error) {
                console.log(error);
                reject(error);
            }
        })
    }

    public getFileInfo(fileId: string): Promise<DdsFileDto> {
        console.log(`File id: ${fileId}`);
        return new Promise<DdsFileDto>(resolve => {
            this.filesRepository.findByDdsId(fileId).then(file => {
                console.log(file);
                resolve(localFileRecordToDdsFileDto(file));
            })
        })
        /*
        return new Promise<DdsApiResponse<FileInfo>>((resolve, reject) => {
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
        })*/
    }

    public async getFile(fileId: string, httpResponse: Response): Promise<any> {
        /*
        const {data} = await this.ddsApiClient.getFile(fileId);
        httpResponse.header('Content-Disposition', `attachment; filename=${fileId}`);
        data.pipe(httpResponse);*/
        httpResponse.download(`${process.env.DDS_STUB_FILES_DIRECTORY}/${fileId}`);
    }

    private uploadFileToDds(uploadFileDto: UploadFileDto): Promise<DdsApiResponse<FileInfo>> {
        const additional = uploadFileDto.additional;

        const hashTags = JSON.stringify(uploadFileDto.additional.hashTags);

        return new Promise((resolve, reject) => {
            this.ddsApiClient.uploadFile({
                data: uploadFileDto.data,
                duration: differenceInSeconds(new Date(uploadFileDto.keepUntil), new Date()),
                name: uploadFileDto.name,
                additional: {
                    ...additional,
                    hashTags
                }
            }).then(({data}) => {
                resolve(data);
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
                data_validator: uploadFileDto.dataValidatorAddress,
                buy_sum: "" + uploadFileDto.price,
                extension: uploadFileDto.extension,
                id: fileId,
                mime_type: uploadFileDto.mimeType,
                name: uploadFileDto.name,
                service_node: uploadFileDto.serviceNodeAddress,
                size: uploadFileDto.size,
                meta_data: JSON.stringify(uploadFileDto.additional)
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

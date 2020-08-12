import {HttpException, HttpStatus, Inject, Injectable} from "@nestjs/common";
import {LoggerService} from "nest-logger";
import uuid from "uuid/v4";
import fileSystem from "fs";
import {v4 as isV4UUID} from "is-uuid";
import {addMonths, differenceInSeconds, parse} from "date-fns";
import {Response} from "express";
import {AxiosInstance} from "axios";
import {FileUploadingStage} from "./types";
import {
    CreateLocalFileRecordDto,
    ExtendFileStorageDurationDto,
    UploadChunkDto,
    UploadLocalFileToDdsDto
} from "./types/request";
import {
    DdsFileResponse,
    DdsFileUploadCheckResponse,
    FilePriceAndKeepUntilMap,
    LocalFileRecordResponse
} from "./types/response";
import {LocalFileRecord} from "./LocalFileRecord";
import {
    billingFileToDdsFileResponse,
    createDdsFileUploadCheckResponseFromLocalFileRecord,
    createLocalFileRecordDtoToLocalFileRecord,
    localFileRecordToDdsFileResponse,
    localFileRecordToLocalFileRecordResponse,
    localFileRecordToPayForDataUploadRequest
} from "./mappers";
import {LocalFileRecordRepository} from "./LocalFileRecordRepository";
import {config} from "../config";
import {DdsApiClient} from "../dds-api";
import {BillingApiClient} from "../billing-api";
import {AccountService} from "../account";
import {PayForDataUploadResponse} from "../billing-api/types/response";
import {Web3Wrapper} from "../web3";
import {ISignedRequest, SignedRequest} from "../web3/types";
import {DiscoveryService} from "../discovery";
import {NodeType} from "../discovery/types";

@Injectable()
export class FileService {
    constructor(
        private readonly localFileRecordRepository: LocalFileRecordRepository,
        private readonly billingApiClient: BillingApiClient,
        private readonly ddsApiClient: DdsApiClient,
        private readonly accountService: AccountService,
        private readonly web3Wrapper: Web3Wrapper,
        private readonly discoveryService: DiscoveryService,
        @Inject("filesServiceAxiosInstance") private readonly axios: AxiosInstance,
        private readonly log: LoggerService
    ) {
    }

    public async getFile(fileId: string, httpResponse: Response): Promise<void> {
        try {
            this.log.debug(`Retrieving file with id ${fileId}`);

            if (isV4UUID(fileId)) {
                this.log.debug("File ID has UUID format");
                httpResponse.download(`${process.env.DDS_STUB_FILES_DIRECTORY}/${fileId}`);
                return ;
            }

            const {data} = await this.ddsApiClient.UNSTABLE_getFile(fileId);
            this.log.debug(`Retrieved file with id ${fileId}`);
            httpResponse.header("Content-Disposition", `attachment; filename=${fileId}`);
            data.pipe(httpResponse);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async cancelFileUpload(localFileRecordId: string, signedRequest: SignedRequest): Promise<void> {
        const file = await this.localFileRecordRepository.findById(localFileRecordId);

        if (!file) {
            throw new HttpException(
                `Could not find local file reroc with id ${localFileRecordId}`,
                HttpStatus.NOT_FOUND
            );
        }

        if (this.web3Wrapper.isSignatureValid(file.dataValidatorAddress, signedRequest)) {
            throw new HttpException(
                `Failed to verify signature`,
                HttpStatus.FORBIDDEN
            );
        }

        file.failed = true;
        await this.localFileRecordRepository.save(file);
        await this.deleteLocalFileRecord(localFileRecordId);
    }

    public async getFiles(page: number, pageSize: number): Promise<DdsFileResponse[]> {
        try {
            let files = (await this.billingApiClient.getFiles(page, pageSize)).data.data;
            const filesAndDataValidatorMap: {[dataValidator: string]: string[]} = {};

            files.forEach(file => {
                if (filesAndDataValidatorMap[file.owner]) {
                    filesAndDataValidatorMap[file.owner].push(file.id);
                } else {
                    filesAndDataValidatorMap[file.owner] = [file.id];
                }
            });

            for (const dataValidatorAddress of Object.keys(filesAndDataValidatorMap)) {
                const dataValidatorNodes = await this.discoveryService.getNodesByAddressAndType(dataValidatorAddress, NodeType.DATA_VALIDATOR_NODE);

                if (dataValidatorNodes.length !== 0) {
                    const dataValidatorNode = dataValidatorNodes[0];
                    try {
                        const url = `http://${dataValidatorNode.ipAddress}:${dataValidatorNode.port}/api/v3/files/price-and-keep-until-map?filesIds=${JSON.stringify(filesAndDataValidatorMap[dataValidatorAddress])}`;
                        const filePriceAndKeepUntilMap: FilePriceAndKeepUntilMap = (await this.axios.get(url)).data;

                        files = files.map(file => {
                            if (filePriceAndKeepUntilMap[file.id]) {
                                file.buy_sum = `${filePriceAndKeepUntilMap[file.id].price}`;
                                file.keep_until = `${filePriceAndKeepUntilMap[file.id].keepUntil}`;
                            }

                            return file;
                        });
                    } catch (error) {
                        console.log(error);
                    }
                }
            }

            return files.map(billingFile => billingFileToDdsFileResponse(billingFile));
        } catch (error) {
            if (error.response) {
                this.log.error(`Billing API responded with ${error.response.status} status`);
                console.log(error.response.data);
                throw new HttpException(`Billing API responded with ${error.response.status} status`, HttpStatus.INTERNAL_SERVER_ERROR);
            } else {
                this.log.error("Billing API is unreachable");
                throw new HttpException("Billing API is unreachable", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    public async getFileInfo(fileId: string): Promise<DdsFileResponse> {
        const localFile = await this.localFileRecordRepository.findByDdsId(fileId);
        return localFileRecordToDdsFileResponse(localFile);
    }

    public async extendFileStorageDuration(fileId: string, extendFileStorageDurationDto: ExtendFileStorageDurationDto): Promise<{success: boolean}> {
        this.log.debug(`Extending storage duration of file ${fileId}`);
        const extendStorageDurationResponse = (await this.ddsApiClient.extendFileStorageDuration(
            fileId,
            {
                duration: differenceInSeconds(
                    parse(
                        extendFileStorageDurationDto.keepUntil,
                        "yyyy-MM-dd'T'hh:mm:ss'Z'",
                        addMonths(new Date(), 1)
                    ),
                    new Date()
                )
            }
        )).data;

        const file = await this.localFileRecordRepository.findByDdsId(fileId);

        await this.billingApiClient.payForStorageDurationExtension({
            sum: extendStorageDurationResponse.data.attributes.price + "",
            serviceNode: file.serviceNodeAddress,
            dataValidator: file.dataValidatorAddress,
            signature: extendFileStorageDurationDto.signature
        });

        await this.ddsApiClient.notifyPaymentStatus({
            status: "success",
            file_id: fileId,
            amount: extendStorageDurationResponse.data.attributes.price
        });

        return {success: true};
    }

    public async createLocalFileRecord(createLocalFileRecordDto: CreateLocalFileRecordDto): Promise<LocalFileRecordResponse> {
        try {
            this.log.debug("Creating new local file record");
            const fileId = uuid();
            const serviceNodeAddress = (await this.accountService.getDefaultAccount()).address;
            const extension = (createLocalFileRecordDto.extension && createLocalFileRecordDto.extension.trim().length !== 0)
                ? createLocalFileRecordDto.extension
                : "encrypted";
            const localPath = `${config.TEMPORARY_FILES_DIRECTORY}/${fileId}.${extension}`;
            fileSystem.closeSync(fileSystem.openSync(localPath, "w"));
            const localFile: LocalFileRecord = createLocalFileRecordDtoToLocalFileRecord(
                createLocalFileRecordDto,
                fileId,
                localPath,
                serviceNodeAddress
            );

            this.log.debug(`Created new local file record with id ${fileId}`);

            return this.localFileRecordRepository.save(localFile).then(saved => localFileRecordToLocalFileRecordResponse(saved));
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    public async deleteLocalFileRecord(localFileId: string): Promise<void> {
        this.log.debug(`Deleting local file record with id ${localFileId}`);
        const localFileRecord = await this.localFileRecordRepository.findById(localFileId);

        if (!localFileRecord) {
            throw new HttpException(`Could not find local file with id ${localFileId}`, HttpStatus.NOT_FOUND);
        }

        if (localFileRecord.deletedLocally) {
            throw new HttpException(`Local file with id ${localFileId} has already been deleted`, HttpStatus.CONFLICT);
        }

        if (fileSystem.existsSync(localFileRecord.localPath)) {
            try {
                fileSystem.unlinkSync(localFileRecord.localPath);
                localFileRecord.deletedLocally = true;
                this.log.debug(`Deleted local file record with id ${localFileId}`);
                await this.localFileRecordRepository.save(localFileRecord);
            } catch (error) {
                this.log.error(`Error occurred when tried to delete local file with id ${localFileId}`);
                console.log(error);
            }
        }
    }

    public async writeFileChunk(localFileId: string, uploadChunkDto: UploadChunkDto): Promise<{success: boolean}> {
        const localFile = await this.localFileRecordRepository.findById(localFileId);

        if (localFile) {
            this.log.debug(`Writing new chunk of file ${localFileId}`);
            fileSystem.appendFileSync(localFile.localPath, uploadChunkDto.chunkData);
            this.log.debug(`Completed writing new chunk of file ${localFileId}`);
            return {success: true};
        } else {
            throw new HttpException(`Could not find local file with id ${localFileId}`, HttpStatus.NOT_FOUND);
        }
    }

    public async checkLocalFileUploadStatus(localFileId: string): Promise<DdsFileUploadCheckResponse> {
        const localFile = await this.localFileRecordRepository.findById(localFileId);
        return createDdsFileUploadCheckResponseFromLocalFileRecord(localFile);
    }

    public async uploadLocalFileToDds(localFileId: string, uploadLocalFileToDdsDto: UploadLocalFileToDdsDto): Promise<{success: boolean}> {
        const localFile = await this.localFileRecordRepository.findById(localFileId);

        if (!localFile) {
            throw new HttpException(`Could not find local file with id ${localFileId}`, HttpStatus.NOT_FOUND);
        }

        if (!this.web3Wrapper.isSignatureValid(localFile.dataValidatorAddress, uploadLocalFileToDdsDto.signature)) {
            throw new HttpException(
                "Signature is invalid",
                HttpStatus.FORBIDDEN
            )
        }

        this.processDataUploading(localFile, uploadLocalFileToDdsDto);

        return {success: true};
    }

    private async processDataUploading(
        localFile: LocalFileRecord,
        uploadLocalFileToDdsDto: UploadLocalFileToDdsDto,
    ): Promise<void> {
        this.log.debug(`Started processing data uploading - ${localFile._id}`);
        let stage: FileUploadingStage = FileUploadingStage.DDS_UPLOAD;

        try {
            this.log.debug(`Starting stage ${stage} - ${localFile._id}`);

            const ddsResponse = await this.ddsApiClient.UNSTABLE_uploadFile(localFile.localPath);
            const uploadPrice = localFile.price * 0.01;

            this.log.debug(`Stage ${stage} has been completed - ${localFile._id}`);
            this.log.debug(`Assigned DDS ID is ${ddsResponse.data.fileName} - ${localFile._id}`);
            stage = FileUploadingStage.BILLING_PROCESSING;
            this.log.debug(`Starting stage ${stage} - ${localFile._id}`);

            const payForDataUploadResponse = await this.payForDataUpload(
                localFile,
                uploadPrice,
                ddsResponse.data.fileName,
                uploadLocalFileToDdsDto.signature
            );

            this.log.debug(`Stage ${stage} has been completed - ${localFile._id}`);
            stage = FileUploadingStage.DDS_PAYMENT_NOTIFICATION;
            this.log.debug(`Starting stage ${stage} - ${localFile._id}`);

            this.log.debug(`Stage ${stage} has been completed - ${localFile._id}`);

            localFile.failed = false;
            localFile.storagePrice = uploadPrice;
            localFile.ddsId = ddsResponse.data.fileName;
            localFile.uploadedToDds = true;
            localFile.dataOwnerAddress = payForDataUploadResponse.address;
            localFile.privateKey = payForDataUploadResponse.privateKey;

            await this.localFileRecordRepository.save(localFile);

            this.log.debug(`File uploading has been completed - ${localFile._id}`);
        } catch (error) {
            console.log(error);

            this.log.error(`Data upload failed at stage: ${stage}`);

            if (error.response) {
                console.log(error.response.data);
            }

            localFile.failed = true;

            await this.localFileRecordRepository.save(localFile);
        }
    }

    private async payForDataUpload(
        localFile: LocalFileRecord,
        price: number,
        fileId: string,
        signature: ISignedRequest
    ): Promise<PayForDataUploadResponse> {
        const payForDataUploadRequest = localFileRecordToPayForDataUploadRequest(localFile, price, fileId, signature);
        return (await this.billingApiClient.payForDataUpload(payForDataUploadRequest)).data;
    }
}

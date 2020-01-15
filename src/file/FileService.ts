import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import uuid from "uuid/v4";
import fileSystem from "fs";
import {addMonths, differenceInSeconds, parse} from "date-fns";
import {Response} from "express";
import {LoggerService} from "nest-logger";
import {CreateLocalFileRecordDto, ExtendFileStorageDurationDto, UploadChunkDto} from "./types/request";
import {DdsFileResponse, DdsFileUploadCheckResponse, LocalFileRecordResponse} from "./types/response";
import {LocalFileRecord} from "./LocalFileRecord";
import {
    createDdsFileUploadCheckResponseFromLocalFileRecord,
    createLocalFileRecordDtoToLocalFileRecord, localFileRecordToDdsFileResponse,
    localFileRecordToDdsUploadRequest,
    localFileRecordToLocalFileRecordResponse,
    localFileRecordToPayForDataUploadRequest
} from "./mappers";
import {LocalFileRecordRepository} from "./LocalFileRecordRepository";
import {config} from "../config";
import {DdsApiClient} from "../dds-api";
import {BillingApiClient} from "../billing-api";
import {AccountService} from "../account";
import {UploadFileRequest} from "../dds-api/types/request";
import {DdsApiResponse} from "../dds-api/types/response";
import {DdsFileInfo} from "../dds-api/types";
import {PayForDataUploadResponse} from "../billing-api/types/response";

@Injectable()
export class FileService {
    constructor(
        private readonly localFileRecordRepository: LocalFileRecordRepository,
        private readonly billingApiClient: BillingApiClient,
        private readonly ddsApiClient: DdsApiClient,
        private readonly accountService: AccountService,
        private readonly log: LoggerService
    ) {
    }

    public async getFile(fileId: string, httpResponse: Response): Promise<void> {
        const {data} = await this.ddsApiClient.getFile(fileId);
        httpResponse.header("Content-Disposition", `attachment; filename=${fileId}`);
        data.pipe(httpResponse);
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
            dataValidator: file.dataValidatorAddress
        });

        await this.ddsApiClient.notifyPaymentStatus({
            status: "success",
            file_id: fileId,
            amount: extendStorageDurationResponse.data.attributes.price
        });

        return {success: true};
    }

    public async createLocalFileRecord(createLocalFileRecordDto: CreateLocalFileRecordDto): Promise<LocalFileRecordResponse> {
        this.log.debug("Creating new local file record");
        const fileId = uuid();
        const serviceNodeAddress = (await this.accountService.getDefaultAccount()).address;
        const localPath = `${config.TEMPORARY_FILES_DIRECTORY}/${fileId}`;
        fileSystem.closeSync(fileSystem.openSync(localPath, "w"));
        const localFile: LocalFileRecord = createLocalFileRecordDtoToLocalFileRecord(
            createLocalFileRecordDto,
            fileId,
            localPath,
            serviceNodeAddress
        );

        this.log.debug(`Created new local file record with id ${fileId}`);

        return this.localFileRecordRepository.save(localFile).then(saved => localFileRecordToLocalFileRecordResponse(saved));
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

    public async uploadLocalFileToDds(localFileId: string): Promise<{success: boolean}> {
        const localFile = await this.localFileRecordRepository.findById(localFileId);

        if (!localFile) {
            throw new HttpException(`Could not find local file with id ${localFileId}`, HttpStatus.NOT_FOUND);
        }

        const data = fileSystem.readFileSync(localFile.localPath).toString();
        this.processDataUploading(localFile, data);

        return {success: true};
    }

    private async processDataUploading(localFile: LocalFileRecord, data: string): Promise<void> {
        this.log.debug(`Started processing data uploading - ${localFile._id}`);
        let stage: "ddsUpload" | "billingProcessing" | "ddsPaymentNotification" | "localFileStatusUpdate" = "ddsUpload";

        try {
            this.log.debug(`Starting stage ${stage} - ${localFile._id}`);

            const uploadFileRequest = localFileRecordToDdsUploadRequest(localFile, data);
            const ddsResponse = await this.uploadFileToDds(uploadFileRequest);

            this.log.debug(`Stage ${stage} has been completed - ${localFile._id}`);
            this.log.debug(`Assigned DDS ID is ${ddsResponse.data.id} - ${localFile._id}`);
            stage = "billingProcessing";
            this.log.debug(`Starting stage ${stage} - ${localFile._id}`);

            const payForDataUploadResponse = await this.payForDataUpload(
                localFile,
                ddsResponse.data.attributes.price,
                ddsResponse.data.id
            );

            this.log.debug(`Stage ${stage} has been completed - ${localFile._id}`);
            stage = "ddsPaymentNotification";
            this.log.debug(`Starting stage ${stage} - ${localFile._id}`);

            await this.ddsApiClient.notifyPaymentStatus({
                file_id: ddsResponse.data.id,
                amount: ddsResponse.data.attributes.price,
                status: "success"
            });

            this.log.debug(`Stage ${stage} has been completed - ${localFile._id}`);

            localFile.failed = false;
            localFile.storagePrice = ddsResponse.data.attributes.price;
            localFile.ddsId = ddsResponse.data.id;
            localFile.uploadedToDds = true;
            localFile.dataOwnerAddress = payForDataUploadResponse.address;
            localFile.privateKey = payForDataUploadResponse.privateKey;

            await this.localFileRecordRepository.save(localFile);

            this.log.debug(`File uploading has been completed - ${localFile._id}`);
        } catch (error) {
            this.log.error(`Data upload failed at stage: ${stage}`);
            console.log(error);

            localFile.failed = true;

            await this.localFileRecordRepository.save(localFile);
        }
    }

    private async uploadFileToDds(uploadFileRequest: UploadFileRequest): Promise<DdsApiResponse<DdsFileInfo>> {
        return  (await this.ddsApiClient.uploadFile(uploadFileRequest)).data;
    }

    private async payForDataUpload(localFile: LocalFileRecord, price: number, fileId: string): Promise<PayForDataUploadResponse> {
        const payForDataUploadRequest = localFileRecordToPayForDataUploadRequest(localFile, price, fileId);
        return (await this.billingApiClient.payForDataUpload(payForDataUploadRequest)).data;
    }
}

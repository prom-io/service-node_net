import {AxiosError} from "axios";
import {addMonths, differenceInSeconds, parse} from "date-fns";
import {BillingApiClient} from "../../billing-api";
import {DdsApiClient, DdsApiResponse, ExtendFileStorageResponse, FileInfo} from "../../dds-api";
import {ExtendFileStorageDurationDto, UploadFileDto} from "../dto";
import {BillingApiErrorException, DdsErrorException, FileNotFoundException} from "../exceptions";

export class FilesService {
    private ddsApiClient: DdsApiClient;
    private billingApiClient: BillingApiClient;

    constructor(ddsApiClient: DdsApiClient, billingApiClient: BillingApiClient) {
        this.ddsApiClient = ddsApiClient;
        this.billingApiClient = billingApiClient;
    }

    public uploadData(uploadFileDto: UploadFileDto): Promise<DdsApiResponse<FileInfo>> {
        return new Promise(async (resolve, reject) => {
            try {
                const ddsResponse = await this.uploadFileToDds(uploadFileDto);
                await this.payForDataUpload(
                    uploadFileDto,
                    ddsResponse.data.attributes.price,
                    ddsResponse.data.id
                );
                await this.ddsApiClient.notifyPaymentStatus({
                    status: "success",
                    file_id: ddsResponse.data.id,
                    amount: ddsResponse.data.attributes.price
                });
                resolve(ddsResponse);
            } catch (error) {
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
        additional.set("extension", uploadFileDto.extension);
        additional.set("size", uploadFileDto.size.toString(10));
        additional.set("mimeType", uploadFileDto.mimeType);

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
                resolve(data);
            }).catch((ddsError: AxiosError) => {
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
                sum: price,
                data_owner: uploadFileDto.dataOwnerAddress,
                owner: "",
                data_price: uploadFileDto.dataPrice,
                extension: uploadFileDto.extension,
                id: fileId,
                mime_type: uploadFileDto.mimeType,
                name: uploadFileDto.name,
                service_node: "",
                size: uploadFileDto.size
            }).then(() => {
                resolve();
            }).catch((billingError: AxiosError) => {
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

import {AxiosError} from "axios";
import {BillingApiClient} from "../../billing-api";
import {DdsApiClient, DdsApiResponse, FileInfo} from "../../dds-api";
import {PurchaseDataDto} from "../dto";
import {BillingApiErrorException, DdsErrorException, FileNotFoundException} from "../exceptions";
import {FilesRepository} from "../repositories";

export class PurchasesService {
    private ddsApiClient: DdsApiClient;
    private billingApiClient: BillingApiClient;
    private filesRepository: FilesRepository;

    constructor(ddsApiClient: DdsApiClient, billingApiClient: BillingApiClient, filesRepository: FilesRepository) {
        this.ddsApiClient = ddsApiClient;
        this.billingApiClient = billingApiClient;
        this.filesRepository = filesRepository;
    }

    public purchaseData(purchaseDataDto: PurchaseDataDto): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {
                // const fileInfo = await this.getFileInfoById(purchaseDataDto.fileId);
                await this.makeDataPurchase(purchaseDataDto, purchaseDataDto.price);
                resolve({
                    status: "Success",
                    message: `File with ID ${purchaseDataDto.fileId} has been successfully purchased`
                })
            } catch (error) {
                console.log(error);
                reject(error);
            }
        })
    }

    private getFileInfoById(fileId: string): Promise<DdsApiResponse<FileInfo>> {
        return new Promise((resolve, reject) => {
            this.ddsApiClient.getFileInfo(fileId)
                .then(({data}) => resolve(data))
                .catch((error: AxiosError) => {
                    if (error.response) {
                        if (error.response.status === 404) {
                            reject(new FileNotFoundException(`Could not find file with id ${fileId}`));
                        } else {
                            reject(new DdsErrorException(`DDS API responded with status ${error.response.status}`, error.response.status));
                        }
                    } else {
                        return new DdsErrorException("DDS API unreachable");
                    }
                })
        })
    };

    private makeDataPurchase(purchaseDataDto: PurchaseDataDto, dataPrice: number): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.billingApiClient.payForDataPurchase({
                id: purchaseDataDto.fileId,
                data_validator: purchaseDataDto.dataValidatorAddress,
                owner: purchaseDataDto.dataMartAddress,
                sum: "" + dataPrice,
                service_node: purchaseDataDto.serviceNodeAddress,
                data_mart: purchaseDataDto.dataMartAddress,
                data_owner: purchaseDataDto.dataOwnerAddress
            }).then((response: any) => {
                resolve(response);
            }).catch((error: AxiosError) => {
                console.log(error);
                if (error.response) {
                    console.log(error.response.data.message);
                    reject(new BillingApiErrorException(`Billing API responded with ${error.response.status}`));
                } else {
                    reject(new BillingApiErrorException("Binning API is unreachable"));
                }
            })
        })
    }
}

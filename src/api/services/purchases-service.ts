import {boundClass} from "autobind-decorator";
import {AxiosError} from "axios";
import {BillingApiClient} from "../../billing-api";
import {DdsApiClient, DdsApiResponse, FileInfo} from "../../dds-api";
import {PurchaseDataDto} from "../dto";
import {BillingApiErrorException, DdsErrorException, FileNotFoundException} from "../exceptions";

@boundClass
export class PurchasesService {
    private ddsApiClient: DdsApiClient;
    private billingApiClient: BillingApiClient;

    constructor(ddsApiClient: DdsApiClient, billingApiClient: BillingApiClient) {
        this.ddsApiClient = ddsApiClient;
        this.billingApiClient = billingApiClient;
    }

    public purchaseData(purchaseDataDto: PurchaseDataDto): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {
                const fileInfo = await this.getFileInfoById(purchaseDataDto.fileId);
                await this.makeDataPurchase(purchaseDataDto, fileInfo.data.attributes.price);
                resolve({
                    status: "Success",
                    message: `File with ID ${purchaseDataDto.fileId} has been successfully purchased`
                })
            } catch (error) {
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
                dataValidator: purchaseDataDto.dataValidatorAddress,
                owner: purchaseDataDto.dataOwnerAddress,
                sum: dataPrice
            }).then((response: any) => {
                resolve(response);
            }).catch((error: AxiosError) => {
                if (error.response) {
                    reject(new BillingApiErrorException(`Billing API responded with ${error.response.status}`));
                } else {
                    reject(new BillingApiErrorException("Binning API is unreachable"));
                }
            })
        })
    }
}

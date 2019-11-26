import {boundClass} from "autobind-decorator";
import Axios, {AxiosInstance, AxiosPromise} from "axios";
import App from "../application";
import IBootstrap from "../common/interfaces/IBootstrap";
import {
    BalanceResponse,
    BillingFilesCollectionResponse,
    GenericBillingApiResponse,
    PayForDataPurchaseRequest,
    PayForDataUploadRequest,
    RegisterAccountRequest
} from "./types";

@boundClass
export class BillingApiClient implements IBootstrap {
    private app: App;
    private axiosInstance: AxiosInstance;
    private billingApiBaseUrl: string;

    constructor(app: App, billingApiBaseUrl: string, axiosInstance: AxiosInstance = Axios.create({baseURL: billingApiBaseUrl})) {
        this.app = app;
        this.axiosInstance = axiosInstance;
        this.billingApiBaseUrl = billingApiBaseUrl;
    }

    public bootstrap(): any {
        return;
    }

    public payForDataUpload(payForDataUploadRequest: PayForDataUploadRequest): AxiosPromise<GenericBillingApiResponse> {
        return this.axiosInstance.post('/data/upload/pay', payForDataUploadRequest);
    }

    public payForDataPurchase(payForDataPurchaseRequest: PayForDataPurchaseRequest): AxiosPromise<GenericBillingApiResponse> {
        return this.axiosInstance.post('/data/buy', payForDataPurchaseRequest);
    }

    public registerDataValidator(registerAccountRequest: RegisterAccountRequest): AxiosPromise<void> {
        return this.axiosInstance.post("/account/register/data-validator", registerAccountRequest);
    }

    public registerDataMart(registerAccountRequest: RegisterAccountRequest): AxiosPromise<void> {
        return this.axiosInstance.post("/account/register/data-mart", registerAccountRequest);
    }

    public registerDataOwner(registerAccountRequest: RegisterAccountRequest): AxiosPromise<void> {
        return this.axiosInstance.post("/account/register/data-owner", registerAccountRequest);
    }

    public registerServiceNode(registerAccountRequest: RegisterAccountRequest): AxiosPromise<void> {
        return this.axiosInstance.post("/account/register/service-node", registerAccountRequest);
    }

    public getBalanceOfAddress(address: string): AxiosPromise<BalanceResponse> {
        return this.axiosInstance.get(`/wallet/balance/${address}`);
    }

    public getFiles(page: number, pageSize: number): AxiosPromise<BillingFilesCollectionResponse> {
        return this.axiosInstance.get(`/files/paginate/${page}/${pageSize}`);
    }
}

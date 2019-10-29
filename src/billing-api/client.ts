import Axios, {AxiosInstance, AxiosPromise} from "axios";
import App from "../application";
import IBootstrap from "../common/interfaces/IBootstrap";
import {
    GenericBillingApiResponse,
    PayForDataPurchaseRequest,
    PayForDataUploadRequest,
    RegisterAccountRequest
} from "./types";

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
        return this.axiosInstance.post('/pay/data/upload', payForDataUploadRequest);
    }

    public payForDataPurchase(payForDataPurchaseRequest: PayForDataPurchaseRequest): AxiosPromise<GenericBillingApiResponse> {
        return this.axiosInstance.post('/pay/data/sell', payForDataPurchaseRequest);
    }

    public registerDataValidator(registerAccountRequest: RegisterAccountRequest): AxiosPromise<void> {
        return this.axiosInstance.post("/register/data-validator", registerAccountRequest);
    }

    public registerDataMart(registerAccountRequest: RegisterAccountRequest): AxiosPromise<void> {
        return this.axiosInstance.post("/register/data-mart", registerAccountRequest);
    }

    public registerDataOwner(registerAccountRequest: RegisterAccountRequest): AxiosPromise<void> {
        return this.axiosInstance.post("/register/data-owner");
    }

    public registerServiceNode(registerAccountRequest: RegisterAccountRequest): AxiosPromise<void> {
        return this.axiosInstance.post("/register/service-node");
    }
}

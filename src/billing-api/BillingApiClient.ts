import {Inject, Injectable} from "@nestjs/common";
import {AxiosInstance, AxiosPromise} from "axios";
import {
    PayForDataPurchaseRequest,
    PayForDataUploadRequest,
    PayForFileStorageExtensionRequest,
    RegisterAccountRequest,
    RegisterDataOwnerRequest, RegisterLambdaWalletRequest
} from "./types/request";
import {
    BalanceOfLambdaWalletResponse,
    BalanceResponse,
    BillingAccountRegistrationStatusResponse,
    BillingFileResponse,
    BillingTransactionResponse,
    DataOwnersResponse,
    GenericBillingApiResponse, GetBillingAccountRoleResponse,
    PaginatedResponse,
    PayForDataUploadResponse,
    TransactionType
} from "./types/response";

@Injectable()
export class BillingApiClient {
    constructor(@Inject("billingApiAxiosInstance") private readonly axios: AxiosInstance) {
    }

    public payForDataUpload(payForDataUploadRequest: PayForDataUploadRequest): AxiosPromise<PayForDataUploadResponse> {
        if (payForDataUploadRequest.data_owner === "0x0") {
            payForDataUploadRequest.data_owner = undefined;
        }
        return this.axios.post("/data/upload/pay", payForDataUploadRequest);
    }

    public payForDataPurchase(payForDataPurchaseRequest: PayForDataPurchaseRequest): AxiosPromise<GenericBillingApiResponse> {
        return this.axios.post("/data/buy", payForDataPurchaseRequest);
    }

    public registerDataValidator(registerAccountRequest: RegisterAccountRequest): AxiosPromise<void> {
        return this.axios.post("/account/register/data-validator", registerAccountRequest);
    }

    public registerDataMart(registerAccountRequest: RegisterAccountRequest): AxiosPromise<void> {
        return this.axios.post("/account/register/data-mart", registerAccountRequest);
    }

    public registerDataOwner(registerDataOwnerRequest: RegisterDataOwnerRequest): AxiosPromise<void> {
        return this.axios.post("/account/register/data-owner", registerDataOwnerRequest);
    }

    public registerServiceNode(registerAccountRequest: RegisterAccountRequest): AxiosPromise<void> {
        return this.axios.post("/account/register/service-node", registerAccountRequest);
    }

    public getBalanceOfAddress(address: string): AxiosPromise<BalanceResponse> {
        return this.axios.get(`/wallet/balance/${address}`);
    }

    public getFiles(page: number, pageSize: number): AxiosPromise<PaginatedResponse<BillingFileResponse>> {
        return this.axios.get(`/file/paginate/${page}/${pageSize}`);
    }

    public getDataOwnersOfDataValidator(dataValidatorAddress: string): AxiosPromise<DataOwnersResponse> {
        return this.axios.get(`/account/owners/${dataValidatorAddress}`);
    }

    public getTransactions(address: string, page: number, pageSize: number): AxiosPromise<PaginatedResponse<BillingTransactionResponse>> {
        return this.axios.get(`/transaction/address/${address}/paginate/${page}/${pageSize}`);
    }

    public payForStorageDurationExtension(payForFileStorageExtensionRequest: PayForFileStorageExtensionRequest): AxiosPromise<void> {
        return this.axios.post("/wallet/extend/file/store", payForFileStorageExtensionRequest);
    }

    public getTransactionsOfAddressByType(
        address: string,
        type: TransactionType,
        page: number, 
        pageSize: number
    ): AxiosPromise<PaginatedResponse<BillingTransactionResponse>> {
        return this.axios.get(`/transaction/address/${address}/type/${type}/paginate/${page}/${pageSize}`);
    }

    public isAccountRegistered(address: string): AxiosPromise<BillingAccountRegistrationStatusResponse> {
        return this.axios.get(`/account/check/registered/${address}`);
    }

    public getAccountRole(address: string): AxiosPromise<GetBillingAccountRoleResponse> {
        return this.axios.get(`/account/address/role/${address}`);
    }

    public getBalanceOfLambdaWallet(lambdaWallet: string): AxiosPromise<BalanceOfLambdaWalletResponse> {
        return this.axios.get(`/api/v1/lambda/balance/${lambdaWallet}`)
    }

    public registerLambdaWallet(registerLambdaWalletRequest: RegisterLambdaWalletRequest): AxiosPromise<void> {
        return this.axios.post("/api/v1/lambda/register/wallet", registerLambdaWalletRequest);
    }
}

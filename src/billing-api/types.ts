// tslint:disable:interface-name

export interface PayForDataUploadRequest {
    id: string,
    data_validator: string,
    name: string,
    size: number,
    extension: string,
    mime_type: string,
    service_node: string,
    data_owner: string,
    buy_sum: string,
    sum: string,
    meta_data: string
}

export interface PayForDataPurchaseRequest {
    id: string,
    owner: string,
    data_validator: string,
    sum: string,
    service_node: string
}

export interface RegisterAccountRequest {
    owner: string
}

export interface GenericBillingApiResponse {
    status: string
}

export interface BalanceResponse {
    balance: string
}

export interface PaginatedResponse<DataType> {
    count: string | number,
    data: DataType[]
}

export interface BillingFileResponse {
    id: string,
    name: string,
    size: number,
    file_extension: string,
    mime_type: string,
    owner: string,
    sum: string,
    buy_sum: string,
    meta_data: string,
    data_owner: string
}

export interface RegisterDataOwnerRequest {
    dataValidator: string,
    dataOwner: string
}

export interface DataOwnersResponse {
    address: string[]
}

export interface TransactionResponse {
    id: string,
    hash: string,
    txType: TransactionType,
    dataOwner: string,
    dataMart: string,
    dataValidator: string,
    blockNumber: number,
    serviceNode: string,
    queueNumber: number,
    value: string,
    status: boolean,
    created_at: string
}

export interface PayForFileStorageExtensionRequest {
    serviceNode: string,
    dataValidator: string,
    sum: string
}

export interface RegisterDataOwnerRequest {
    dataValidator: string,
    dataOwner: string
}

export interface DataOwnersResponse {
    address: string[]
}

export enum TransactionType {
    DATA_UPLOAD = "dataUpload",
    DATA_SELL = "dataSell"
}

export interface TransactionResponse {
    id: string,
    hash: string,
    txType: TransactionType,
    dataOwner: string,
    dataMart: string,
    dataValidator: string,
    blockNumber: number,
    serviceNode: string,
    queueNumber: number,
    value: string,
    status: boolean,
    created_at: string
}

export interface PayForFileStorageExtensionRequest {
    serviceNode: string,
    dataValidator: string,
    sum: string
}

// tslint:disable:interface-name

export interface PayForDataUploadRequest {
    id: string,
    owner: string,
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
    sum: string
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
    meta_data: string
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
    uuid: string,
    hash: string,
    txType: TransactionType,
    from: string,
    to: string,
    serviceNode: string,
    value: string,
    status: boolean
}

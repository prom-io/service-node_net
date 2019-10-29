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
    data_price: number,
    sum: number
}

export interface PayForDataPurchaseRequest {
    owner: string,
    dataValidator: string,
    sum: number
}

export interface RegisterAccountRequest {
    owner: string
}

export interface GenericBillingApiResponse {
    status: string
}

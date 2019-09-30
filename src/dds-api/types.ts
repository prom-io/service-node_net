// tslint:disable:interface-name

export enum DdsApiType {
    FILE = "file",
    PAYMENT = "payment",
    LOCAL_PAYMENT = "local_payment"
}

export interface DdsApiRequest<AttributesType> {
    type: DdsApiType,
    attributes: AttributesType
}

export interface DdsApiResponseData<AttributesType> {
    type: DdsApiType,
    id: string,
    links: {
        self: string
    },
    attributes: AttributesType
}

export interface DdsApiResponse<AttributesType> {
    data: DdsApiResponseData<AttributesType>
}

export interface FileInfo {
    name: string,
    price: number,
    duration: number,
    additional: Map<string, string>
}

export interface UploadFileRequest {
    name: string,
    data: string,
    duration: number | undefined,
    additional: Map<string, string>
}

export type UploadFileResponse = FileInfo;

export interface ExtendFileStorageRequest {
    duration: number,
    additional: Map<string, string>
}

export type ExtendFileStorageResponse = FileInfo;

export interface NotifyPaymentStatusRequest {
    file_id: string,
    status: "success" | "error",
    amount: number
}

export interface NotifyPaymentStatusResponse {
    file_id: string,
    status: "success" | "error",
    amount: number
}

export interface PeriodPaymentResponse {
    amount: number,
    size: number
}

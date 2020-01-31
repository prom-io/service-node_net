import {ISignedRequest} from "../../../web3/types";

export interface PayForDataUploadRequest {
    id: string,
    data_validator: string,
    name: string,
    size: number,
    extension: string,
    mime_type: string,
    service_node: string,
    data_owner?: string,
    buy_sum: string,
    sum: string,
    meta_data: string,
    signature: ISignedRequest
}

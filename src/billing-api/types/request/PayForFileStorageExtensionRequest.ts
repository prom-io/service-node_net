import {ISignedRequest} from "../../../web3/types";

export interface PayForFileStorageExtensionRequest {
    serviceNode: string,
    dataValidator: string,
    sum: string,
    signature: ISignedRequest
}

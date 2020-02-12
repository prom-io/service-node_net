import {NodeType} from "../NodeType";

export interface RegisterNodeRequest {
    ipAddress: string,
    port: number,
    walletAddresses: string[],
    type: NodeType,
    bootstrap: boolean,
    id?: string
}

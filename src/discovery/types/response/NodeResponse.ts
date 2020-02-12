import {NodeType} from "../NodeType";

export interface NodeResponse {
    id: string,
    ipAddress: string,
    port: number,
    type: NodeType,
    addresses: string[],
    bootstrap: boolean
}

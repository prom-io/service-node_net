export interface ISignedRequest {
    message: string,
    messageHash: string,
    signature: string,
    r: string,
    v: string,
    s: string
}

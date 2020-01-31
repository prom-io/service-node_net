import {Injectable} from "@nestjs/common";
import Web3 from "web3";
import {ISignedRequest} from "./types";

@Injectable()
export class Web3Wrapper {
    constructor(private readonly web3: Web3) {
    }

    public isSignatureValid(address: string, signature: ISignedRequest): boolean {
        try {
            return this.web3.eth.accounts.recover(signature) === address;
        } catch (error) {
            return false;
        }
    }

    public signData(data: object, privateKey: string): ISignedRequest {
        const dataJson = JSON.stringify(data);
        const dataBas64 = Buffer.from(dataJson, "base64").toString();
        const signature = this.web3.eth.accounts.sign(dataBas64, privateKey);

        return {
            ...signature,
            messageHash: signature.messageHash!
        }
    }
}

import {IsNotEmpty, IsObject} from "class-validator";
import {SignedRequest} from "../../../web3/types";

export class UploadLocalFileToDdsDto {
    @IsNotEmpty({message: "Signature must be present"})
    @IsObject({message: "Signature must be an object"})
    public signature: SignedRequest;

    constructor(signature: SignedRequest) {
        this.signature = signature;
    }
}

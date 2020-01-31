import {IsDateString, IsNotEmpty, IsObject} from "class-validator";
import {SignedRequest} from "../../../web3/types";

export class ExtendFileStorageDurationDto {
    @IsNotEmpty({message: "Keep until must be present"})
    @IsDateString({message: "Keep until must be a string date"})
    public keepUntil: string;

    @IsNotEmpty({message: "Signature must be present"})
    @IsObject({message: "Signature must be object"})
    public signature: SignedRequest;

    constructor(keepUntil: string) {
        this.keepUntil = keepUntil;
    }
}

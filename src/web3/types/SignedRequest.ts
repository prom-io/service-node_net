import {IsString, IsNotEmpty, IsBase64} from "class-validator";
import {ISignedRequest} from "./ISignedRequest";

export class SignedRequest implements ISignedRequest {
    @IsNotEmpty({message: "Signed message must be present"})
    @IsString({message: "Signed message must be string"})
    @IsBase64({message: "Signed message must be encoded in base 64"})
    public message: string;

    @IsNotEmpty({message: "Message hash must be present"})
    @IsString({message: "Message hash must be string"})
    public messageHash: string;

    @IsNotEmpty({message: "Signature must be present"})
    @IsString({message: "Signature must be string"})
    public signature: string;

    @IsNotEmpty({message: "'r' parameter must be present"})
    @IsString({message: "'r' parameter must be string"})
    public r: string;

    @IsNotEmpty({message: "'v' parameter must be present"})
    @IsString({message: "'v' parameter must be string"})
    public v: string;

    @IsNotEmpty({message: "'s' parameter must be present"})
    @IsString({message: "'s' parameter must be string"})
    public s: string;

    constructor(message: string, messageHash: string, signature: string, r: string, v: string, s: string) {
        this.message = message;
        this.messageHash = messageHash;
        this.signature = signature;
        this.r = r;
        this.v = v;
        this.s = s;
    }
}

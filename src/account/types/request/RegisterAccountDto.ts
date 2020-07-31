import {IsIn, IsNotEmpty, IsObject, IsString, Matches, ValidateIf} from "class-validator";
import {SignedRequest} from "../../../web3/types";
import {IsValidEthereumPrivateKeyFor} from "../../../utils/validation";

export class RegisterAccountDto {
    @IsNotEmpty({message: "Account address must not be empty"})
    @IsString({message: "Account address must be string"})
    @Matches(
        new RegExp("^0x[a-fA-F0-9]{40}$"),
        {
            message: "Account owner address must be valid Ethereum address"
        }
    )
    public address: string;

    @IsNotEmpty({message: "Account type must not be empty"})
    @IsString({message: "Account type must be string"})
    @IsIn(["SERVICE_NODE", "DATA_MART", "DATA_VALIDATOR"])
    public type: string;

    @ValidateIf(registerAccountDto => registerAccountDto.type === "SERVICE_NODE")
    @IsNotEmpty({message: "Private key must be present"})
    @IsString({message: "Private key must be string"})
    @IsValidEthereumPrivateKeyFor("address", {message: "Private key is invalid"})
    public privateKey?: string;

    @ValidateIf(registerAccountDto => registerAccountDto.type !== "SERVICE_NODE")
    @IsNotEmpty({message: "Signature must be present"})
    @IsObject({message: "Signature must be object"})
    public signature?: SignedRequest;

    @ValidateIf((object: RegisterAccountDto) => Boolean(object.lambdaWallet))
    @IsString()
    @IsNotEmpty()
    public lambdaWallet?: string;

    constructor(address: string, type: string, privateKey: string, signature: SignedRequest, lambdaWallet?: string) {
        this.address = address;
        this.type = type;
        this.privateKey = privateKey;
        this.signature = signature;
        this.lambdaWallet = lambdaWallet;
    }
}

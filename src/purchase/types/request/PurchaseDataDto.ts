import {IsNotEmpty, IsNumber, IsObject, IsPositive, IsString, Matches, ValidateNested} from "class-validator";
import {ISignedRequest, SignedRequest} from "../../../web3/types";

export class PurchaseDataDto {
    @IsNotEmpty({message: "File ID must be present"})
    @IsString({message: "File ID must be string"})
    public fileId: string;

    @IsNotEmpty({message: "Data mart address must be present"})
    @IsString({message: "Data mart address must be string"})
    @Matches(
        new RegExp("^0x[a-fA-F0-9]{40}$"),
        {
            message: "Data mart address must be valid Ethereum address"
        }
    )
    public dataMartAddress: string;

    @IsNotEmpty({message: "Data validator address must be present"})
    @IsString({message: "Data validator address must be string"})
    @Matches(
        new RegExp("^0x[a-fA-F0-9]{40}$"),
        {
            message: "Data validator address must be valid Ethereum address"
        }
    )
    public dataValidatorAddress: string;

    @IsNotEmpty({message: "Data owner address must be present"})
    @IsString({message: "Data owner address must be present"})
    public dataOwnerAddress: string;

    @IsNotEmpty({message: "Price must be present"})
    @IsNumber({allowInfinity: false, allowNaN: false}, {message: "Price must be number"})
    @IsPositive({message: "Price must be positive"})
    public price: number;

    @IsNotEmpty({message: "Signature must be present"})
    @IsObject({message: "Signature must be object"})
    @ValidateNested()
    public signature: SignedRequest;

    // tslint:disable-next-line:max-line-length
    constructor(fileId: string, dataMartAddress: string, dataValidatorAddress: string, dataOwnerAddress: string, price: number, signature: SignedRequest) {
        this.fileId = fileId;
        this.dataMartAddress = dataMartAddress;
        this.dataValidatorAddress = dataValidatorAddress;
        this.dataOwnerAddress = dataOwnerAddress;
        this.price = price;
        this.signature = signature;
    }
}

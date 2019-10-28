import {IsNotEmpty, IsString, Matches} from "class-validator";

export class PurchaseDataDto {
    @IsNotEmpty({message: "File ID must be present"})
    @IsString({message: "File ID must be string"})
    public fileId: string;

    @IsNotEmpty({message: "Data owner address must be present"})
    @IsString({message: "Data owner address must be string"})
    @Matches(
        new RegExp("^0x[a-fA-F0-9]{40}$"),
        {
            message: "Data owner address must be valid Ethereum address"
        }
    )
    public dataOwnerAddress: string;

    @IsNotEmpty({message: "Data validator address must be present"})
    @IsString({message: "Data validator address must be string"})
    @Matches(
        new RegExp("^0x[a-fA-F0-9]{40}$"),
        {
            message: "Data validator address must be valid Ethereum address"
        }
    )
    public dataValidatorAddress: string;

    constructor(fileId: string, dataOwnerAddress: string, dataValidatorAddress: string) {
        this.fileId = fileId;
        this.dataOwnerAddress = dataOwnerAddress;
        this.dataValidatorAddress = dataValidatorAddress;
    }
}

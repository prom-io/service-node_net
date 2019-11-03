import {IsNotEmpty, IsString, Matches} from "class-validator";

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
    public type: string;

    constructor(address: string, type: string) {
        this.address = address;
        this.type = type;
    }
}

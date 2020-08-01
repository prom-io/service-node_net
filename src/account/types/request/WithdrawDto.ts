import {IsNotEmpty, IsNumber, IsPositive, IsString, Matches} from "class-validator";

export class WithdrawDto {
    @IsNotEmpty({message: "Account address must not be empty"})
    @IsString({message: "Account address must be string"})
    @Matches(
        new RegExp("^0x[a-fA-F0-9]{40}$"),
        {
            message: "Account owner address must be valid Ethereum address"
        }
    )
    public ethereumAddress: string;

    @IsNumber()
    @IsPositive()
    public amount: number;
}

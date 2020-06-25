import {SignedRequest} from "../../../web3/types";
import {IsNotEmpty, IsString} from "class-validator";

export class GetFileKeyRequest extends SignedRequest {
    @IsString()
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsNotEmpty()
    dataValidatorAddress: string;
}

import {IsString, IsNotEmpty} from "class-validator";

export class UploadLocalFileToDdsDto {
    @IsNotEmpty({message: "Private key must be present"})
    @IsString({message: "Private key must be string"})
    public privateKey: string;

    constructor(privateKey: string) {
        this.privateKey = privateKey;
    }
}

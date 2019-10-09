import {IsInt, IsNotEmpty, IsNumber, IsPositive, IsString} from "class-validator";

export class UploadFileDto {
    @IsInt({message: "Duration must be integer"})
    @IsPositive({message: "Duration must be positive number"})
    public duration: number | undefined;

    @IsNotEmpty({message: "Name must be specified"})
    @IsString({message: "Name must be string"})
    public name: string;

    @IsNotEmpty({message: "Data must not be empty"})
    @IsString({message: "Data must be represented as base64-encoded string"})
    public data: string;
    public additional: Map<string, string>;

    @IsNotEmpty({message: "Data owner address must be specified"})
    @IsString({message: "Data owner address must be string"})
    public dataOwnerAddress: string;

    @IsNotEmpty({message: "Data price must be specified"})
    @IsNumber({
            allowInfinity: false,
            allowNaN: false
        },
        {
            message: "Data price must be number"
        })
    @IsPositive({message: "Data price must be positive"})
    public dataPrice: number;

    constructor(duration: number | undefined, name: string, data: string, additional: Map<string, string>, dataOwnerAddress: string, dataPrice: number) {
        this.duration = duration;
        this.name = name;
        this.data = data;
        this.additional = additional;
        this.dataOwnerAddress = dataOwnerAddress;
        this.dataPrice = dataPrice;
    }
}

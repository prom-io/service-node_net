import {IsInt, IsNotEmpty, IsPositive} from "class-validator";

export class ExtendFileStorageDurationDto{
    @IsNotEmpty({message: "Duration must be present"})
    @IsInt({message: "Duration must be an integer number"})
    @IsPositive({message: "Duration must be positive"})
    public duration: number;
    public additional?: Map<string, string>;


    constructor(duration: number, additional?: Map<string, string>) {
        this.duration = duration;
        this.additional = additional;
    }
}

import {IsDateString, IsNotEmpty} from "class-validator";

export class ExtendFileStorageDurationDto{
    @IsNotEmpty({message: "Keep until must be present"})
    @IsDateString({message: "Keep until must be a string date"})
    public keepUntil: string;
    public additional?: Map<string, string>;

    constructor(keepUntil: string, additional?: Map<string, string>) {
        this.keepUntil = keepUntil;
        this.additional = additional;
    }
}

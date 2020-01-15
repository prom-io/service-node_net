import {IsDateString, IsNotEmpty} from "class-validator";

export class ExtendFileStorageDurationDto {
    @IsNotEmpty({message: "Keep until must be present"})
    @IsDateString({message: "Keep until must be a string date"})
    public keepUntil: string;

    constructor(keepUntil: string) {
        this.keepUntil = keepUntil;
    }
}

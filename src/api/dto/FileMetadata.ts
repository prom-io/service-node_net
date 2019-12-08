import {IsArray, IsString, MaxLength} from "class-validator";

export interface IFileMetadata {
    briefDescription?: string,
    hashTags?: string[],
    author?: string,
    fullDescription?: string,
    userComment?: string
}

export class FileMetadata implements IFileMetadata {
    @IsString({message: "Brief description must be string"})
    @MaxLength(120, {message: "Brief description must be no longer than 120 characters"})
    public briefDescription?: string;

    @IsArray({message: "Hash tags must be array"})
    @MaxLength(10, {message: "Hash tags can include up to 10 items"})
    public hashTags?: string[];

    @IsString({message: "Author description must be string"})
    @MaxLength(120, {message: "Author description must be no longer than 120 characters"})
    public author?: string;

    @IsString({message: "Full description description must be string"})
    @MaxLength(120, {message: "Full description must be no longer than 120 characters"})
    public fullDescription?: string;

    @IsString({message: "User comment description must be string"})
    @MaxLength(120, {message: "User comment must be no longer than 120 characters"})
    public userComment?: string;


    constructor(briefDescription: string, hashTags: string[], author: string, fullDescription: string, userComment: string) {
        this.briefDescription = briefDescription;
        this.hashTags = hashTags;
        this.author = author;
        this.fullDescription = fullDescription;
        this.userComment = userComment;
    }
}

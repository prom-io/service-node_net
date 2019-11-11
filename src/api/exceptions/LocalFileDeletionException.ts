import {HttpException} from "./HttpException";

export class LocalFileDeletionException extends HttpException {

    constructor(message: string) {
        super(message, 500);
    }
}

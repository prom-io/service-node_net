import {HttpException} from "./HttpException";

export class LocalFileHasAlreadyBeenDeletedException extends HttpException {

    constructor(message: string) {
        super(message, 410);
    }
}

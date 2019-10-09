import {HttpException} from "./HttpException";

export class DdsErrorException extends HttpException {

    constructor(message: string) {
        super(message, 500);
    }
}

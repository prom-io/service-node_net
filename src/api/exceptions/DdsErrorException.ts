import {HttpException} from "./HttpException";

export class DdsErrorException extends HttpException {

    constructor(message: string, status: number = 500) {
        super(message, status);
    }
}

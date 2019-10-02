import {HttpException} from "./HttpException";

export class BadRequestException extends HttpException {
    constructor(message: string) {
        super(message, 400);
    }
}

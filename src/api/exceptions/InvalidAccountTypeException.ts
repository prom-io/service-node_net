import {HttpException} from "./HttpException";

export class InvalidAccountTypeException extends HttpException {

    constructor(message: string) {
        super(message, 400);
    }
}

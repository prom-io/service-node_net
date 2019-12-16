import {HttpException} from "./HttpException";

export class NotServiceNodeAccountException extends HttpException {

    constructor(message: string,) {
        super(message, 400);
    }
}

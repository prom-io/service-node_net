import {HttpException} from "./HttpException";

export class NoAccountsRegisteredException extends HttpException {

    constructor(message: string) {
        super(message, 500);
    }
}

import {HttpException} from "./HttpException";

export class AccountNotFoundException extends HttpException {

    constructor(message: string) {
        super(message, 404);
    }
}

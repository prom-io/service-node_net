import {HttpException} from "./HttpException";

export class BillingApiErrorException extends HttpException {
    constructor(message: string, status = 500) {
        super(message, status);
    }
}

import {HttpException} from "./HttpException";

export class AddressIsAlreadyRegisteredException extends HttpException {
    constructor(message: string) {
        super(message, 400);
    }
}

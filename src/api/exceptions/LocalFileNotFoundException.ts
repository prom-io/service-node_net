import {HttpException} from "./HttpException";

export class LocalFileNotFoundException extends HttpException {

    constructor(message: string) {
        super(message, 404);
    }
}

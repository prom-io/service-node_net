import {HttpException} from "./HttpException";

export class FileNotFoundException extends HttpException {
    constructor(message: string) {
        super(message, 404);
    }
}

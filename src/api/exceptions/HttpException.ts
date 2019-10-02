export class HttpException extends Error {
    public readonly status: number;
    public readonly message: string;

    constructor(message: string, status: number) {
        super(message);
        this.message = message;
        this.status = status;
    }
}

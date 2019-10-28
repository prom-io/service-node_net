import {NextFunction, Request, Response} from "express";
import {HttpException} from "../exceptions";

export const exceptionHandler = (exception: HttpException, request: Request, response: Response, next: NextFunction) => {
    const status = exception.status || 500;
    const message = exception.message || "Internal error occurred";

    response.status(status)
        .json({
            message,
            status
        })
};

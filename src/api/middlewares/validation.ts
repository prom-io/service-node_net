import {plainToClass} from "class-transformer";
import {validate, ValidationError} from "class-validator";
import {RequestHandler} from "express";
import {BadRequestException} from "../exceptions";

export const validationMiddleware = <T>(type: any): RequestHandler => {
    return (request, response, next) => {
        validate(plainToClass(type, request.body))
            .then((errors: ValidationError[]) => {
                if (errors.length > 0) {
                    console.log(errors);
                    const message = errors.map(error => Object.values(error.constraints)).join(", ");
                    next(new BadRequestException(message));
                } else {
                    next();
                }
            })
    }
};

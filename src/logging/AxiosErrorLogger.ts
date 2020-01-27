import {Injectable} from "@nestjs/common";
import {AxiosError} from "axios";
import {config} from "../config";
import {LogLevel} from "../config/EnvConfig";

@Injectable()
export class AxiosErrorLogger {

    public logAxiosError(axiosError: any): void {
        if (axiosError.config) {
            axiosError = axiosError as AxiosError;

            if (config.getLogLevel() === LogLevel.DEBUG) {
                if (axiosError.response) {
                    if (axiosError.response.data) {
                        console.log(axiosError.response.data);
                    } else {
                        console.log(axiosError.response);
                    }
                } else {
                    console.log(axiosError);
                }
            } else if (config.getLogLevel() === LogLevel.TRACE) {
                console.log(axiosError);
            }
        }
    }
}

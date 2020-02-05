import {Injectable} from "@nestjs/common";
import {AxiosError} from "axios";
import {config, LogLevel, getLogLevel} from "../config";

@Injectable()
export class AxiosErrorLogger {

    public logAxiosError(axiosError: any): void {
        if (axiosError.config) {
            axiosError = axiosError as AxiosError;

            if (getLogLevel(config) === LogLevel.INFO) {
                if (axiosError.response) {
                    if (axiosError.response.data) {
                        console.log(axiosError.response.data);
                    } else {
                        console.log(axiosError.response);
                    }
                } else {
                    console.log(axiosError);
                }
            } else if (getLogLevel(config) === LogLevel.DEBUG) {
                console.log(axiosError);
            }
        }
    }
}

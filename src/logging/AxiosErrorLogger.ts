import {Injectable} from "@nestjs/common";
import {AxiosError} from "axios";
import {config, LogLevel, getLogLevel} from "../config";

@Injectable()
export class AxiosErrorLogger {

    public logAxiosError(axiosError: any): void {
        if (axiosError.config) {
            axiosError = axiosError as AxiosError;

            switch (getLogLevel(config)) {
                case LogLevel.DEBUG:
                    console.error(axiosError);
                    break;
                case LogLevel.INFO:
                    console.error(axiosError.trace);
                    if (axiosError.response) {
                        if (axiosError.response.data) {
                            console.log(axiosError.response.data);
                        } else {
                            console.log(axiosError.response);
                        }
                    }
                    break;
                case LogLevel.WARN:
                case LogLevel.ERROR:
                    console.error(axiosError.trace);
                    break;
            }
        } else {
            console.error(axiosError.trace);
        }
    }
}

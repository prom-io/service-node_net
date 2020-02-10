import {EnvConfig} from "./EnvConfig";

export enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR"
}

export const getLogLevel = (config: EnvConfig): LogLevel => {
    switch (config.LOGGING_LEVEL.toUpperCase().trim()) {
        case "DEBUG":
            return LogLevel.DEBUG;
        case "INFO":
            return LogLevel.INFO;
        case "WARN":
        case "WARNING":
            return LogLevel.WARN;
        case "ERROR":
            return LogLevel.ERROR;
        default:
            return LogLevel.INFO;

    }
};

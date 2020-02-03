import {Env} from "env-decorator";

export enum LogLevel {
    TRACE = "TRACE",
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR"
}

export class EnvConfig {
    @Env({required: true, type: "number"})
    SERVICE_NODE_API_PORT: number;

    @Env({required: true, type: "string"})
    DDS_API_BASE_URL: string;

    @Env({required: true, type: "string"})
    BILLING_API_BASE_URL: string;

    @Env({required: true, type: "string"})
    TEMPORARY_FILES_DIRECTORY: string;

    @Env({required: true, type: "string"})
    DDS_STUB_FILES_DIRECTORY: string;

    @Env({type: "string"})
    LOGGING_LEVEL: string = "INFO";

    @Env({required: true, type: "string"})
    NEDB_DIRECTORY: string;

    @Env({type: "boolean"})
    IS_BOOTSTRAP_NODE: boolean = false;

    @Env({type: "number"})
    BOOTSTRAP_NODE_PORT = 12345;

    @Env({type: "string"})
    BOOTSTRAP_NODE_PEER_ID: string | undefined = undefined;

    @Env({type: "string"})
    BOOTSTRAP_NODE_PRIVATE_KEY: string | undefined = undefined;

    @Env({type: "string"})
    BOOTSTRAP_NODE_PUBLIC_KEY: string | undefined = undefined;

    @Env({type: "boolean"})
    USE_LOCAL_IP_ADDRESS_FOR_REGISTRATION = false;

    @Env({type: "string"})
    INITIAL_ACCOUNT_PRIVATE_KEY: string | undefined = undefined;

    public getLogLevel(): LogLevel {
        switch (this.LOGGING_LEVEL.toUpperCase().trim()) {
            case "TRACE":
                return LogLevel.TRACE;
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
    }
}

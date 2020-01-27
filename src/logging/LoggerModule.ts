import {Global, Module} from "@nestjs/common";
import {LoggerService, LoggerTransport} from "nest-logger";
import {config} from "../config";
import {AxiosErrorLogger} from "./AxiosErrorLogger";

@Global()
@Module({
    providers: [
        {
            provide: LoggerService,
            useFactory: () => {
                const loggers = LoggerService.getLoggers(
                    [LoggerTransport.CONSOLE],
                    {
                        serviceName: "loggerService",
                        colorize: true
                    }
                );

                return new LoggerService(
                    config.LOGGING_LEVEL,
                    loggers
                )
            }
        },
        AxiosErrorLogger
    ],
    exports: [LoggerService, AxiosErrorLogger]
})
export class LoggerModule {}

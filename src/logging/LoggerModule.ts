import {Global, Module} from "@nestjs/common";
import {LoggerService, LoggerTransport} from "nest-logger";
import {config} from "../config";

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
        }
    ],
    exports: [LoggerService]
})
export class LoggerModule {}

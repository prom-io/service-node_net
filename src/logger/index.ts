import winston from "winston";
const {createLogger, format, transports} = winston;

let __logger: winston.Logger|null = null;

const create = (): winston.Logger => {
    const logFileName: string = process.env.LOG_FILENAME || "error";
    const logger = createLogger({
        format: format.combine(
            format.timestamp({format: "YYYY-MM-DD HH:mm:ss"}),
            format.errors({stack: true}),
            format.splat(),
            format.json(),
        ),
        transports: [
            new transports.File({filename: `error-${logFileName}.log`, level: "error"}),
            new transports.File({filename: `${logFileName}.log`}),
        ],
    });

    if (process.env.NODE_ENV !== "production") {
        logger.add(new winston.transports.Console({
            format: winston.format.simple(),
        }));
    }

    return logger;
};

const getOrCreateLogger = (): winston.Logger => {
    if (null === __logger) {
        __logger = create();
    }
    return __logger;
};

export function getLogger(): winston.Logger {
    return getOrCreateLogger();
}

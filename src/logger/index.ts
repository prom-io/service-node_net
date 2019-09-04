import winston from 'winston'
let {createLogger, format, transports} = winston

let __logger:winston.Logger|null = null;

let create = (): winston.Logger => {
    let logFileName: string = process.env.LOG_FILENAME || 'error'
    let logger = createLogger({
        format: format.combine(
            format.timestamp({format:'YYYY-MM-DD HH:mm:ss'}),
            format.errors({stack: true}),
            format.splat(),
            format.json()
        ),
        transports: [
            new transports.File({filename:`error-${logFileName}.log`, level: 'error'}),
            new transports.File({filename:`${logFileName}.log`})
        ]
    })

    if (process.env.NODE_ENV !== 'production') {
        logger.add(new winston.transports.Console({
            format: winston.format.simple()
        }))
    }

    return logger
}

let getOrCreateLogger = (): winston.Logger => {
    if (null ===__logger) {
        __logger = create()
    }
    return __logger
}

export function getLogger(): winston.Logger {
    return getOrCreateLogger()
}
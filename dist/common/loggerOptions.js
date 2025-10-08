import pino from 'pino';
export const loggerOptions = {
    level: 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
            ignore: 'hostname',
        },
    },
};
//# sourceMappingURL=loggerOptions.js.map
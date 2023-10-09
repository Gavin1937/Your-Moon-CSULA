const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf, colorize } = format;

module.exports = (filepath, log_level) => {
    
    /**
     * Customizing output for log
     */
    const myFormat = printf(({ level, message, label, timestamp }) => {
        return `[${label}][${timestamp}] ${level.toUpperCase()}: ${message}`;
    });
    
    /**
     * Creating logger with module defined options
     */
    const logger = createLogger({
        // Output log in console and in the log file
        // the order in combine() function matters
        transports: [
            new transports.Console({
                handleExceptions: true,
                level: log_level,
                format: combine(
                    label({ label: 'SERVER' }),
                    timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
                    myFormat,
                    colorize({
                        all: true,
                        colors: { debug: 'yellow', info: 'green', warn: 'red', error: 'red' }
                    })
                )
            }),
            new transports.File({
                filename: filepath,
                level: log_level,
                format: combine(
                    label({ label: 'SERVER' }),
                    timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
                    myFormat
                )
            })
        ]
    });
    
    return logger;
}
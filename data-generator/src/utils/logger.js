/**
 * Simple Logger Utility
 * Provides colored console logging with timestamps
 */

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',

    // Foreground colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',

    // Background colors
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
};

/**
 * Get formatted timestamp
 */
function getTimestamp() {
    const now = new Date();
    return now.toISOString();
}

/**
 * Format log message with color and timestamp
 */
function formatMessage(level, color, ...args) {
    const timestamp = getTimestamp();
    const prefix = `${colors.dim}[${timestamp}]${colors.reset} ${color}[${level}]${colors.reset}`;
    return [prefix, ...args];
}

/**
 * Logger object with different log levels
 */
const logger = {
    info: (...args) => {
        console.log(...formatMessage('INFO', colors.cyan, ...args));
    },

    success: (...args) => {
        console.log(...formatMessage('SUCCESS', colors.green, ...args));
    },

    warn: (...args) => {
        console.warn(...formatMessage('WARN', colors.yellow, ...args));
    },

    error: (...args) => {
        console.error(...formatMessage('ERROR', colors.red, ...args));
    },

    debug: (...args) => {
        if (process.env.DEBUG === 'true') {
            console.log(...formatMessage('DEBUG', colors.magenta, ...args));
        }
    },
};

module.exports = logger;

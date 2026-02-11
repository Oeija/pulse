/**
 * Simple Logger Utility for Backend
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
};

/**
 * Get formatted timestamp
 */
function getTimestamp(): string {
    const now = new Date();
    return now.toISOString();
}

/**
 * Format log message with color and timestamp
 */
function formatMessage(level: string, color: string, ...args: any[]): any[] {
    const timestamp = getTimestamp();
    const prefix = `${colors.dim}[${timestamp}]${colors.reset} ${color}[${level}]${colors.reset}`;
    return [prefix, ...args];
}

/**
 * Logger object with different log levels
 */
const logger = {
    info: (...args: any[]) => {
        console.log(...formatMessage('INFO', colors.cyan, ...args));
    },

    success: (...args: any[]) => {
        console.log(...formatMessage('SUCCESS', colors.green, ...args));
    },

    warn: (...args: any[]) => {
        console.warn(...formatMessage('WARN', colors.yellow, ...args));
    },

    error: (...args: any[]) => {
        console.error(...formatMessage('ERROR', colors.red, ...args));
    },

    debug: (...args: any[]) => {
        if (process.env.DEBUG === 'true') {
            console.log(...formatMessage('DEBUG', colors.magenta, ...args));
        }
    },
};

export default logger;

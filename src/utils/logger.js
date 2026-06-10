const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');
const ERROR_LOG = path.join(LOG_DIR, 'error.log');
const BOT_LOG = path.join(LOG_DIR, 'bot.log');
const ORDER_LOG = path.join(LOG_DIR, 'order.log');
const BALANCE_LOG = path.join(LOG_DIR, 'balance.log');

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m'
};

function getTimestamp() {
    return new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
}

function writeLog(file, message) {
    try {
        const logEntry = `[${getTimestamp()}] ${message}\n`;
        fs.appendFileSync(file, logEntry);
    } catch (e) {}
}

function logSuccess(message) {
    const timestamp = getTimestamp();
    const logMsg = `${colors.green}✅${colors.reset} ${colors.bright}[${timestamp}]${colors.reset} ${colors.green}${message}${colors.reset}`;
    console.log(logMsg);
    writeLog(BOT_LOG, `[SUCCESS] ${message}`);
}

function logError(error, context = '') {
    const timestamp = getTimestamp();
    const errorMsg = error.message || String(error);
    const logMsg = `${colors.red}❌${colors.reset} ${colors.bright}[${timestamp}]${colors.reset} ${context ? `${colors.magenta}[${context}]${colors.reset} ` : ''}${colors.red}${errorMsg}${colors.reset}`;
    console.error(logMsg);
    if (error.stack) {
        console.error(`${colors.dim}${error.stack}${colors.reset}`);
        writeLog(ERROR_LOG, `${context ? `[${context}] ` : ''}${errorMsg}\nStack: ${error.stack}`);
    } else {
        writeLog(ERROR_LOG, `${context ? `[${context}] ` : ''}${errorMsg}`);
    }
    return errorMsg;
}

function logInfo(message) {
    const timestamp = getTimestamp();
    const logMsg = `${colors.cyan}📌${colors.reset} ${colors.bright}[${timestamp}]${colors.reset} ${colors.white}${message}${colors.reset}`;
    console.log(logMsg);
    writeLog(BOT_LOG, `[INFO] ${message}`);
}

function logWarning(message) {
    const timestamp = getTimestamp();
    const logMsg = `${colors.yellow}⚠️${colors.reset} ${colors.bright}[${timestamp}]${colors.reset} ${colors.yellow}${message}${colors.reset}`;
    console.log(logMsg);
    writeLog(BOT_LOG, `[WARNING] ${message}`);
}

function logDebug(message) {
    const timestamp = getTimestamp();
    const logMsg = `${colors.magenta}🔍${colors.reset} ${colors.dim}[${timestamp}]${colors.reset} ${colors.cyan}${message}${colors.reset}`;
    console.log(logMsg);
    writeLog(BOT_LOG, `[DEBUG] ${message}`);
}

function logOrder(userId, orderId, action, details = '') {
    const timestamp = getTimestamp();
    const logMsg = `${colors.magenta}📦${colors.reset} ${colors.bright}[${timestamp}]${colors.reset} ${colors.yellow}[USER:${userId}]${colors.reset} ${colors.cyan}[ORDER:${orderId}]${colors.reset} ${colors.green}${action}${colors.reset} ${colors.white}${details}${colors.reset}`;
    console.log(logMsg);
    writeLog(ORDER_LOG, `[USER:${userId}] [ORDER:${orderId}] ${action} ${details}`);
}

function logDeposit(userId, depositId, action, details = '') {
    const timestamp = getTimestamp();
    const logMsg = `${colors.green}💰${colors.reset} ${colors.bright}[${timestamp}]${colors.reset} ${colors.yellow}[USER:${userId}]${colors.reset} ${colors.cyan}[DEPOSIT:${depositId}]${colors.reset} ${colors.green}${action}${colors.reset} ${colors.white}${details}${colors.reset}`;
    console.log(logMsg);
    writeLog(BOT_LOG, `[DEPOSIT] User:${userId} Deposit:${depositId} ${action} ${details}`);
}

function logBalance(userId, oldBalance, newBalance, action) {
    const timestamp = getTimestamp();
    const arrow = newBalance > oldBalance ? '↑' : (newBalance < oldBalance ? '↓' : '→');
    const arrowColor = newBalance > oldBalance ? colors.green : (newBalance < oldBalance ? colors.red : colors.yellow);
    
    const logMsg = `${colors.cyan}💵${colors.reset} ${colors.bright}[${timestamp}]${colors.reset} ${colors.magenta}[USER:${userId}]${colors.reset} ${colors.yellow}${action}${colors.reset} | ${colors.white}${oldBalance}${colors.reset} ${arrowColor}${arrow}${colors.reset} ${colors.green}${newBalance}${colors.reset}`;
    console.log(logMsg);
    writeLog(BALANCE_LOG, `[USER:${userId}] ${action} ${oldBalance} → ${newBalance}`);
}

function logStartup(message) {
    const timestamp = getTimestamp();
    const logMsg = `\n${colors.green}🚀${colors.reset} ${colors.bright}═══════════════════════════════════════════════════════${colors.reset}\n${colors.cyan}✨${colors.reset} ${colors.bright}[${timestamp}]${colors.reset} ${colors.white}${message}${colors.reset}\n${colors.green}🚀${colors.reset} ${colors.bright}═══════════════════════════════════════════════════════${colors.reset}\n`;
    console.log(logMsg);
    writeLog(BOT_LOG, `[STARTUP] ${message}`);
}

module.exports = {
    logSuccess,
    logError,
    logInfo,
    logWarning,
    logDebug,
    logOrder,
    logDeposit,
    logBalance,
    logStartup,
    getTimestamp,
    colors
};
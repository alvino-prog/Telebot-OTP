const TOKEN = '8786896747:AAFt3YPzlJHkjmejRai28Wx6QhN4bwrjegc';
const CHANNEL_ID = '@simvaultotp';
const OWNER_ID = 786863974;

const NOKOS_API_KEY = 'd216de7fa05df9d7dfe44ff878c19d3a88973237f9802c7d';

const MIN_DEPOSIT = 2000;
const MAX_DEPOSIT = 20000;

const ORDER_MARKUP_PERCENT = 25;
const DEPOSIT_MARKUP_PERCENT = 10;

const DEPOSIT_OPTIONS = [2000, 10000, 15000, 20000, 20000];

const MENU_EFFECTS = [
    "5104841245755180586",
    "5107584321108051014",
    "5159385139981059251",
    "5046509860389126442"
];

function getRandomEffect() {
    return MENU_EFFECTS[Math.floor(Math.random() * MENU_EFFECTS.length)];
}

function calculateOrderPrice(originalPrice) {
    return Math.ceil(originalPrice * (1 + ORDER_MARKUP_PERCENT / 100));
}

function calculateDepositAmount(originalAmount) {
    return Math.ceil(originalAmount * (1 + DEPOSIT_MARKUP_PERCENT / 100));
}

module.exports = {
    TOKEN,
    CHANNEL_ID,
    OWNER_ID,
    NOKOS_API_KEY,
    MIN_DEPOSIT,
    MAX_DEPOSIT,
    ORDER_MARKUP_PERCENT,
    DEPOSIT_MARKUP_PERCENT,
    DEPOSIT_OPTIONS,
    MENU_EFFECTS,
    getRandomEffect,
    calculateOrderPrice,
    calculateDepositAmount
};
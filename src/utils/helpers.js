function formatRupiah(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) {
        amount = 0;
    }
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(timestamp) {
    if (!timestamp) {
        const now = new Date();
        return now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    }
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
}

function maskPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '-';
    if (phoneNumber.length <= 6) return phoneNumber;
    const first = phoneNumber.substring(0, 3);
    const last = phoneNumber.substring(phoneNumber.length - 3);
    return `${first}****${last}`;
}

function maskUserId(userId) {
    if (!userId) return '***';
    const str = String(userId);
    if (str.length <= 6) return str;
    return str.substring(0, 3) + '***' + str.substring(str.length - 3);
}

function maskOrderId(orderId) {
    if (!orderId) return '***';
    const str = String(orderId);
    if (str.length <= 8) return str;
    return str.substring(0, 4) + '***' + str.substring(str.length - 4);
}

function maskDepositId(depositId) {
    if (!depositId) return '***';
    const str = String(depositId);
    if (str.length <= 8) return str;
    return str.substring(0, 4) + '***' + str.substring(str.length - 4);
}

function getFlagEmoji(countryCode) {
    if (!countryCode || typeof countryCode !== 'string') return '🌐';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

module.exports = {
    formatRupiah,
    formatDate,
    maskPhoneNumber,
    maskDepositId,
    maskOrderId,
    maskUserId,
    getFlagEmoji
};
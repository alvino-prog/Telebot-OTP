const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const ACTIVE_FILE = path.join(DATA_DIR, 'active.json');
const BALANCE_FILE = path.join(DATA_DIR, 'balances.json');
const DEPOSIT_FILE = path.join(DATA_DIR, 'deposits.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

let fileLocks = new Map();

async function withFileLock(filePath, callback) {
    const startTime = Date.now();
    while (fileLocks.has(filePath)) {
        if (Date.now() - startTime > 5000) {
            throw new Error(`Timeout waiting for file lock: ${filePath}`);
        }
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    fileLocks.set(filePath, Date.now());
    
    try {
        const result = await callback();
        return result;
    } finally {
        fileLocks.delete(filePath);
    }
}

function ensureFiles() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ORDERS_FILE)) {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(ACTIVE_FILE)) {
        fs.writeFileSync(ACTIVE_FILE, JSON.stringify({}, null, 2));
    }
    if (!fs.existsSync(BALANCE_FILE)) {
        fs.writeFileSync(BALANCE_FILE, JSON.stringify({}, null, 2));
    }
    if (!fs.existsSync(DEPOSIT_FILE)) {
        fs.writeFileSync(DEPOSIT_FILE, JSON.stringify({}, null, 2));
    }
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
    }
}

ensureFiles();

function saveOrder(orderData) {
    return withFileLock(ORDERS_FILE, () => {
        const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
        orders.push(orderData);
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
        return orderData;
    });
}

function getOrderById(orderId, userId) {
    try {
        const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
        return orders.find(o => o.id === orderId && o.userId === userId);
    } catch (error) {
        return null;
    }
}

function getOrderByIdOnly(orderId) {
    try {
        const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
        return orders.find(o => o.id === orderId);
    } catch (error) {
        return null;
    }
}

function getUserOrders(userId) {
    try {
        const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
        return orders.filter(o => o.userId === userId).reverse();
    } catch (error) {
        return [];
    }
}

function getAllOrders() {
    try {
        return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
    } catch (error) {
        return [];
    }
}

function updateOrderStatus(orderId, userId, status) {
    return withFileLock(ORDERS_FILE, () => {
        const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
        const index = orders.findIndex(o => o.id === orderId && o.userId === userId);
        if (index !== -1) {
            orders[index].status = status;
            fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
            return true;
        }
        return false;
    });
}

function updateOrderOtp(orderId, userId, otp, otpMessage = null) {
    return withFileLock(ORDERS_FILE, () => {
        const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
        const index = orders.findIndex(o => o.id === orderId && o.userId === userId);
        if (index !== -1) {
            orders[index].otp = otp;
            if (otpMessage) orders[index].otp_message = otpMessage;
            orders[index].status = 'completed';
            orders[index].completed_at = Date.now();
            fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
            return true;
        }
        return false;
    });
}

function saveActiveOrder(order) {
    return withFileLock(ACTIVE_FILE, () => {
        const active = JSON.parse(fs.readFileSync(ACTIVE_FILE, 'utf8'));
        active[order.id] = order;
        fs.writeFileSync(ACTIVE_FILE, JSON.stringify(active, null, 2));
        return order;
    });
}

function getActiveOrders() {
    try {
        return JSON.parse(fs.readFileSync(ACTIVE_FILE, 'utf8'));
    } catch (error) {
        return {};
    }
}

function removeActiveOrder(orderId) {
    return withFileLock(ACTIVE_FILE, () => {
        const active = JSON.parse(fs.readFileSync(ACTIVE_FILE, 'utf8'));
        delete active[orderId];
        fs.writeFileSync(ACTIVE_FILE, JSON.stringify(active, null, 2));
        return true;
    });
}

function updateActiveOrderStatus(orderId, status, otp = null, otpMessage = null) {
    return withFileLock(ACTIVE_FILE, () => {
        const active = JSON.parse(fs.readFileSync(ACTIVE_FILE, 'utf8'));
        if (active[orderId]) {
            active[orderId].status = status;
            if (otp) active[orderId].otp = otp;
            if (otpMessage) active[orderId].otp_message = otpMessage;
            fs.writeFileSync(ACTIVE_FILE, JSON.stringify(active, null, 2));
            return true;
        }
        return false;
    });
}

function getUserBalance(userId) {
    try {
        const balances = JSON.parse(fs.readFileSync(BALANCE_FILE, 'utf8'));
        const balance = balances[String(userId)] || 0;
        return balance;
    } catch (error) {
        return 0;
    }
}

function deductUserBalance(userId, amount) {
    return withFileLock(BALANCE_FILE, () => {
        const balances = JSON.parse(fs.readFileSync(BALANCE_FILE, 'utf8'));
        const current = balances[String(userId)] || 0;
        
        if (current >= amount) {
            const newBalance = current - amount;
            balances[String(userId)] = newBalance;
            fs.writeFileSync(BALANCE_FILE, JSON.stringify(balances, null, 2));
            return { success: true, oldBalance: current, newBalance: newBalance };
        }
        
        return { success: false, oldBalance: current, newBalance: current, need: amount - current };
    });
}

function addUserBalance(userId, amount) {
    return withFileLock(BALANCE_FILE, () => {
        const balances = JSON.parse(fs.readFileSync(BALANCE_FILE, 'utf8'));
        const userIdStr = String(userId);
        const current = balances[userIdStr] || 0;
        const newBalance = current + amount;
        balances[userIdStr] = newBalance;
        fs.writeFileSync(BALANCE_FILE, JSON.stringify(balances, null, 2));
        return { success: true, oldBalance: current, newBalance: newBalance };
    });
}

function setUserBalance(userId, amount) {
    return withFileLock(BALANCE_FILE, () => {
        const balances = JSON.parse(fs.readFileSync(BALANCE_FILE, 'utf8'));
        const userIdStr = String(userId);
        const oldBalance = balances[userIdStr] || 0;
        balances[userIdStr] = amount;
        fs.writeFileSync(BALANCE_FILE, JSON.stringify(balances, null, 2));
        return { oldBalance: oldBalance, newBalance: amount };
    });
}

function getAllBalances() {
    try {
        return JSON.parse(fs.readFileSync(BALANCE_FILE, 'utf8'));
    } catch (error) {
        return {};
    }
}

function saveDeposit(depositData) {
    return withFileLock(DEPOSIT_FILE, () => {
        const deposits = JSON.parse(fs.readFileSync(DEPOSIT_FILE, 'utf8'));
        deposits[depositData.id] = depositData;
        fs.writeFileSync(DEPOSIT_FILE, JSON.stringify(deposits, null, 2));
        return depositData;
    });
}

function getDeposit(depositId) {
    try {
        const deposits = JSON.parse(fs.readFileSync(DEPOSIT_FILE, 'utf8'));
        return deposits[depositId];
    } catch (error) {
        return null;
    }
}

function getAllDeposits() {
    try {
        const deposits = JSON.parse(fs.readFileSync(DEPOSIT_FILE, 'utf8'));
        return Object.values(deposits);
    } catch (error) {
        return [];
    }
}

function getUserDeposits(userId) {
    try {
        const deposits = JSON.parse(fs.readFileSync(DEPOSIT_FILE, 'utf8'));
        return Object.values(deposits).filter(d => d.userId === userId).reverse();
    } catch (error) {
        return [];
    }
}

function updateDepositStatus(depositId, status, messageId = null) {
    return withFileLock(DEPOSIT_FILE, () => {
        const deposits = JSON.parse(fs.readFileSync(DEPOSIT_FILE, 'utf8'));
        if (deposits[depositId]) {
            deposits[depositId].status = status;
            if (messageId) deposits[depositId].message_id = messageId;
            fs.writeFileSync(DEPOSIT_FILE, JSON.stringify(deposits, null, 2));
            return true;
        }
        return false;
    });
}

function removeDeposit(depositId) {
    return withFileLock(DEPOSIT_FILE, () => {
        const deposits = JSON.parse(fs.readFileSync(DEPOSIT_FILE, 'utf8'));
        delete deposits[depositId];
        fs.writeFileSync(DEPOSIT_FILE, JSON.stringify(deposits, null, 2));
        return true;
    });
}

function saveUser(userId, userData) {
    return withFileLock(USERS_FILE, () => {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        users[String(userId)] = {
            ...users[String(userId)],
            ...userData,
            last_active: Date.now()
        };
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        return users[String(userId)];
    });
}

function getUser(userId) {
    try {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        return users[String(userId)] || null;
    } catch (error) {
        return null;
    }
}

function getAllUsers() {
    try {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        return users;
    } catch (error) {
        return {};
    }
}

function getTotalUsers() {
    try {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        return Object.keys(users).length;
    } catch (error) {
        return 0;
    }
}

module.exports = {
    saveOrder,
    getOrderById,
    getOrderByIdOnly,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    updateOrderOtp,
    saveActiveOrder,
    getActiveOrders,
    removeActiveOrder,
    updateActiveOrderStatus,
    getUserBalance,
    setUserBalance,
    deductUserBalance,
    addUserBalance,
    getAllBalances,
    saveDeposit,
    getDeposit,
    getAllDeposits,
    getUserDeposits,
    updateDepositStatus,
    removeDeposit,
    saveUser,
    getUser,
    getAllUsers,
    getTotalUsers
};
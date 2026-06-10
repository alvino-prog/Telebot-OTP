const globalLocks = new Map();

function getLockKey(userId, type = 'user') {
    return type === 'user' ? `user_lock_${userId}` : `global_lock_${type}`;
}

async function acquireLock(userId, timeout = 10000, type = 'user') {
    const lockKey = getLockKey(userId, type);
    const startTime = Date.now();
    
    while (globalLocks.has(lockKey)) {
        if (Date.now() - startTime > timeout) {
            throw new Error(`Timeout waiting for lock: ${lockKey}`);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    globalLocks.set(lockKey, {
        userId: userId,
        acquiredAt: Date.now(),
        type: type
    });
    
    return true;
}

function releaseLock(userId, type = 'user') {
    const lockKey = getLockKey(userId, type);
    globalLocks.delete(lockKey);
    return true;
}

function isLocked(userId, type = 'user') {
    const lockKey = getLockKey(userId, type);
    return globalLocks.has(lockKey);
}

function getActiveLocks() {
    const locks = [];
    for (const [key, value] of globalLocks.entries()) {
        locks.push({
            key: key,
            userId: value.userId,
            acquiredAt: value.acquiredAt,
            type: value.type,
            age: Date.now() - value.acquiredAt
        });
    }
    return locks;
}

async function withLock(userId, callback, timeout = 10000) {
    const lockKey = getLockKey(userId, 'user');
    const startTime = Date.now();
    
    while (globalLocks.has(lockKey)) {
        if (Date.now() - startTime > timeout) {
            throw new Error(`Timeout waiting for lock for user ${userId}`);
        }
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    globalLocks.set(lockKey, {
        userId: userId,
        acquiredAt: Date.now(),
        type: 'user'
    });
    
    try {
        const result = await callback();
        return result;
    } finally {
        globalLocks.delete(lockKey);
    }
}

async function withBalanceLock(userId, callback, timeout = 10000) {
    const lockKey = `balance_lock_${userId}`;
    const startTime = Date.now();
    
    while (globalLocks.has(lockKey)) {
        if (Date.now() - startTime > timeout) {
            throw new Error(`Timeout waiting for balance lock for user ${userId}`);
        }
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    globalLocks.set(lockKey, {
        userId: userId,
        acquiredAt: Date.now(),
        type: 'balance'
    });
    
    try {
        const result = await callback();
        return result;
    } finally {
        globalLocks.delete(lockKey);
    }
}

async function withOrderLock(orderId, callback, timeout = 10000) {
    const lockKey = `order_lock_${orderId}`;
    const startTime = Date.now();
    
    while (globalLocks.has(lockKey)) {
        if (Date.now() - startTime > timeout) {
            throw new Error(`Timeout waiting for order lock for order ${orderId}`);
        }
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    globalLocks.set(lockKey, {
        orderId: orderId,
        acquiredAt: Date.now(),
        type: 'order'
    });
    
    try {
        const result = await callback();
        return result;
    } finally {
        globalLocks.delete(lockKey);
    }
}

function cleanupStaleLocks(maxAge = 30000) {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of globalLocks.entries()) {
        if (now - value.acquiredAt > maxAge) {
            globalLocks.delete(key);
            cleaned++;
        }
    }
    
    return cleaned;
}

setInterval(() => {
    const cleaned = cleanupStaleLocks(30000);
    if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} stale locks`);
    }
}, 60000);

module.exports = {
    acquireLock,
    releaseLock,
    isLocked,
    getActiveLocks,
    withLock,
    withBalanceLock,
    withOrderLock,
    cleanupStaleLocks
};
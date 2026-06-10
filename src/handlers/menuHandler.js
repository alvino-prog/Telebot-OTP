const {
    getUserBalance,
    getUserOrders,
    getActiveOrders
} = require('../database/db');

const { 
    formatRupiah, 
    maskPhoneNumber, 
    formatDate 
} = require('../utils/helpers');

const { 
   OWNER_ID, 
   getRandomEffect 
} = require('../config');

const { 
   userSessions, 
   messageIds, 
   handleNokosOrder 
} = require('./nokosHandler');

const { logError, logInfo, logSuccess, logDebug, logWarning } = require('../utils/logger');

async function sendMainMenu(bot, chatId) {
    const balance = getUserBalance(chatId);
    const isOwnerUser = String(chatId) === String(OWNER_ID);
    
    const botInfo = await bot.getMe();
    const botMention = `<a href="https://t.me/${botInfo.username}">${botInfo.first_name || botInfo.username}</a>`;
    const randomEffect = getRandomEffect();
    
    const text = `
<blockquote>
<b>🤖 ${botMention} - OTP BOT</b>
•————————————–––––——––•
<code>Bot Penyedia Jasa Nomor Virtual untuk menerima SMS OTP</code>
•————————————–––––——––•
<b>🆔 ID Akun:</b> <code>${chatId}</code>
<b>💰 Saldo:</b> ${formatRupiah(balance)}
<b>📅 Waktu:</b> ${formatDate()}
•————————————–––––——––•
<b>📌 Pilih menu di bawah:</b>
</blockquote>`;
    
    let keyboardButtons = [
        [{ text: '🛒 Beli Nomor', callback_data: 'menu_beli' }],
        [{ text: '💰 Cek Saldo', callback_data: 'menu_saldo' }, { text: '💳 Deposit', callback_data: 'menu_deposit' }],
        [{ text: '📋 Riwayat', callback_data: 'menu_riwayat' }, { text: '❓ Bantuan', callback_data: 'menu_bantuan' }]
    ];
    
    if (isOwnerUser) {
        keyboardButtons.push([{ text: '👑 Menu Owner', callback_data: 'owner_menu' }]);
    }
    
    const keyboard = {
        reply_markup: {
            inline_keyboard: keyboardButtons
        }
    };
    
    if (messageIds.has(chatId)) {
        try { await bot.deleteMessage(chatId, messageIds.get(chatId)); } catch(e) {}
        messageIds.delete(chatId);
    }
    
    await bot.sendChatAction(chatId, 'typing');
    
    try {
        const sent = await bot.sendMessage(chatId, text, {
            parse_mode: 'HTML',
            reply_markup: keyboard.reply_markup,
            message_effect_id: randomEffect
        });
        messageIds.set(chatId, sent.message_id);
    } catch (error) {
        const sent = await bot.sendMessage(chatId, text, {
            parse_mode: 'HTML',
            reply_markup: keyboard.reply_markup
        });
        messageIds.set(chatId, sent.message_id);
    }
}

async function handleBackToMain(bot, chatId) {
    userSessions.delete(chatId);
    userSessions.delete(chatId + '_search');
    await sendMainMenu(bot, chatId);
}

async function handleMenuBeli(bot, chatId, messageId) {
    await handleNokosOrder(bot, chatId);
}

async function handleMenuSaldo(bot, chatId, messageId) {
    const balance = getUserBalance(chatId);
    
    let userName = '';
    let userUsername = '';
    let mentionLink = '';
    
    try {
        const chatMember = await bot.getChatMember(chatId, chatId);
        const userData = chatMember.user;
        const firstName = userData.first_name || '';
        const lastName = userData.last_name || '';
        const username = userData.username;
        const fullName = `${firstName} ${lastName}`.trim();
        userName = fullName || 'Pengguna';
        userUsername = username ? `@${username}` : '-';
        
        if (username) {
            mentionLink = `<a href="https://t.me/${username}">${userName}</a>`;
        } else {
            mentionLink = userName;
        }
    } catch (err) {
        userName = 'Pengguna';
        userUsername = '-';
        mentionLink = userName;
    }
    
    const totalOrders = getUserOrders(chatId).length;
    const completedOrders = getUserOrders(chatId).filter(o => o.status === 'completed').length;
    const totalSpent = getUserOrders(chatId).reduce((sum, o) => sum + (o.cost || 0), 0);
    const activeOrderCount = Object.keys(getActiveOrders()).filter(id => {
        const order = getActiveOrders()[id];
        return order.userId === chatId && order.status === 'waiting';
    }).length;
    
    const text = `
<blockquote>
<b>💳 MENU SALDO</b>
•————————————–––––——––•

<b>👤 INFORMASI AKUN:</b>
• 📛 Nama: ${mentionLink}
• 🔖 Username: ${userUsername}
• 🆔 User ID: <code>${chatId}</code>

•————————————–––––——––•

<b>💰 SALDO ANDA:</b>
<b>${formatRupiah(balance)}</b>

•————————————–––––——––•

<b>📊 STATISTIK:</b>
• 📦 Total Order: ${totalOrders}
• ✅ Order Selesai: ${completedOrders}
• 💸 Total Belanja: ${formatRupiah(totalSpent)}
• ⏳ Order Aktif: ${activeOrderCount}

•————————————–––––——––•

<b>💡 INFORMASI:</b>
• Minimal deposit: Rp5.000
• Maksimal deposit: Rp50.000
• Via QRIS (DANA/OVO/GoPay)

</blockquote>`;
    
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '💳 Deposit Saldo', callback_data: 'menu_deposit' }],
                [{ text: '📋 Riwayat Order', callback_data: 'menu_riwayat' }],
                [{ text: '⌫ Kembali ke Menu Utama', callback_data: 'back_to_main' }]
            ]
        }
    };
    
    try {
        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: keyboard.reply_markup,
            disable_web_page_preview: true
        });
    } catch (error) {
        if (error.message && (error.message.includes('message to edit not found') || error.message.includes('message is not modified'))) {
            try {
                const sent = await bot.sendMessage(chatId, text, {
                    parse_mode: 'HTML',
                    reply_markup: keyboard.reply_markup,
                    disable_web_page_preview: true
                });
                if (messageIds) {
                    messageIds.set(chatId, sent.message_id);
                }
            } catch (sendError) {
                try {
                    await bot.sendMessage(chatId, text, { parse_mode: 'HTML', disable_web_page_preview: true });
                } catch (finalError) {
                    logError(finalError, 'handleMenuSaldo - final fallback');
                }
            }
        } else if (!error.message?.includes('message is not modified')) {
            logError(error, 'handleMenuSaldo');
            try {
                await bot.sendMessage(chatId, text, {
                    parse_mode: 'HTML',
                    reply_markup: keyboard.reply_markup,
                    disable_web_page_preview: true
                });
            } catch (sendError) {
                logError(sendError, 'handleMenuSaldo - send fallback');
            }
        }
    }
}

async function handleMenuRiwayat(bot, chatId, messageId) {
    const orders = getUserOrders(chatId);
    
    if (!orders || orders.length === 0) {
        const text = `
<blockquote>
<b>📋 RIWAYAT ORDER</b>
•————————————–––––——––•
<code>Belum ada order sama sekali</code>
</blockquote>`;
        
        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🛒 Beli Sekarang', callback_data: 'menu_beli' }],
                    [{ text: '⌫ Kembali', callback_data: 'back_to_main' }]
                ]
            }
        };
        
        try {
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'HTML',
                reply_markup: keyboard.reply_markup
            });
        } catch(e) {
            const sent = await bot.sendMessage(chatId, text, {
                parse_mode: 'HTML',
                reply_markup: keyboard.reply_markup
            });
            if (messageIds) messageIds.set(chatId, sent.message_id);
        }
        return;
    }
    
    const reversedOrders = [...orders].reverse();
    const recentOrders = reversedOrders.slice(0, 5);
    
    let ordersText = '';
    for (const order of recentOrders) {
        let statusIcon = '';
        let statusText = '';
        
        if (order.status === 'completed') {
            statusIcon = '✅';
            statusText = 'Selesai';
        } else if (order.status === 'waiting') {
            statusIcon = '⏳';
            statusText = 'Menunggu OTP';
        } else if (order.status === 'cancelled') {
            statusIcon = '❌';
            statusText = 'Dibatalkan';
        } else if (order.status === 'expired') {
            statusIcon = '⏰';
            statusText = 'Expired';
        } else {
            statusIcon = '📦';
            statusText = order.status;
        }
        
        const orderDate = order.created_at ? new Date(order.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-';
        
        ordersText += `
•————————————–––––——––•
${statusIcon} <b>${statusText}</b>
📱 <b>Layanan:</b> ${order.service || '-'}
📞 <b>Nomor:</b> <code>${order.phoneNumber ? order.phoneNumber.substring(0, 6) + '****' : '-'}</code>
💰 <b>Biaya:</b> ${formatRupiah(order.cost || 0)}
📅 <b>Waktu:</b> ${orderDate}`;
        
        if (order.status === 'completed' && order.otp) {
            ordersText += `
🔑 <b>OTP:</b> <code>${order.otp}</code>
📋 <b>Lihat Detail:</b> <code>/view_${order.id}</code>`;
        }
        
        if (order.status === 'waiting') {
            ordersText += `
⏳ <b>Status:</b> Menunggu SMS...`;
        }
    }
    
    const text = `
<blockquote>
<b>📋 RIWAYAT ORDER (5 TERAKHIR)</b>
${ordersText}
•————————————–––––——––•
<b>📊 Total Order:</b> ${orders.length}
<b>✅ Selesai:</b> ${orders.filter(o => o.status === 'completed').length}
<b>❌ Dibatalkan:</b> ${orders.filter(o => o.status === 'cancelled').length}
</blockquote>`;
    
    let buttons = [];
    
    for (const order of recentOrders) {
        if (order.status === 'completed' && order.otp) {
            buttons.push([{
                text: `🔑 Lihat OTP - ${order.service} (${new Date(order.created_at).toLocaleDateString('id-ID')})`,
                callback_data: `view_otp_${order.id}`
            }]);
        }
        if (order.status === 'waiting') {
            buttons.push([{
                text: `📞 Cek Order - ${order.service}`,
                callback_data: `check_otp_${order.id}`
            }]);
        }
    }
    
    if (buttons.length > 5) {
        buttons = buttons.slice(0, 5);
    }
    
    buttons.push([{ text: '🛒 Order Lagi', callback_data: 'menu_beli' }]);
    buttons.push([{ text: '⌫ Kembali ke Menu', callback_data: 'back_to_main' }]);
    
    const keyboard = {
        reply_markup: {
            inline_keyboard: buttons
        }
    };
    
    try {
        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: keyboard.reply_markup
        });
    } catch (error) {
        if (error.message && (error.message.includes('message to edit not found') || error.message.includes('message is not modified'))) {
            try {
                const sent = await bot.sendMessage(chatId, text, {
                    parse_mode: 'HTML',
                    reply_markup: keyboard.reply_markup
                });
                if (messageIds) messageIds.set(chatId, sent.message_id);
            } catch (sendError) {
                try {
                    await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
                } catch (finalError) {
                    logError(finalError, 'handleMenuRiwayat - final fallback');
                }
            }
        } else if (!error.message?.includes('message is not modified')) {
            logError(error, 'handleMenuRiwayat');
            try {
                await bot.sendMessage(chatId, text, {
                    parse_mode: 'HTML',
                    reply_markup: keyboard.reply_markup
                });
            } catch (sendError) {
                logError(sendError, 'handleMenuRiwayat - send fallback');
            }
        }
    }
}

async function handleMenuBantuan(bot, chatId, messageId) {
    const text = `
<blockquote>
<b>❓ BANTUAN & CARA ORDER</b>
•————————————–––––——––•

<b>📌 LANGKAH ORDER:</b>
1️⃣ Pilih menu <b>🛒 Beli</b>
2️⃣ Pilih layanan (WhatsApp, Telegram, Grab, dll)
3️⃣ Pilih negara tujuan
4️⃣ Pilih server yang tersedia
5️⃣ Pilih operator (jika ada)
6️⃣ Konfirmasi dan order

<b>⏰ INFORMASI WAKTU:</b>
• ⏳ OTP masuk dalam <b>1-20 menit</b>
• ❌ Bisa cancel order setelah <b>3 menit</b>
• ⏰ Order auto expired <b>20 menit</b>
• 💰 Dana akan direfund jika expired/cancel

<b>💰 CARA DEPOSIT:</b>
• Minimal deposit: <b>Rp5.000</b>
• Maksimal deposit: <b>Rp50.000</b>
• Metode: <b>QRIS (DANA, OVO, GoPay)</b>
• Klik menu <b>💳 Deposit</b> lalu masukkan nominal

<b>🔍 CARI LAYANAN/NEGARA:</b>
• Klik tombol <b>🔍 Cari Layanan</b> atau <b>🔍 Cari Negara</b>
• Masukkan nama yang ingin dicari

<b>📞 BUTUH BANTUAN?</b>
• Hubungi owner: <b>Klik menu Saldo -> Kontak Owner</b>

</blockquote>`;
    
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🏠 Kembali ke Menu Utama', callback_data: 'back_to_main' }]
            ]
        }
    };
    
    try {
        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: keyboard.reply_markup
        });
    } catch (error) {
        if (error.message && (error.message.includes('message to edit not found') || error.message.includes('message is not modified'))) {
            try {
                const sent = await bot.sendMessage(chatId, text, {
                    parse_mode: 'HTML',
                    reply_markup: keyboard.reply_markup
                });
                if (messageIds) {
                    messageIds.set(chatId, sent.message_id);
                }
            } catch (sendError) {
                try {
                    await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
                } catch (finalError) {
                    logError(finalError, 'handleMenuBantuan - final fallback');
                }
            }
        } else if (!error.message?.includes('message is not modified')) {
            logError(error, 'handleMenuBantuan');
            try {
                await bot.sendMessage(chatId, text, {
                    parse_mode: 'HTML',
                    reply_markup: keyboard.reply_markup
                });
            } catch (sendError) {
                logError(sendError, 'handleMenuBantuan - send fallback');
            }
        }
    }
}

async function handleMenuDeposit(bot, chatId, messageId) {
    const { handleDeposit } = require('./depositHandler');
    await handleDeposit(bot, chatId, messageId);
}

module.exports = {
    sendMainMenu,
    handleMenuBeli,
    handleMenuSaldo,
    handleMenuRiwayat,
    handleMenuBantuan,
    handleMenuDeposit,
    handleBackToMain
};
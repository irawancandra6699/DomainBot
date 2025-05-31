const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

// Token bot Telegram
const token = "#";
const bot = new Telegraf(token);
// API Key Cloudflare
const apiKey = "#"; //https://dash.cloudflare.com/profile/api-tokens
const domaincf = "#"; 
const iniemail = "irawancandra2303@gmail.com";

// Daptar admin anu diidinan ngakses bot
const adminIds = [123456789, 987654321]; // Ganti jeung user_id admin anu diidinan

const userContext = {};

const getZoneId = async (domain) => {
    const baseDomain = domaincf;
    const response = await axios.get(`https://api.cloudflare.com/client/v4/zones?name=${baseDomain}&status=active`, {
        headers: {
            'X-Auth-Email': iniemail,
            'X-Auth-Key': apiKey,
            'Content-Type': 'application/json'
        }
    });

    if (response.data.result.length === 0) {
        throw new Error('Zone ID teu kapanggih keur domain anu dipasihkeun');
    }

    return response.data.result[0].id;
};

const getRecordId = async (zoneId, domain) => {
    const response = await axios.get(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${domain}`, {
        headers: {
            'X-Auth-Email': iniemail,
            'X-Auth-Key': apiKey,
            'Content-Type': 'application/json'
        }
    });

    return response.data.result[0]?.id;
};

const getRecordByIp = async (zoneId, ip) => {
    const response = await axios.get(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?content=${ip}`, {
        headers: {
            'X-Auth-Email': iniemail, 
            'X-Auth-Key': apiKey,
            'Content-Type': 'application/json'
        }
    });

    return response.data.result.length > 0;
};

const createDnsRecord = async (zoneId, domain, ip, proxied) => {
    const response = await axios.post(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
        type: 'A',
        name: domain,
        content: ip,
        proxied: proxied
    }, {
        headers: {
            'X-Auth-Email': iniemail,
            'X-Auth-Key': apiKey,
            'Content-Type': 'application/json'
        }
    });

    return response.data.result.id;
};

const updateDnsRecord = async (zoneId, recordId, domain, ip, proxied) => {
    const response = await axios.put(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`, {
        type: 'A',
        name: domain,
        content: ip,
        proxied: proxied
    }, {
        headers: {
            'X-Auth-Email': iniemail,
            'X-Auth-Key': apiKey,
            'Content-Type': 'application/json'
        }
    });

    if (response.data.success) {
        console.log(`DNS record diupdate: ${domain} -> ${ip}`);
        return response.data.result.id;
    } else {
        console.error('Gagal ngapdet DNS record:', response.data.errors);
        return null;
    }
};

const deleteDnsRecord = async (zoneId, recordId) => {
    const response = await axios.delete(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`, {
        headers: {
            'X-Auth-Email': iniemail,
            'X-Auth-Key': apiKey,
            'Content-Type': 'application/json'
        }
    });

    if (response.data.success) {
        console.log(`DNS record dihapus: ${recordId}`);
        return true;
    } else {
        console.error('Gagal ngahapus DNS record:', response.data.errors);
        return false;
    }
};

const createRecord = async (domain, ip, proxied) => {
    try {
        const zoneId = await getZoneId(domain);
        const recordExists = await getRecordByIp(zoneId, ip);
        if (recordExists) {
            throw new Error('DNS record jeung IP anu sarua geus aya');
        }

        let recordId = await getRecordId(zoneId, domain);

        if (!recordId) {
            recordId = await createDnsRecord(zoneId, domain, ip, proxied);
        }

        return await updateDnsRecord(zoneId, recordId, domain, ip, proxied);
    } catch (error) {
        if (error.response) {
            console.error('Kasalahan dina nyieun/ngapdet DNS record:', error.response.data);
        } else {
            console.error('Kasalahan dina nyieun/ngapdet DNS record:', error.message);
        }
        return null;
    }
};

const isAdmin = (userId) => {
    return adminIds.includes(userId);
};

bot.start((ctx) => {
    if (!isAdmin(ctx.from.id)) {
        return ctx.reply('⚠️ Anjeun teu gaduh idin pikeun ngagunakeun bot ieu.');
    }
    ctx.replyWithPhoto('https://github.com/AutoFTbot/AutoFTbot/raw/main/assets/programmer.gif', {
        caption: '𝘚𝘦𝘭𝘢𝘮𝘢𝘵 𝘋𝘢𝘵𝘢𝘯𝘨! 𝘎𝘶𝘯𝘢𝘬𝘢𝘯 𝘵𝘰𝘮𝘣𝘰𝘭 𝘥𝘪 𝘣𝘢𝘸𝘢𝘩 𝘶𝘯𝘵𝘶𝘬 𝘮𝘦𝘯𝘢𝘮𝘣𝘢𝘩 𝘐𝘗 𝘣𝘢𝘳𝘶 𝘢𝘵𝘢𝘶 𝘮𝘦𝘭𝘪𝘩𝘢𝘵 𝘳𝘦𝘬𝘰𝘳 𝘋𝘕𝘚.',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('𝘗𝘖𝘐𝘕𝘛𝘐𝘕𝘎 𝘋𝘕𝘚', 'add_ip')],
            [Markup.button.callback('𝘋𝘢𝘧𝘵𝘢𝘳 𝘙𝘦𝘬𝘰𝘳 𝘋𝘕𝘚/𝘩𝘢𝘱𝘶𝘴', 'list_dns_records')]
        ]).resize()
    });
});

bot.action('add_ip', (ctx) => {
    if (!isAdmin(ctx.from.id)) {
        return ctx.reply('⚠️ Anjeun teu gaduh idin pikeun ngagunakeun bot ieu.');
    }
    userContext[ctx.from.id] = 'nungguan_ip';
    ctx.reply('⚠️ *Mangga kirimkeun IP anu rék didaptarkeun.*', { parse_mode: 'Markdown' });
});

bot.on('text', (ctx) => {
    if (!isAdmin(ctx.from.id)) {
        return ctx.reply('⚠️ Anjeun teu gaduh idin pikeun ngagunakeun bot ieu.');
    }
    const userId = ctx.from.id;
    const status = userContext[userId];

    if (status === 'nungguan_ip') {
        const ip = ctx.message.text;
        userContext[userId] = { status: 'nungguan_proxied', ip: ip };
        ctx.reply('⚠️ *Naha anjeun hoyong ngaktipkeun proxy keur DNS record ieu?*', {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('Enya', 'proxied_true')],
                [Markup.button.callback('Henteu', 'proxied_false')]
            ]).resize()
        });
    }
});

bot.action('proxied_true', (ctx) => {
    if (!isAdmin(ctx.from.id)) {
        return ctx.reply('⚠️ Anjeun teu gaduh idin pikeun ngagunakeun bot ieu.');
    }
    const userId = ctx.from.id;
    const userState = userContext[userId];

    if (userState && userState.status === 'nungguan_proxied') {
        const ip = userState.ip;
        const domain = `${Math.random().toString(36).substring(2, 7)}.${domaincf}`;
        createRecord(domain, ip, true).then((recordId) => {
            if (recordId) {
                ctx.reply(`✅ *Pendaftaran Berhasil*\n*IP VPS:* \`${ip}\`\n*Domain:* \`${domain}\`\n*Proxied:* \`true\``, { parse_mode: 'Markdown' });
            } else {
                ctx.reply('⚠️ *Gagal nyieun DNS record.*', { parse_mode: 'Markdown' });
            }
            delete userContext[userId]; 
        }).catch((error) => {
            ctx.reply('⚠️ *Kasalahan nalika ngolah pamundut anjeun.*', { parse_mode: 'Markdown' });
            delete userContext[userId]; 
        });
    }
});

bot.action('proxied_false', (ctx) => {
    if (!isAdmin(ctx.from.id)) {
        return ctx.reply('⚠️ Anjeun teu gaduh idin pikeun ngagunakeun bot ieu.');
    }
    const userId = ctx.from.id;
    const userState = userContext[userId];

    if (userState && userState.status === 'nungguan_proxied') {
        const ip = userState.ip;
        const domain = `${Math.random().toString(36).substring(2, 7)}.${domaincf}`;
        createRecord(domain, ip, false).then((recordId) => {
            if (recordId) {
                ctx.reply(`✅ *Pendaftaran Berhasil*\n*IP VPS:* \`${ip}\`\n*Domain:* \`${domain}\`\n*Proxied:* \`false\``, { parse_mode: 'Markdown' });
            } else {
                ctx.reply('⚠️ *Gagal nyieun DNS record.*', { parse_mode: 'Markdown' });
            }
            delete userContext[userId]; 
        }).catch((error) => {
            ctx.reply('⚠️ *Kasalahan nalika ngolah pamundut anjeun.*', { parse_mode: 'Markdown' });
            delete userContext[userId]; 
        });
    }
});

bot.action('list_dns_records', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
        return ctx.reply('⚠️ Anjeun teu gaduh idin pikeun ngagunakeun bot ieu.');
    }
    try {
        const zoneId = await getZoneId(domaincf);
        const response = await axios.get(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
            headers: {
                'X-Auth-Email': iniemail,
                'X-Auth-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        const records = response.data.result;
        if (records.length === 0) {
            ctx.reply('Teu aya DNS record anu kapanggih.');
        } else {
            const recordList = records.map(record => `Domain: ${record.name}\nIP: ${record.content}`).join('\n');
            const buttons = [];
            for (let i = 0; i < records.length; i += 2) {
                buttons.push([
                    Markup.button.callback(`${records[i].name}`, `delete_${records[i].id}`),
                    records[i + 1] ? Markup.button.callback(`${records[i + 1].name}`, `delete_${records[i + 1].id}`) : null
                ].filter(Boolean));
            }
            ctx.reply(`Daptar DNS Records:\n\n${recordList}`, Markup.inlineKeyboard(buttons).resize());
        }
    } catch (error) {
        console.error('Kasalahan dina ngambil DNS records:', error.message);
        ctx.reply('⚠️ *Gagal ngambil DNS records.*', { parse_mode: 'Markdown' });
    }
});

bot.action(/delete_(.+)/, async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
        return ctx.reply('⚠️ Anjeun teu gaduh idin pikeun ngagunakeun bot ieu.');
    }
    const recordId = ctx.match[1];
    try {
        const zoneId = await getZoneId(domaincf);
        const success = await deleteDnsRecord(zoneId, recordId);
        if (success) {
            ctx.reply('✅ *DNS record hasil dihapus.*', { parse_mode: 'Markdown' });
        } else {
            ctx.reply('⚠️ *Gagal ngahapus DNS record.*', { parse_mode: 'Markdown' });
        }
    } catch (error) {
        console.error('Kasalahan dina ngahapus DNS record:', error.message);
        ctx.reply('⚠️ *Gagal ngahapus DNS record.*', { parse_mode: 'Markdown' });
    }
});
console.log('AutoFtbot keur jalan...');
bot.launch();

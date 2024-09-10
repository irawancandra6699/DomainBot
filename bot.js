const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

// Token bot Telegram
const token = "#";
const bot = new Telegraf(token);
// API Key Cloudflare
const apiKey = "#"; //https://dash.cloudflare.com/profile/api-tokens
const domaincf = "#"; 
const iniemail = "#";

const userContext = {};
const adminIds = [123456789, 987654321]; //ID telegram

const isValidIP = (ip) => {
    const regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return regex.test(ip);
};

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
        throw new Error('Zone ID not found for the given domain');
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
        console.log(`DNS record updated: ${domain} -> ${ip}`);
        return response.data.result.id;
    } else {
        console.error('Failed to update DNS record:', response.data.errors);
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
        console.log(`DNS record deleted: ${recordId}`);
        return true;
    } else {
        console.error('Failed to delete DNS record:', response.data.errors);
        return false;
    }
};

const createRecord = async (domain, ip, proxied) => {
    try {
        const zoneId = await getZoneId(domain);
        const recordExists = await getRecordByIp(zoneId, ip);
        if (recordExists) {
            throw new Error('DNS record with the same IP already exists');
        }

        let recordId = await getRecordId(zoneId, domain);

        if (!recordId) {
            recordId = await createDnsRecord(zoneId, domain, ip, proxied);
        }

        return await updateDnsRecord(zoneId, recordId, domain, ip, proxied);
    } catch (error) {
        if (error.response) {
            console.error('Error creating/updating DNS record:', error.response.data);
        } else {
            console.error('Error creating/updating DNS record:', error.message);
        }
        return null;
    }
};

bot.start((ctx) => {
    if (!adminIds.includes(ctx.from.id)) {
        return ctx.reply('⚠️ *You are not authorized to use this bot.*', { parse_mode: 'Markdown' });
    }
    ctx.replyWithPhoto('https://github.com/AutoFTbot/AutoFTbot/raw/main/assets/programmer.gif', {
        caption: '𝘞𝘦𝘭𝘤𝘰𝘮𝘦! 𝘜𝘴𝘦 𝘵𝘩𝘦 𝘣𝘶𝘵𝘵𝘰𝘯𝘴 𝘣𝘦𝘭𝘰𝘸 𝘵𝘰 𝘢𝘥𝘥 𝘢 𝘯𝘦𝘸 𝘐𝘗 𝘰𝘳 𝘷𝘪𝘦𝘸 𝘋𝘕𝘚 𝘳𝘦𝘤𝘰𝘳𝘥𝘴.',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('𝘗𝘖𝘐𝘕𝘛𝘐𝘕𝘎 𝘋𝘕𝘚', 'add_ip')],
            [Markup.button.callback('𝘓𝘪𝘴𝘵 𝘋𝘕𝘚 𝘙𝘦𝘤𝘰𝘳𝘥𝘴/𝘥𝘦𝘭𝘦𝘵𝘦', 'list_dns_records')]
        ]).resize()
    });
});

bot.action('add_ip', (ctx) => {
    if (!adminIds.includes(ctx.from.id)) {
        return ctx.reply('⚠️ *You are not authorized to use this bot.*', { parse_mode: 'Markdown' });
    }
    userContext[ctx.from.id] = 'awaiting_ip';
    ctx.reply('⚠️ *Please send the IP you want to register.*', { parse_mode: 'Markdown' });
});

bot.on('text', (ctx) => {
    const userId = ctx.from.id;
    const status = userContext[userId];

    if (status === 'awaiting_ip') {
        const ip = ctx.message.text;
        if (!isValidIP(ip)) {
            return ctx.reply('⚠️ *Invalid IP address. Please send a valid IP address.*', { parse_mode: 'Markdown' });
        }
        userContext[userId] = { status: 'awaiting_proxied', ip: ip };
        ctx.reply('⚠️ *Do you want to enable proxy for this DNS record?*', {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('Yes', 'proxied_true')],
                [Markup.button.callback('No', 'proxied_false')]
            ]).resize()
        });
    }
});

bot.action('proxied_true', (ctx) => {
    const userId = ctx.from.id;
    const userState = userContext[userId];

    if (userState && userState.status === 'awaiting_proxied') {
        const ip = userState.ip;
        const domain = `${Math.random().toString(36).substring(2, 7)}.${domaincf}`;
        createRecord(domain, ip, true).then((recordId) => {
            if (recordId) {
                ctx.reply(`✅ *Registration Successful*\n*VPS IP:* \`${ip}\`\n*Domain:* \`${domain}\`\n*Proxied:* \`true\``, { parse_mode: 'Markdown' });
            } else {
                ctx.reply('⚠️ *Failed to create DNS record.*', { parse_mode: 'Markdown' });
            }
            delete userContext[userId]; 
        }).catch((error) => {
            ctx.reply('⚠️ *Error occurred while processing your request.*', { parse_mode: 'Markdown' });
            delete userContext[userId]; 
        });
    }
});

bot.action('proxied_false', (ctx) => {
    const userId = ctx.from.id;
    const userState = userContext[userId];

    if (userState && userState.status === 'awaiting_proxied') {
        const ip = userState.ip;
        const domain = `${Math.random().toString(36).substring(2, 7)}.${domaincf}`;
        createRecord(domain, ip, false).then((recordId) => {
            if (recordId) {
                ctx.reply(`✅ *Registration Successful*\n*VPS IP:* \`${ip}\`\n*Domain:* \`${domain}\`\n*Proxied:* \`false\``, { parse_mode: 'Markdown' });
            } else {
                ctx.reply('⚠️ *Failed to create DNS record.*', { parse_mode: 'Markdown' });
            }
            delete userContext[userId]; 
        }).catch((error) => {
            ctx.reply('⚠️ *Error occurred while processing your request.*', { parse_mode: 'Markdown' });
            delete userContext[userId]; 
        });
    }
});

bot.action('list_dns_records', async (ctx) => {
    if (!adminIds.includes(ctx.from.id)) {
        return ctx.reply('⚠️ *You are not authorized to use this bot.*', { parse_mode: 'Markdown' });
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
            ctx.reply('No DNS records found.');
        } else {
            const recordList = records.map(record => `Domain: ${record.name}\nIP: ${record.content}`).join('\n');
            const buttons = [];
            for (let i = 0; i < records.length; i += 2) {
                buttons.push([
                    Markup.button.callback(`${records[i].name}`, `delete_${records[i].id}`),
                    records[i + 1] ? Markup.button.callback(`${records[i + 1].name}`, `delete_${records[i + 1].id}`) : null
                ].filter(Boolean));
            }
            ctx.reply(`DNS Records List:\n\n${recordList}`, Markup.inlineKeyboard(buttons).resize());
        }
    } catch (error) {
        console.error('Error fetching DNS records:', error.message);
        ctx.reply('⚠️ *Failed to fetch DNS records.*', { parse_mode: 'Markdown' });
    }
});

bot.action(/delete_(.+)/, async (ctx) => {
    if (!adminIds.includes(ctx.from.id)) {
        return ctx.reply('⚠️ *You are not authorized to use this bot.*', { parse_mode: 'Markdown' });
    }
    const recordId = ctx.match[1];
    try {
        const zoneId = await getZoneId(domaincf);
        const success = await deleteDnsRecord(zoneId, recordId);
        if (success) {
            ctx.reply('✅ *DNS record successfully deleted.*', { parse_mode: 'Markdown' });
        } else {
            ctx.reply('⚠️ *Failed to delete DNS record.*', { parse_mode: 'Markdown' });
        }
    } catch (error) {
        console.error('Error deleting DNS record:', error.message);
        ctx.reply('⚠️ *Failed to delete DNS record.*', { parse_mode: 'Markdown' });
    }
});
console.log('AutoFtbot is running...');
bot.launch();

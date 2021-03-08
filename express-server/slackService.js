var fetch = require('node-fetch');

// Handles all slack communication
async function clearStatus() {
    await updateStatus('', ['']);
}

function selectRandomElement(items) {
    if (!items || items.length === 0) {
        return '';
    }

    return items[Math.floor(Math.random() * items.length)];
}

function sanitizeEmoji(emoji) {
    let sanitizedEmoji = emoji.trim();

    if (emoji.length === 0) {
        return emoji;
    }
    if (!emoji.startsWith(':')) {
        sanitizedEmoji = ':' + emoji;
    }
    if (!emoji.endsWith(':')) {
        sanitizedEmoji = emoji + ':';
    }

    return sanitizedEmoji;
}

async function updateStatus(text, emojis, expiration) {
    const sanitizedText = text == null ? '' : text.trim();
    const emoji = selectRandomElement(emojis);
    const sanitizedEmoji = sanitizeEmoji(emoji);

    const profile = JSON.stringify({
        status_text: sanitizedText,
        status_emoji: sanitizedEmoji,
        status_expiration: expiration
    });

    const updateStatusUrl = new URL('http://slack.com/api/users.profile.set');
    const token = process.env.slackUserToken;
    updateStatusUrl.searchParams.append('token', token);
    updateStatusUrl.searchParams.append('profile', profile);

    await fetch(updateStatusUrl.href);
}

async function sendReminder(message) {
    const token = process.env.slackBotToken;
    const userId = process.env.reminderUserId;
    const openConversation = new URL('http://slack.com/api/conversations.open');

    openConversation.searchParams.append('token', token);
    openConversation.searchParams.append('users', userId);

    const userInformation = await fetch(openConversation.href);
    const jsonResult = await userInformation.json();

    const channel = jsonResult.channel.id;

    const messageUrl = new URL('http://slack.com/api/chat.postMessage');
    messageUrl.searchParams.append('token', token);
    messageUrl.searchParams.append('channel', channel);
    messageUrl.searchParams.append('text', message);

    await fetch(messageUrl.href);
}

module.exports = {
    clearStatus,
    updateStatus,
    sendReminder
};

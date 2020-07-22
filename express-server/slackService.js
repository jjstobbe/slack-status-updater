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

    const updateStatusUrl = new URL('https://slack.com/api/users.profile.set');
    const token = process.env.slackUserToken;
    updateStatusUrl.searchParams.append('token', token);
    updateStatusUrl.searchParams.append('profile', profile);

    const updateStatusUrlResp = await fetch(updateStatusUrl.href);
    const updateStatusUrlJsonResult = await updateStatusUrlResp.json();
    if ( !updateStatusUrlJsonResult.ok ) {
        console.log("Failed request: ", updateStatusUrl.href);
        console.log("Response was: ", updateStatusUrlJsonResult);
    }
}

async function sendReminder(message) {
    const token = process.env.slackBotToken;
    const userId = process.env.reminderUserId;
    const openIm = new URL('https://slack.com/api/conversations.open');

    openIm.searchParams.append('token', token);
    openIm.searchParams.append('users', userId);

    const userInformation = await fetch(openIm.href);
    const jsonResult = await userInformation.json();
    if ( !jsonResult.ok ) {
        console.log("Failed request: ", openIm.href);
        console.log("Response was: ", jsonResult);
    }
    const channel = jsonResult.channel.id;

    const messageUrl = new URL('https://slack.com/api/chat.postMessage');
    messageUrl.searchParams.append('token', token);
    messageUrl.searchParams.append('channel', channel);
    messageUrl.searchParams.append('text', message);

    const messageUrlResponse = await fetch(messageUrl.href);
    const messageUrljsonResult = await messageUrlResponse.json();
    if ( !messageUrljsonResult.ok ) {
        console.log("Failed request: ", messageUrl.href);
        console.log("Response was: ", messageUrljsonResult);
    }
}

module.exports = {
    clearStatus,
    updateStatus,
    sendReminder
};

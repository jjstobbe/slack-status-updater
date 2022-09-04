import fetch from 'node-fetch';

export const clearStatus = async () => {
    await updateStatus('', ['']);
}

export const updateStatus = async (text: string | null, emojis?: Array<string>, expiration?: number | null) => {
    const sanitizedText = text == null ? '' : text.trim();
    const emoji = selectRandomArrayElement(emojis);
    const sanitizedEmoji = sanitizeEmoji(emoji);

    const profile = JSON.stringify({
        status_text: sanitizedText,
        status_emoji: sanitizedEmoji,
        status_expiration: expiration
    });

    const updateStatusUrl = new URL('http://slack.com/api/users.profile.set');
    const token = process.env.SLACK_USER_TOKEN;

    if (!token) {
        throw new Error('No SLACK_USER_TOKEN environment variable');
    }

    updateStatusUrl.searchParams.append('token', token);
    updateStatusUrl.searchParams.append('profile', profile);

    await fetch(updateStatusUrl.href);
}

export const sendReminder = async (message: string) => {
    const botToken = process.env.SLACK_BOT_TOKEN;
    if (!botToken) {
        throw new Error('No SLACK_BOT_TOKEN environment variable');
    }

    const userId = process.env.REMINDER_USER_ID;
    if (!userId) {
        throw new Error('No REMINDER_USER_ID environment variable');
    }

    const openConversation = new URL('http://slack.com/api/conversations.open');

    openConversation.searchParams.append('token', botToken);
    openConversation.searchParams.append('users', userId);

    const userInformation = await fetch(openConversation.href);
    const jsonResult = await userInformation.json();

    const channel = jsonResult.channel.id;

    const messageUrl = new URL('http://slack.com/api/chat.postMessage');
    messageUrl.searchParams.append('token', botToken);
    messageUrl.searchParams.append('channel', channel);
    messageUrl.searchParams.append('text', message);

    console.log('sending meeting reminder...');
    await fetch(messageUrl.href);
}

const selectRandomArrayElement = (items?: Array<any>) => {
    if (!items || items.length === 0) {
        return '';
    }

    return items[Math.floor(Math.random() * items.length)];
}

const sanitizeEmoji = (emoji: string) => {
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

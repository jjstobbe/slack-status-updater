var fetch = require('node-fetch');

//// First steps in replacing the homebrew implementation of the Slack API interactions with the official SDK
const botToken = process.env.slackBotToken;
const userToken = process.env.slackUserToken;
// RTM API
const { RTMClient } = require('@slack/rtm-api');
const rtm = new RTMClient(botToken);
// Web API
const { WebClient } = require('@slack/web-api');
const web = new WebClient(botToken);

rtm.on('message', async (event) => {
    //console.log(event);
    if ( event.user ) {
        if (process.env.password_requested == "true") {
            process.env.password_requested = "false";
            console.log("Got password from Slack user");
            process.env.exchange_password = event.text;
            var result = await web.chat.postMessage({
                text: "Thanks! I'll give that a shot. You can now delete the password message above.",
                channel: channelId
            });

        }
    }
});
(async () => {
  await rtm.start();
})();

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

async function updateStatus(text, emojis, expiration, persist) {
    const sanitizedText = text == null ? '' : text.trim();
    const emoji = selectRandomElement(emojis);
    const sanitizedEmoji = sanitizeEmoji(emoji);

    if ( persist === false ) {
        console.log("Status will not be persisted");
        const ConcatenatedStatus = sanitizedText + sanitizedEmoji;
        if ( CurrentSlackStatus === ConcatenatedStatus ) {
            console.log("Status is unchanged from last run. Skipping.");
            return;
        } else {
            console.log("Status has changed from last run. Updating...");
        }
        CurrentSlackStatus = ConcatenatedStatus;
    }
    const profile = JSON.stringify({
        status_text: sanitizedText,
        status_emoji: sanitizedEmoji,
        status_expiration: expiration
    });

    const updateStatusUrl = new URL('https://slack.com/api/users.profile.set');
    const token = process.env.slackUserToken;
    updateStatusUrl.searchParams.append('token', token);
    updateStatusUrl.searchParams.append('profile', profile);
    console.log("Params set");
    const updateStatusUrlResp = await fetch(updateStatusUrl.href);
    const updateStatusUrlJsonResult = await updateStatusUrlResp.json();
    if ( !updateStatusUrlJsonResult.ok ) {
        console.log("Failed request: ", updateStatusUrl.href);
        console.log("Response was: ", updateStatusUrlJsonResult);
    } else {
        console.log("Updated Slack status: ", text, " ", emoji);
    }
}

async function sendReminder(message) {
    const token = process.env.slackBotToken;
    const userId = process.env.slackUserId;
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

async function getPassword() {
    if (process.env.password_requested != "true") {
        //console.log('process.env.slackUserId:',process.env.slackUserId);
        var result = await web.conversations.open({
            users: process.env.slackUserId
        });
        //console.log('result.channel.id:',result.channel.id);
        channelId = result.channel.id;
        sendText = `It seems that I'm unable to log in to Exchange/O365 with your username of ${process.env.exchange_username}. I've temporarily stopped trying to log in prevent an account lock-out.\nPlease respond with your password to login.`;
        var result = await web.chat.postMessage({
            text: sendText,
            channel: channelId
        });
	    process.env.password_requested = "true";
	}
}

module.exports = {
    clearStatus,
    updateStatus,
    sendReminder,
    getPassword
};

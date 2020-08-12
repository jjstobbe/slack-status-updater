var CronJob = require('cron').CronJob;
var fetch = require('node-fetch');

// Verify Configs are setup correctly
verifyConfigs();

var FileService = require('./fileService');
var JobService = require('./jobService');
var SlackService = require('./slackService');

(function () {
    if (process.env.isProduction == 'false') {
        return JobService.runJob();
    }

    const heroku_authed_url = "".concat(process.env.heroku_url, "?authkey=", process.env.authkey);

    const job = new CronJob({
        //cronTime: '10 * * * * *', // Every minute at 10 seconds after (to give some time for clock drift)
        cronTime: '*/10 * * * * *', // Every minute at 10 seconds after (to give some time for clock drift)
        onTick: async () => {
            // Make a request to the app so it doesn't idle
            await fetch(heroku_authed_url);

            try {
                await JobService.runJob();
            } catch (e) {
                console.log(e);
                SlackService.clearStatus();
            }
        },
        start: true,
        timeZone: 'America/Chicago'
    });

    job.start();
})();

function verifyConfigs() {
    let settingsFile = {};
    try {
        settingsFile = require(process.env.settingsFile);
    } catch (e) {
        //console.error(e);
    }
    const necessaryConfigs = ['isProduction', 'exchange_username', 'exchange_password', 'exchange_host_url', 'exchange_authtype', 'slackBotToken', 'slackUserToken', 'slackUserId', 'mongoUri', 'heroku_url', 'authkey'];

    necessaryConfigs.forEach((configKey) => {
        // Set process env vars based on settings file
        if (settingsFile.hasOwnProperty(configKey)) {
            process.env[configKey] = settingsFile[configKey];
        }

        if (!process.env.hasOwnProperty(configKey)) {
            console.error(`No ${configKey} config found`);
            process.exit(1);
        }
    });
}

console.log('Starting Express Server...');

// Dummy express API to serve something on a port for heroku
const express = require('express');
const app = express();
const url = require('url');

app.use(express.json());
app.use(express.static(__dirname + './../build/'));

app.get('/', (req, res) => {
    const reqAuthKey = url.parse(req.url,true).query.authkey;
    if ( reqAuthKey == process.env.authkey ) {
        res.send('Hello From Slack Status Updater');
    } else {
        res.status(401);
        res.send('Unauthorized: Invalid authkey');
        console.log('Unauthorized request. Must set a query parameter of authkey which matches the authkey environment variable')
    }
});

app.listen(process.env.PORT || 3001);

app.get('/get-settings', async (req, res) => {
    const reqAuthKey = url.parse(req.url,true).query.authkey;
    if ( reqAuthKey == process.env.authkey ) {
        const settings = await FileService.readSettingsFile();
        return res.json(settings || {});
    } else {
        res.status(401);
        res.send('Unauthorized: Invalid authkey');
        console.log('Unauthorized request. Must set a query parameter of authkey which matches the authkey environment variable')
    }
});

app.post('/update-settings', async (req, res) => {
    const reqAuthKey = url.parse(req.url,true).query.authkey;
    if ( reqAuthKey == process.env.authkey ) {
        await FileService.setSettingsFile(req.body);
        return res.sendStatus(200);
    } else {
        res.status(401);
        res.send('Unauthorized: Invalid authkey');
        console.log('Unauthorized request. Must set a query parameter of authkey which matches the authkey environment variable')
    }
});

console.log(`Server started on port ${process.env.PORT || 3001}`);

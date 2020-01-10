var CronJob = require('cron').CronJob
var fetch = require('node-fetch')

var FileService = require('./fileService')
var JobService = require('./jobService')
var SlackService = require('./slackService')

;(function() {
  if (!process.env.isProduction) {
    return JobService.runJob();
  }

  const job = new CronJob({
    cronTime: '*/2 7-17 * * 1-5',
    onTick: async () => {
      // Make a request to the app so it doesn't idle
      await fetch('https://slack-status-updater.herokuapp.com/')

      try {
        await JobService.runJob()
      } catch (e) {
        console.log(e)
        SlackService.clearStatus()
      }
    },
    start: true,
    timeZone: 'America/North_Dakota/New_Salem'
  });
  
  job.start()
})()

console.log("Starting Express Server...");

// Dummy express API to serve something on a port for heroku
const express = require('express')
const app = express()

app.use(express.json());
app.use(express.static(__dirname + './../build/'))

app.get('/', (req, res) => res.send('Hello From Slack Status Updater'))
app.listen(process.env.PORT || 3001)

app.get('/get-settings', async (req, res) => {
  const settings = await FileService.readSettingsFile();

  return res.json(settings || {});
});

app.post('/update-settings', async (req, res) => {
  await FileService.setSettingsFile(req.body);

  return res.sendStatus(200);
});

console.log(`Sever started on port ${process.env.PORT || 3001}`);

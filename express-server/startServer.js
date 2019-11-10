var CronJob = require('cron').CronJob
var request = require('request')

var FileService = require('./fileService')
var JobService = require('./jobService')
var SlackService = require('./slackService')

;(function () {
  const job = new CronJob({
    cronTime: '*/2 7-17 * * 1-5',
    onTick: async () => {
      // Make a request to the app so it doesn't idle
      request.get('https://slack-status-updater.herokuapp.com/')

      try {
        await JobService.runJob()
      } catch (e) {
        console.log(e)
        SlackService.clearStatus()
      }
    },
    start: true,
    timeZone: 'America/North_Dakota/New_Salem'
  })

  job.start()
})()

console.log("Starting Express Server...");

// Dummy express API to serve something on a port for heroku
const express = require('express')
const app = express()

app.use(express.static(__dirname + './../build/'))

app.get('/', (req, res) => res.send('Hello From Slack Status Updater'))
app.listen(process.env.PORT || 3001)

app.get('/get-settings', (req, res) => {
  const settings = FileService.readSettingsFile();
  
  return res.json(settings);
});

app.post('/update-settings', (req, res) => {
  console.log(req);

  // FileService.setSettingsFile();'

  return ":shrug:";
});

console.log(`Sever started on port ${process.env.PORT || 5000}`);

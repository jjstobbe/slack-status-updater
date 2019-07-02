var CronJob = require('cron').CronJob
var request = require('request')

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
        SlackService.resetStatus()
      }
    },
    start: true,
    timeZone: 'America/North_Dakota/New_Salem'
  })

  job.start()
})()

// Dummy express API to serve something on a port for heroku
const express = require('express')
const app = express()

app.get('/', (req, res) => res.send('Hello From Slack Status Updater'))
app.listen(process.env.PORT || 5000)

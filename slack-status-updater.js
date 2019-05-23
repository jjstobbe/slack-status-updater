var request = require('request');
const EWS = require('node-ews');
var CronJob = require('cron').CronJob;

// exchange server connection info
const ewsServer = new EWS({
  username: process.env.office365username,
  password: process.env.office365password,
  host: 'https://outlook.office365.com',
  auth: 'basic'
});

async function fetchCalenderInfo() {
  // define ews api function
  const ewsFunction = 'GetFolder';

  // define ews api function args
  const ewsArgs = {
      'FolderShape': {
        'BaseShape': 'Default'
      },
      'FolderIds': {
        'DistinguishedFolderId': {
          'attributes': {
            'Id': 'calendar'
          },
        }
      }
  }

  return ewsServer.run(ewsFunction, ewsArgs)
    .then(result => {
      const folderInformation = result.ResponseMessages.GetFolderResponseMessage.Folders.CalendarFolder.FolderId.attributes
      return folderInformation
    })
    .catch(e => {
      console.log("Failure fetching calendar information", e);
      return null;
    })
}

async function fetchCalendarEvents(Id, ChangeKey) {
  const ewsFunction = 'FindItem';

  const currentDate = new Date();
  let tomorrowDate = new Date();
  tomorrowDate.setDate(currentDate.getDate() + 1);

  const ewsArgs = {
    'attributes': {
      'Traversal': 'Shallow'
    },
    'ItemShape': {
      'BaseShape': 'IdOnly',
      'AdditionalProperties': {
        'FieldURI': [
          {'attributes': {'FieldURI': 'item:Subject'}},
          {'attributes': {'FieldURI': 'calendar:Start'}},
          {'attributes': {'FieldURI': 'calendar:End'}}
        ]
      }
    },
    'CalendarView': {
      'attributes': {
          'StartDate': currentDate.toISOString(),
          'EndDate': tomorrowDate.toISOString()
      }
    },
    'ParentFolderIds' : {
      'FolderId': {
        'attributes': {
          'Id': Id,
          'ChangeKey': ChangeKey,
        }
      }
    }
  }

  return ewsServer.run(ewsFunction, ewsArgs)
    .then(result => {
      const calendarItems = result.ResponseMessages.FindItemResponseMessage.RootFolder.Items.CalendarItem
        .map(item => {
          return {
            subject: item.Subject,
            startDate: new Date(item.Start),
            endDate: new Date(item.End),
          }
        })

      return calendarItems
    })
    .catch(e => {
      console.log("Failure fetching calendar events", e);
      return null;
    })
}

function resetStatus() {
  updateStatus({
    "status_text": "",
    "status_emoji": "",
  })
}

function updateStatus(body) {
  const encodedBody = encodeURIComponent(JSON.stringify(body))

  const token = process.env.slackUserToken
  const url = `http://slack.com/api/users.profile.set?token=${token}&profile=${encodedBody}`;
  
  request.get(url);
}

const lunchEmojis = [':lunchables:', ':burger:', ':hamburger:', ':chompy:'];

async function main() {
  const { Id, ChangeKey } = await fetchCalenderInfo()
  
  const events = await fetchCalendarEvents(Id, ChangeKey);
  
  const currentTime = new Date();
  const currentEvents = events.filter(event => event.startDate <= currentTime && currentTime <= event.endDate);

  if (currentEvents.length == 0) {
    resetStatus();
    return;
  }

  const sortedEvents = currentEvents.sort((a, b) => {
    return b.startDate.getTime() - a.startDate.getTime()
  });
  
  const allDayEvents = sortedEvents.filter((event) => (event.endDate.getTime() - event.startDate.getTime()) >= 77760000);

  const primaryEvent = allDayEvents.length > 0 ? allDayEvents[0] : sortedEvents[0];

  const subject = primaryEvent.subject.toLowerCase();
  const endTime = primaryEvent.endDate.getTime() / 1000;

  if (subject.indexOf('ooo') > -1) {
    let status = "";
    if (subject.indexOf('ooo - ') > -1 && subject.length > 6) {
      const dashIndex = subject.indexOf('-');
      status = primaryEvent.subject.substring(dashIndex + 2);
    }

    updateStatus({
      "status_text": status,
      "status_emoji": ":ooo:",
      "status_expiration": endTime
    })
  } else if (subject.indexOf('vacation') > -1) {
    updateStatus({
      "status_text": "",
      "status_emoji": ":palm_tree:",
      "status_expiration": endTime
    })
  } else if (subject.indexOf('standup') > -1 || subject.indexOf('stand-up') > -1) {
    updateStatus({
      "status_text": "Standup",
      "status_emoji": ":standup:",
      "status_expiration": endTime
    })
  } else if (subject.indexOf('ssb') > -1) {
    updateStatus({
      "status_text": "Smash Match",
      "status_emoji": ":smash:",
      "status_expiration": endTime
    })
  } else if (subject.indexOf('lunch') > -1) {
    updateStatus({
      "status_text": "Lunch",
      "status_emoji": lunchEmojis[Math.floor(Math.random() * lunchEmojis.length)],
      "status_expiration": endTime
    })
  } else if (subject.indexOf('1:1') > -1) {
    updateStatus({
      "status_text": "",
      "status_emoji": ":1on1:",
      "status_expiration": endTime
    })
  } else if (subject.indexOf('all-hands') > -1) {
    updateStatus({
      "status_text": "All-Hands",
      "status_emoji": ":hudl:",
      "status_expiration": endTime
    })
  } else if (subject.indexOf('new hire graduation') > -1) {
    updateStatus({
      "status_text": "New Hire Graduation",
      "status_emoji": ":mortar_board:",
      "status_expiration": endTime
    })
  } else {
    updateStatus({
      "status_text": "In a meeting",
      "status_emoji": ":calendar:",
      "status_expiration": endTime
    })
  }
}

(function() {
  const job = new CronJob({
    cronTime: '*/2 7-17 * * 1-5',
    onTick: async () => {
      // Make a request to the app so it doesn't idle
      request.get('https://slack-status-updater.herokuapp.com/');

      console.log("Running Job..");

      try {
        await main();
      } catch (e) {
        console.log(e);
        resetStatus();
      }
    },
    start: true,
    timeZone: "America/North_Dakota/New_Salem"
  });
  
  job.start();
})();

// Dummy express API to serve something on a port for heroku
const express = require('express')
const app = express()

app.get('/', (req, res) => res.send('Hello From Slack Status Updater'))
app.listen(process.env.PORT || 5000)

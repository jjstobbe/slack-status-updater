var request = require('request');
const EWS = require('node-ews');
const credentials = require('./credentials.json');

// exchange server connection info
const ewsServer = new EWS({
  username: credentials.office365username,
  password: credentials.office365password,
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

function updateStatus(body) {
    let encodedBody = encodeURIComponent(JSON.stringify(body))
    let url = `http://slack.com/api/users.profile.set?token=${credentials.slackUserToken}&profile=${encodedBody}`;
    
    request.get(url);
}

const lunchEmojis = [':lunchables:', ':burger:', ':hamburger:', ':chompy:'];

// Main Script
(async function() {
  const { Id, ChangeKey } = await fetchCalenderInfo()
  
  const events = await fetchCalendarEvents(Id, ChangeKey);

  const currentTime = new Date();

  const currentEvents = events.filter(event => event.startDate <= currentTime && currentTime <= event.endDate);

  if (currentEvents.length == 0) {
    updateStatus({
      "status_text": "",
      "status_emoji": "",
    })

    return;
  }

  const sortedEvents = currentEvents.sort((a, b) => {
    return b.startDate.getTime() - a.startDate.getTime()
  });

  const primaryEvent = sortedEvents[0];

  if (primaryEvent.subject.toLowerCase().indexOf('standup') > -1) {
    updateStatus({
      "status_text": "Standup",
      "status_emoji": ":standup:",
    })
  } else if (primaryEvent.subject.toLowerCase().indexOf('lunch') > -1) {
    updateStatus({
      "status_text": "Lunch",
      "status_emoji": lunchEmojis[Math.floor(Math.random() * lunchEmojis.length)],
    })
  } else {
    updateStatus({
      "status_text": "In a meeting",
      "status_emoji": ":calendar:",
    })
  }
})();

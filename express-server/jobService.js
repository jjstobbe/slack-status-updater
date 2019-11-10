var CalendarService = require('./calendarService')
var SlackService = require('./slackService')
var FileService = require('./fileService')

if (!process.env.office365username || !process.env.office365password || !process.env.slackUserToken) {
  if (!process.env.office365username) {
    console.error('No office365username')
  }
  if (!process.env.office365password) {
    console.error('No office365password')
  }
  if (!process.env.slackUserToken) {
    console.error('No slackUserToken environment variable found - https://api.slack.com/custom-integrations/legacy-tokens')
  }

  process.exit(1)
}

function checkSubjectForTitle (subject) {
  const splitSubject = subject.split(' - ')

  if (splitSubject.length !== 2) {
    return subject
  }

  return splitSubject[1]
}

async function runJob () {
  console.log('Running Job..')

  const events = await CalendarService.fetchCalendarEvents()

  const currentTime = new Date()
  const currentEvents = events.filter(event => event.startDate <= currentTime && currentTime <= event.endDate)

  if (currentEvents.length === 0) {
    SlackService.clearStatus()
    return
  }

  const sortedEvents = currentEvents.sort((a, b) => {
    return b.startDate.getTime() - a.startDate.getTime()
  })

  const allDayEvents = sortedEvents.filter((event) => (event.endDate.getTime() - event.startDate.getTime()) >= 77760000)

  const primaryEvent = allDayEvents.length > 0 ? allDayEvents[0] : sortedEvents[0]

  const subject = primaryEvent.subject.toLowerCase()
  const endTime = primaryEvent.endDate.getTime() / 1000

  const statusSettings = FileService.readSettingsFile();

  const statusEvents = statusSettings.status_events
  const fallbackStatusEvent = statusSettings.fallback_status_event

  for (const statusEvent of statusEvents) {
    const doesMatch = statusEvent.matching_words.some((substring) => {
      const sanitizedSubstring = substring.toLowerCase().trim()
      return subject.indexOf(sanitizedSubstring) !== -1
    })

    if (doesMatch) {
      const statusText = statusEvent.check_for_status_in_title ? checkSubjectForTitle(primaryEvent.subject) : statusEvent.status_text
      SlackService.updateStatus(statusText, statusEvent.status_emojis, endTime)
      return
    }
  }

  // Doesn't match any of our options, we use fallback
  SlackService.updateStatus(fallbackStatusEvent.status_text, fallbackStatusEvent.status_emojis, endTime)
}

module.exports = {
  runJob
}

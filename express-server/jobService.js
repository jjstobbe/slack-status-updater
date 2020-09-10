var CalendarService = require('./calendarService');
var SlackService = require('./slackService');
var FileService = require('./fileService');

function checkSubjectForTitle(subject) {
    var splitSubject = [];
    if ( subject.includes(' - ') ) {
        splitSubject = subject.split(' - ');
    } else if ( subject.includes(': ') ){
        splitSubject = subject.split(': ');
    }

    if (splitSubject.length !== 2) {
        return subject;
    }

    return splitSubject[1];
}

async function runJob() {
    console.log('Running Job...');
    if ( process.env.exchange_password === '' ) {
        console.error('No exchange password set yet. Stopping execution.');
        await SlackService.getPassword();
        return;
    }

    var events = [];
    try {
        events = await CalendarService.fetchCalendarEvents();
    } catch (e) {
        console.log('Some sort of connection error occurred to EWS. Halting further login attempts.');
        process.env.exchange_password = '';
        await SlackService.getPassword();
    }

    const statusSettings = await FileService.readSettingsFile();

    if (!statusSettings) {
        console.error('No settings file found, stopping execution.');
        return;
    }

    const currentTime = new Date();
    var currentEvents = events
        .filter((event) => event.startDate <= currentTime && currentTime <= event.endDate)
        .filter((event) => {
            // Keep all elements if ignored_events doesn't exist
            if (!statusSettings.ignored_events || !statusSettings.ignored_events.matching_words) {
                console.log('ignored events not found, skipping this part');
                return true;
            }

            const sanitizedSubject = event.subject.toLowerCase().trim();
            const matchingWords = statusSettings.ignored_events.matching_words;

            const doesMatch = matchingWords.some((substring) => {
                const sanitizedSubstring = substring.toLowerCase().trim();
                return sanitizedSubject.indexOf(sanitizedSubstring) !== -1;
            });

            return !doesMatch;
        });

    if (statusSettings.override_priority) {
        const overrideEvents = [];
        // Starting with the first override element, look for matching events
        statusSettings.override_priority.forEach((override) => {
            currentEvents.forEach((event) => {
                const regex = RegExp(override,'i');
                if (event.subject.match(regex)) {
                    overrideEvents.push(event);
                };
            });
        });
        if (overrideEvents[0]) {
            // Assign just the first event as our currentEvents
            currentEvents = overrideEvents.slice(0,1);
        }
    }

    //await sendReminderIfNecessary(events);
    if (statusSettings.reminder_at_tminus_minutes) {
        var reminders = statusSettings.reminder_at_tminus_minutes;
    } else {
        var reminders = [];
    }
    await sendReminderIfNecessary(events,reminders);

    if (currentEvents.length === 0) {
        await SlackService.clearStatus();
        return;
    }

    const sortedEvents = currentEvents.sort((a, b) => {
        return b.startDate.getTime() - a.startDate.getTime();
    });

    const allDayEvents = sortedEvents.filter((event) => event.endDate.getTime() - event.startDate.getTime() >= 77760000);
    const hasAllDayEvent = allDayEvents.length > 0;

    const primaryEvent = hasAllDayEvent ? allDayEvents[0] : sortedEvents[0];

    const subject = primaryEvent.subject.toLowerCase();
    const endTime = primaryEvent.endDate.getTime() / 1000;

    const statusEvents = statusSettings.status_events;
    const fallbackStatusEvent = statusSettings.fallback_status_event;

    var persistCalendarStatus = true;
    if ( !statusSettings.persist_calendar_status || statusSettings.persist_calendar_status === false ) {
        persistCalendarStatus = false;
    } else {
        persistCalendarStatus = true;
    }

    for (const statusEvent of statusEvents) {
        const doesMatch = statusEvent.matching_words.some((substring) => {
            const sanitizedSubstring = substring.toLowerCase().trim();
            return subject.indexOf(sanitizedSubstring) !== -1;
        });

        if (doesMatch) {
            const statusText = statusEvent.check_for_status_in_title ? checkSubjectForTitle(primaryEvent.subject) : statusEvent.status_text;
            //await SlackService.updateStatus(statusText, statusEvent.status_emojis, hasAllDayEvent ? null : endTime);
            try {
                await SlackService.updateStatus(statusText, statusEvent.status_emojis, hasAllDayEvent ? null : endTime, persistCalendarStatus);
            } catch (e) {
                console.log(e);
            }

            //console.log("Updated Slack status: ", statusText, " ", statusEvent.status_emojis);
            console.log('...Job Complete');
            return;
        }
    }

    // Doesn't match any of our options, we use fallback
    await SlackService.updateStatus(fallbackStatusEvent.status_text, fallbackStatusEvent.status_emojis, hasAllDayEvent ? null : endTime, persistCalendarStatus);
    //console.log("Updated Slack status: ", fallbackStatusEvent.status_text, " ", fallbackStatusEvent.status_emojis);
    console.log('...Job Complete');
}

//const twoAndAHalfMinutes = 1000 * 60 * 2.5; // in ms
async function sendReminderIfNecessary(events, reminders) {
    const currentTime = new Date();

    const closeEvents = events
        .filter((event) => event.endDate.getTime() - event.startDate.getTime() < 77760000) // Not all-day events
        //.filter((event) => event.startDate > currentTime && event.startDate - currentTime <= twoAndAHalfMinutes); // Starts within 2.5 minutes

    if (closeEvents.length !== 0) {
        const firstEvent = closeEvents[0];
        //const tminusSeconds = (firstEvent.startDate - currentTime) / 1000;
        const tminusMinutes = Math.round((firstEvent.startDate - currentTime) / 1000 / 60);
        if (reminders.indexOf(tminusMinutes) === -1) {
            return;
        }
        if (tminusMinutes > 1) {
            var timeUnit = "minutes";
        } else {
            var timeUnit = "minute";
        }
        if (firstEvent.location) {
            //await SlackService.sendReminder(`Reminder: ${firstEvent.subject} in ${firstEvent.location} starts in ${tminusSeconds} seconds`);
            await SlackService.sendReminder(`Reminder: ${firstEvent.subject} in ${firstEvent.location} starts in ${tminusMinutes} ${timeUnit}.`);
        } else {
            await SlackService.sendReminder(`Reminder: ${firstEvent.subject} starts in ${tminusMinutes} ${timeUnit}.`);
        }
    }
}

module.exports = {
    runJob
};

import { clearStatus, updateStatus, sendReminder } from './slackService';
import { readSettingsFile } from "./fileService";
import { fetchCalendarEvents } from './calendarService';

export const runSlackStatusUpdaterJob = async () => {
    console.log('Running Job..');

    const events = await fetchCalendarEvents();
    const statusSettings = await readSettingsFile();

    if (!statusSettings) {
        throw new Error('No settings file found, stopping execution.');
    }

    const currentTime = new Date();
    const currentEvents = events
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

    await sendReminderIfNecessary(events);

    if (currentEvents.length === 0) {
        await clearStatus();
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

    for (const statusEvent of statusEvents) {
        const doesMatch = statusEvent.matching_words.some((substring) => {
            const sanitizedSubstring = substring.toLowerCase().trim();
            return subject.indexOf(sanitizedSubstring) !== -1;
        });

        if (doesMatch) {
            const statusText = statusEvent.check_for_status_in_title ? checkSubjectForTitle(primaryEvent.subject) : statusEvent.status_text;
            await updateStatus(statusText, statusEvent.status_emojis, hasAllDayEvent ? null : endTime);
            return;
        }
    }

    // Doesn't match any of our options, we use fallback
    await updateStatus(fallbackStatusEvent.status_text, fallbackStatusEvent.status_emojis, hasAllDayEvent ? null : endTime);
}

const checkSubjectForTitle = (subject) => {
    const splitSubject = subject.split(' - ');

    if (splitSubject.length !== 2) {
        return subject;
    }

    return splitSubject[1];
}

const twoAndAHalfMinutes = 1000 * 60 * 2.5; // in ms
const sendReminderIfNecessary = async (events) => {
    const currentTime = (new Date()).getTime();

    const closeEvents = events
        .filter((event) => event.endDate.getTime() - event.startDate.getTime() < 77760000) // Not all-day events
        .filter((event) => event.startDate > currentTime && event.startDate - currentTime <= twoAndAHalfMinutes); // Starts within 2.5 minutes

    if (closeEvents.length !== 0) {
        const firstEvent = closeEvents[0];
        const tminusSeconds = (firstEvent.startDate - currentTime) / 1000;
        if (firstEvent.location) {
            await sendReminder(`Reminder: ${firstEvent.subject} in ${firstEvent.location} starts in ${tminusSeconds} seconds`);
        } else {
            await sendReminder(`Reminder: ${firstEvent.subject} starts in ${tminusSeconds} seconds`);
        }
    }
}

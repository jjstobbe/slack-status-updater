import fetch from 'node-fetch';
import { getTokens, setTokens } from './tokenService';

interface CalendarItem {
    subject: string;
    startDate: Date;
    endDate: Date;
    location: string;
}

export const fetchCalendarEvents = async (): Promise<Array<CalendarItem>> => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    let tomorrowsDate = new Date();
    tomorrowsDate.setDate(currentDate.getDate() + 1);

    try {
        return await tryFetchCalendarEvents(currentDate, tomorrowsDate);;
    } catch (ex) {
        console.log(ex);
        return [];
    }
}

const tryFetchCalendarEvents = async (startDate: Date, endDate: Date) => {
    const calendarUrl = getCalendarUrl(startDate, endDate);

    try {
        const tokens = await getTokens();
        if (!tokens) {
            console.error('No tokens found');
            return;
        }
    
        let response = await makeCalendarRequest(calendarUrl, tokens.accessToken);

        if (response.status == 401) {
            const newTokens = await refreshAccessToken(tokens._id, tokens.refreshToken);
            if (!newTokens) {
                console.error('No tokens found');
                return;
            }
        
            response = await makeCalendarRequest(calendarUrl, newTokens.accessToken);
            
            // If we're still unauthorized, just fail
            if (response.status == 401) {
                console.error("Still unauthorized after attempting to refresh access token - won't continue");
                return null;   
            }
        }

        const responseJson = await response.json();
        
        return responseJson.value.map(sanitizeCalendarItem);
    } catch (e) {
        console.error('There was a problem fetching calendar events', e);
        return;
    }
}

const makeCalendarRequest = async (calendarUrl: URL, accessToken: string) => {
    const timeZone = process.env.TIMEZONE || "Central Standard Time";

    const response = await fetch(calendarUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': `outlook.timezone="${timeZone}"`,
        }
    });

    return response;
}

const refreshAccessToken = async (_id: string, refreshToken: string) => {
    if (!process.env.CLIENT_ID) {
        console.error('No CLIENT_ID environment variable');
        return;
    }
    if (!process.env.CLIENT_SECRET) {
        console.error('No CLIENT_SECRET environment variable');
        return;
    }

    if (!refreshToken) {
        if (!process.env.REFRESH_TOKEN) {
            console.error('No REFRESH_TOKEN environment variable');
            return;
        }
    
        refreshToken = process.env.REFRESH_TOKEN;
    }

    const formBody = new URLSearchParams({
        'client_id': process.env.CLIENT_ID,
        'scope': 'offline_access calendars.read',
        'refresh_token': refreshToken,
        'grant_type': 'refresh_token',
        'client_secret': process.env.CLIENT_SECRET,
    });

    try {
        const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formBody,
        });
        const responseJson = await response.json();

        console.log('Made request to get another access token');

        await setTokens({
            _id,
            accessToken: responseJson.access_token,
            refreshToken: responseJson.refresh_token,
        });

        return {
            _id,
            accessToken: responseJson.access_token,
            refreshToken: responseJson.refresh_token,
        };
    } catch (e) {
        console.error('There was a problem fetching a new token', e);
        return;
    }
};

const getCalendarUrl = (startDate: Date, endDate: Date): URL => {
    const calendarUrl = new URL(`https://graph.microsoft.com/v1.0/me/calendar/calendarView?startDateTime=${formatDate(startDate)}&endDateTime=${formatDate(endDate)}`);
    return calendarUrl;
}

const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${month}-${day}`;
}

const sanitizeCalendarItem = (item: any): CalendarItem => ({
    subject: item.subject,
    startDate: new Date(item.start.dateTime),
    endDate: new Date(item.end.dateTime),
    location: item.location.displayName
});


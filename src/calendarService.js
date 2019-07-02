const EWS = require('node-ews');

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

    const result = await ewsServer.run(ewsFunction, ewsArgs);
    return result.ResponseMessages.GetFolderResponseMessage.Folders.CalendarFolder.FolderId.attributes;
}

async function fetchCalendarEvents() {
    const {
        Id,
        ChangeKey
    } = await fetchCalenderInfo();

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
                'FieldURI': [{
                        'attributes': {
                            'FieldURI': 'item:Subject'
                        }
                    },
                    {
                        'attributes': {
                            'FieldURI': 'calendar:Start'
                        }
                    },
                    {
                        'attributes': {
                            'FieldURI': 'calendar:End'
                        }
                    }
                ]
            }
        },
        'CalendarView': {
            'attributes': {
                'StartDate': currentDate.toISOString(),
                'EndDate': tomorrowDate.toISOString()
            }
        },
        'ParentFolderIds': {
            'FolderId': {
                'attributes': {
                    'Id': Id,
                    'ChangeKey': ChangeKey,
                }
            }
        }
    }

    const result = await ewsServer.run(ewsFunction, ewsArgs);

    try {
        const calendarItems = result.ResponseMessages.FindItemResponseMessage.RootFolder.Items.CalendarItem;
        const sanitizedCalendarItems = calendarItems
            .map(item => {
                return {
                    subject: item.Subject,
                    startDate: new Date(item.Start),
                    endDate: new Date(item.End),
                }
            });
        return sanitizedCalendarItems
    }
    catch {
        return []
    }
}

module.exports = {
    fetchCalendarEvents
}
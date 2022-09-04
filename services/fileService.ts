import { MongoClient } from 'mongodb';
const uri = process.env.MONGO_URI;

interface CalendarSettings {
    _id?: string;
    fallback_status_event: {
        status_text: string;
        status_emojis: Array<string>;
    };
    ignored_events: {
        matching_words: Array<string>;
    };
    status_events: Array<{
        matching_words: Array<string>; // Words to look for in the calendar invite that'll determine if this is used
        status_text?: string; // What is displayed as your slack status
        status_emojis?: Array<string>; // Emojis to set the status to, will flip through them if there are multiple
        check_for_status_in_title?: boolean; // Checks for the status as a prefix, then uses the rest of the title in the slack status `Vacation - Back Monday`, matches Vacation, then puts `Back Monday` as a status
    }>;
}

export const readSettingsFile = async (): Promise<CalendarSettings | null> => {
    const client = await getClient();

    try {
        const collection = client.db('slack-status-updater').collection('status-settings');
        const result = await collection.findOne({}, { sort: { $natural: -1 } });

        delete result._id;

        return result as CalendarSettings;
    } catch (err) {
        console.log(err);
    } finally {
        client.close();
    }

    return null;
}

export const setSettingsFile = async (updatedJson: CalendarSettings) => {
    const client = await getClient();

    try {
        const collection = client.db('slack-status-updater').collection('status-settings');
        await collection.insertOne(updatedJson);

        return updatedJson;
    } catch (err) {
        console.log(err);
    } finally {
        client.close();
    }
}

const getClient = async () => {
    const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }).catch((err) => {
        console.log(err);
    });

    if (!client) {
        throw 'No DBClient';
    }

    return client;
}

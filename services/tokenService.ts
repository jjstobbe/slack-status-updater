import { MongoClient } from 'mongodb';

interface Tokens {
    _id: string;
    accessToken: string;
    refreshToken: string;
}

export const getTokens = async (): Promise<Tokens | null> => {
    const client = await getClient();

    try {
        const collection = client.db('slack-status-updater').collection('tokens');
        const result = await collection.findOne({}, { sort: { $natural: -1 } });

        return result as Tokens;
    } catch (err) {
        console.log(err);
    } finally {
        client.close();
    }

    return null;
}

export const setTokens = async (tokens: Tokens) => {
    const client = await getClient();

    try {
        const collection = client.db('slack-status-updater').collection('tokens');

        const filter = { _id: tokens._id };
        const options = { upsert: true };
        const updatedDoc = {
            $set: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken, 
            },
        }

        await collection.updateOne(filter, updatedDoc, options);
    } catch (err) {
        console.log(err);
    } finally {
        client.close();
    }
}

const uri = process.env.MONGO_URI;
const getClient = async () => {
    const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }).catch((err) => {
        console.log(err);
    });

    if (!client) {
        throw 'No DBClient';
    }

    return client;
}
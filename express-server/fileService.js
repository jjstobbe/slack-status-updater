const MongoClient = require('mongodb').MongoClient;
const uri = process.env.mongoUri;

async function readSettingsFile() {
    const client = await getClient();

    try {
        const collection = client.db('slack-status-updater').collection('status-settings');
        const result = await collection.findOne({}, { sort: { $natural: -1 } });

        delete result._id;

        return result;
    } catch (err) {
        console.log(err);
    } finally {
        client.close();
    }

    return null;
}

async function setSettingsFile(updatedJson) {
    const client = await getClient();

    console.log('NEW JSON', updatedJson);

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

async function getClient() {
    const client = await MongoClient.connect(uri, { useNewUrlParser: true }).catch((err) => {
        console.log(err);
    });

    if (!client) {
        throw 'No DBClient';
    }

    return client;
}

module.exports = {
    readSettingsFile,
    setSettingsFile
};

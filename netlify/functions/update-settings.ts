import { Handler } from "@netlify/functions";
import { setSettingsFile } from "../../services/fileService";

const handler: Handler = async (event, context) => {
    if (!event.body) {
        return {
            statusCode: 400,
            body: 'No Request Body',
        };
    }

    const jsonSettings = JSON.parse(event.body);
    await setSettingsFile(jsonSettings);

    return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
    };
};

export { handler };

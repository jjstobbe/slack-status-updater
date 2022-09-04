import { Handler } from "@netlify/functions";
import { readSettingsFile } from "../../services/fileService";

const handler: Handler = async (event, context) => {
    const settings = await readSettingsFile();

    return {
        statusCode: 200,
        body: JSON.stringify(settings),
    };
};

export { handler };

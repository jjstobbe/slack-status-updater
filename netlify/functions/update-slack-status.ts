import { Handler } from "@netlify/functions";
import { runSlackStatusUpdaterJob } from "../../services/jobService";

const handler: Handler = async (event, context) => {
    await runSlackStatusUpdaterJob();

    return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
    };
};

export { handler };

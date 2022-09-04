import { Handler } from "@netlify/functions";
import { runSlackStatusUpdaterJob } from "../../services/jobService";

// Used for manually updating my status
const handler: Handler = async (event, context) => {
    await runSlackStatusUpdaterJob();

    return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
    };
};

export { handler };

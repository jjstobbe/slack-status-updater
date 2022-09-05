import { Handler, schedule } from "@netlify/functions";
import { runSlackStatusUpdaterJob } from "../../services/jobService";

// Runs every two minutes from 7:00 AM - 5:59 PM on every weekday (adjusted for UTC time)
const handler: Handler = schedule('*/2 12-22 * * 1-5', async (event, context) => {
    await runSlackStatusUpdaterJob();

    return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
    };
});

export { handler };

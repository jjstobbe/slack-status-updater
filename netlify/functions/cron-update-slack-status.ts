import { Handler, schedule } from "@netlify/functions";
import { runSlackStatusUpdaterJob } from "../../services/jobService";

// Runs every two minutes from 7:00 AM - 5:00 PM on every weekday (+Sunday for testing right now)
const handler: Handler = schedule('*/2 7-17 * * 0-5', async (event, context) => {
    await runSlackStatusUpdaterJob();

    return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
    };
});

export { handler };

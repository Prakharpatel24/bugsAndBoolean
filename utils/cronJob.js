const cron = require('node-cron');
const { subDays, startOfYesterday, endOfYesterday } = require("date-fns");
const ConnectionRequest = require("../src/models/connectionRequest");
const sendEmail = require("../utils/sendEmail");

if (process.env.ENABLE_CRONJOBS === "true") {
    cron.schedule("0 8 * * *", async () => {
        const yesterday = subDays(new Date, 1);
        const yesterdayStart = startOfYesterday(yesterday);
        const yesterdayEnd = endOfYesterday(yesterday);
        const allPreviousDayPendingRequest = await ConnectionRequest.find({
            status: "interested",
            createdAt: {
                $gte: yesterdayStart,
                $lt: yesterdayEnd
            }
        }).populate("fromUserId toUserId");
        const uniqueToUserEmailIds = [...new Set(allPreviousDayPendingRequest.map((request) => request?.toUserId?.emailId))];

        for (emails of uniqueToUserEmailIds) {
            const emailRes = await sendEmail.run(
                "prakharpatel2001@gmail.com",
                "noreply@bugsandboolean.com",
                ` <html>
                    <body>
                        <h2>Hello,</h2>
                        <p>This is a gentle reminder that you have pending connection requests from yesterday.</p>
                        <p> Don’t miss the opportunity to connect and collaborate!</p>
                        <br />
                        <p>Best regards,</p>
                        <p>The Bugs&BooleanTeam</p>
                    </body>
                </html>`,
                `
                Hello,
                This is a gentle reminder that you have pending connection requests from yesterday.
                on’t miss the opportunity to connect and collaborate!
                Best regards,
                The Bugs&Boolean Team
                `,
                "Follow up on your recent connection request"
            );
        }
    });
}
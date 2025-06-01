const express = require("express");
const requestRouter = express.Router();
const { userAuth } = require("../middleware/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const sendEmail = require("../../utils/sendEmail");

requestRouter.post("/send/:status/:toUserId", userAuth, async (req, res) => {
    try {
        const fromUserId = req.user._id;
        const toUserId = req.params.toUserId;
        const status = (req.params.status).toLowerCase();
        const allowedParamStatus = ["interested", "ignored"];
        const toUser = await User.findById(toUserId);

        if (!allowedParamStatus.includes(status)) {
            return res.status(400).send({
                status: 400,
                message: "Invalid status",
                data: null,
                error: "Invalid status"
            });
        };
        if (!toUser) {
            return res.status(404).send({
                status: 404,
                message: "User does not exist",
                data: null,
                error: "Not Found."
            });
        };

        //checking if userA has already sent a connection request to userB
        const requestExists = await ConnectionRequest.findOne({
            $or: [
                { fromUserId, toUserId },
                { fromUserId: toUserId, toUserId: fromUserId }
            ]
        });

        if (requestExists) {
            return res.status(400).send({
                status: 400,
                message: "Connection request already exists",
                data: null,
                error: null
            });
        }

        //creating a new instance of the connectionRequest model
        const connectionRequest = await new ConnectionRequest({
            fromUserId,
            toUserId,
            status
        });
        const savedConnection = await connectionRequest.save();
        if (status === "interested" && process.env.ENABLE_CRONJOBS === "true") {
            const emailRes = await sendEmail.run(
                "prakharpatel2001@gmail.com",
                "noreply@bugsandboolean.com",
                ` <html>
                    <body>
                        <h2>Hello,</h2>
                        <p>You’ve received a new connection request from <strong>${toUser?.firstName}</strong>.</p>
                        <p>They would like to connect with you on our platform.</p>
                        <br />
                        <p>Best regards,</p>
                        <p>The Bugs&BooleanTeam</p>
                    </body>
                </html>`,
                `
                Hello,
                You’ve received a new connection request from ${toUser?.firstName}.
                They would like to connect with you on our platform.
                Best regards,
                The Bugs&Boolean Team
                `,
                "You’ve received a new connection request!"
            );
            // console.log(emailRes);
        }
        const statusForReturnMessage = status === "interested" ? "sent" : "rejected";
        return res.status(200).send({
            status: 200,
            message: `Connection has been ${statusForReturnMessage} successfuly`,
            data: savedConnection,
            error: null
        });
    } catch (err) {
        return res.status(500).send({
            status: 500,
            message: 'Internal Server Error',
            data: null,
            error: err.message
        });
    }
});

requestRouter.post("/review/:status/:requestId", userAuth, async (req, res) => {
    try {
        const { status, requestId } = req.params;
        const loggedInUserId = req.user._id;

        const allowedParamStatus = ["accepted", "rejected"];
        if (!allowedParamStatus.includes(status)) {
            return res.status(400).send({
                status: 400,
                message: "Invalid status",
                data: null,
                error: "Invalid status"
            });
        }
        const connectionRequest = await ConnectionRequest.findOne({
            _id: requestId,
            toUserId: loggedInUserId,
            status: "interested"
        });
        if (!connectionRequest) {
            return res.status(404).send({
                status: 404,
                message: "Connection Request does not exist",
                data: null,
                error: "Not Found."
            });
        }
        connectionRequest.status = status;
        await connectionRequest.save();
        return res.status(200).send({
            status: 200,
            message: `Connection Request ${status} successfully.`,
            data: connectionRequest,
            error: null
        });
    } catch (err) {
        return res.status(500).send({
            status: 500,
            message: 'Internal Server Error',
            data: null,
            error: err.message
        })
    }
});

module.exports = requestRouter;
const express = require("express");
const requestRouter = express.Router();
const { userAuth } = require("../middleware/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

requestRouter.post("/send/:status/:toUserId", userAuth, async (req, res) => {
    try {
        const fromUserId = req.user._id;
        const toUserId = req.params.toUserId;
        const status = (req.params.status).toLowerCase();
        const allowedParamStatus = ["interested", "ignored"];
        const toUser = await User.findById(toUserId);

        if (!allowedParamStatus.includes(status)) {
            return res.status(400).send("Invalid request");
        };
        if (!toUser) {
            return res.status(404).send("User does not exist");
        };

        //checking if userA has already sent a connection request to userB
        const requestExists = await ConnectionRequest.findOne({
            $or: [
                { fromUserId, toUserId },
                { fromUserId: toUserId, toUserId: fromUserId }
            ]
        });

        if (requestExists) {
            return res.status(400).send("Connection request already exists");
        }

        //creating a new instance of the connectionRequest model
        const connectionRequest = await new ConnectionRequest({
            fromUserId,
            toUserId,
            status
        });
        const savedConnection = await connectionRequest.save();
        res.send(savedConnection);
    } catch (err) {
        res.status(500).send('ERROR: ' + err.message);
    }
});

requestRouter.post("/review/:status/:requestId", userAuth, async (req, res) => {
    const { status, requestId } = req.params;
    const loggedInUserId = req.user._id;

    const allowedParamStatus = ["accepted", "rejected"];
    if (!allowedParamStatus.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }
    const connectionRequest = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: loggedInUserId,
        status: "interested"
    });
    if (!connectionRequest) {
        return res.status(400).json({ message: "Connection Request does not exist" });
    }
    connectionRequest.status = status;
    await connectionRequest.save();
    res.json({
        message: `Connection Request ${status} successfully.`,
        data: connectionRequest
    });
});

module.exports = requestRouter;
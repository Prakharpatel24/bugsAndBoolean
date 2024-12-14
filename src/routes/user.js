const express = require("express");
const { userAuth } = require("../middleware/auth");
const userRouter = express.Router();
const ConnectionRequest = require("../models/connectionRequest");
require('dotenv').config();

//GET all the pending user requests
userRouter.get("/requests", userAuth, async (req, res) => {
    const loggedInUser = req.user;
    const fetchConnectionRequest = await ConnectionRequest.find({ toUserId: loggedInUser, status: 'interested' })
        .populate('fromUserId', process.env.USER_SAFE_DATA);
    res.send(fetchConnectionRequest);
});

userRouter.get("/connections", userAuth, async (req, res) => {
    const loggedInUserId = req.user._id;
    const connections = await ConnectionRequest.find({
        $or: [
            { toUserId: loggedInUserId, status: "accepted" },
            { fromUserId: loggedInUserId, status: "accepted" }
        ]
    }).populate("fromUserId", process.env.USER_SAFE_DATA)
        .populate("toUserId", process.env.USER_SAFE_DATA)
    const response = connections.map((field) => {
        if(field.fromUserId._id.toString() === loggedInUserId.toString()){
            return field.toUserId;
        }
        return field.fromUserId;
    })
    res.json({
        message: 'Successfully fetched the connections',
        data: response,
    });
})
module.exports = userRouter;
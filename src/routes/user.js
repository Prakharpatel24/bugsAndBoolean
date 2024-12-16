const express = require("express");
const { userAuth } = require("../middleware/auth");
const userRouter = express.Router();
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
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
        if (field.fromUserId._id.toString() === loggedInUserId.toString()) {
            return field.toUserId;
        }
        return field.fromUserId;
    })
    res.json({
        message: 'Successfully fetched the connections',
        data: response,
    });
});

userRouter.get("/feed", userAuth, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    const loggedInUserId = req.user._id;
    //all the requests either sent or received by the logged in user 
    const existingRequests = await ConnectionRequest.find({
        $or: [
            { toUserId: loggedInUserId },
            { fromUserId: loggedInUserId }
        ]
    }).select("fromUserId toUserId");

    const hideUsersFromFeed = new Set();
    existingRequests.forEach((req) => {
        hideUsersFromFeed.add(req.fromUserId.toString());
        hideUsersFromFeed.add(req.toUserId.toString());
    });

    const users = await User.find({
        $and: [
            { _id: { $nin: Array.from(hideUsersFromFeed) } },
            { _id: { $ne: loggedInUserId } }
        ]
    })
        .select(process.env.USER_SAFE_DATA)
        .skip(skip)
        .limit(limit);

    res.send(users);
});
module.exports = userRouter;
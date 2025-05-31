const express = require("express");
const { userAuth } = require("../middleware/auth");
const userRouter = express.Router();
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const Chat = require("../models/chat");
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

userRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const { targetUserId } = req.params;
        let chat = await Chat.findOne({
            participants: { $all: [loggedInUserId, targetUserId] }
        }).populate({
            path: "messages.senderId",
            select: "firstName lastName photoURL"
        });
        if (!chat) {
            chat = new Chat({
                participants: [loggedInUserId, targetUserId],
                messages: []
            });
            await chat.save();
        }
        return res.status(200).send({
            status: 200,
            message: 'Ok',
            data: chat,
            error: null
        })
    } catch (err) {
        console.log("ERROR", err);
        return {
            status: 500,
            message: 'Something went wrong',
            data: null,
            error: err.message
        }
    }
})
module.exports = userRouter;
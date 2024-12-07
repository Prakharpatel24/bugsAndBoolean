const express = require("express");
const requestRouter = express.Router();
const { userAuth } = require("../src/middleware/auth");

requestRouter.post("/sendConnectionRequest", userAuth, (req, res) => {
    try {
        //logic for sending the connection request. 
        const { user } = req;
        res.send(user);
    } catch (err) {
        res.status(500).send('ERROR: ' + err.message)
    }
});

module.exports = requestRouter;
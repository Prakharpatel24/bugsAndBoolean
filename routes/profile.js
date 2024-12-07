const express = require("express");
const profileRouter = express.Router();
const { userAuth } = require("../src/middleware/auth");

profileRouter.get("/profile", userAuth, async (req, res) => {
    try {
        //logic for getting all profiles.
        const { user } = req;
        res.send(user);
    } catch (err) {
        res.status(500).send('ERROR: ' + err.message)
    }
});

module.exports = profileRouter;
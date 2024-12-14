const express = require("express");
const profileRouter = express.Router();
const { userAuth } = require("../middleware/auth");
require("dotenv").config();
const validator = require("validator");
const bcrypt = require("bcrypt");

profileRouter.get("/view", userAuth, async (req, res) => {
    try {
        //logic for getting all profiles.
        const { user } = req;
        res.send(user);
    } catch (err) {
        res.status(500).send('ERROR: ' + err.message);
    }
});

profileRouter.post("/edit", userAuth, async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const isAllowed = updates.every(k => process.env.ALLOWED_UPDATES.includes(k));
        if (!isAllowed) {
            throw new Error("Unauthorized to edit this filed.");
        }
        const user = req.user;
        updates.forEach((field) => {
            user[field] = req.body[field];
        });
        await user.save();
        res.json({
            message: `Succesfully updated ${user.firstName}'s profile.`,
            data: user
        })
    } catch (err) {
        res.status(500).send('ERROR: ' + err.message);
    }
});

profileRouter.post("/password", userAuth, async (req, res) => {
    try {
        const { password } = req.body;
        if (!validator.isStrongPassword(password)) {
            throw new Error("Please enter a strong password");
        }
        const passwordHash = bcrypt.hash(password, 10);
        const user = req.user;
        user[password] = passwordHash;
        await user.save();
        res.send("Password updated successfully!");
    } catch (err) {
        res.status(500).send('ERROR: ' + err.message);
    }

});

module.exports = profileRouter;
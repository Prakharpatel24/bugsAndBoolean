const express = require("express");
const profileRouter = express.Router();
const { userAuth } = require("../middleware/auth");
require("dotenv").config();
const validator = require("validator");
const bcrypt = require("bcrypt");

profileRouter.get("/view", userAuth, async (req, res) => {
    try {
        //logic for getting all profiles.
        const { _id, firstName, lastName, emailId, age, gender, photoURL, skills } = req?.user;
        return res.status(200).send({
            status: 200,
            message: 'Successfuly fetched logged in user details.',
            data: {
                _id,
                firstName,
                lastName,
                emailId,
                age,
                gender,
                photoURL,
                skills
            },
            error: null
        })
    } catch (err) {
        return res.send({
            status: 500,
            message: 'Internal Server Error',
            data: null,
            error: err.message
        })
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
        res.status(201).send({
            status: 201,
            message: `Succesfully updated ${user.firstName}'s profile.`,
            data: user,
            error: null
        });
    } catch (err) {
        res.status(500).send({
            status: 500,
            message: 'Internal Server Error',
            data: null,
            error: err.message
        });
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
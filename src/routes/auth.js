const express = require("express");
const authRouter = express.Router();
const User = require("../models/user");
const bcrypt = require('bcrypt');
const { checkForStrongPassword } = require("../../utils/helper");
const validator = require("validator");

authRouter.post("/signup", async (req, res) => {
    try {
        const { firstName, lastName, age, emailId, password, gender, about, photoURL, skills } = req.body;
        const duplicateEmail = await User.find({ emailId });
        if (duplicateEmail.length != 0) {
            throw new Error('User already exists with the same email.');
        } else if (!checkForStrongPassword(password)) {
            throw new Error('Please enter a strong password.');
        } else {
            //hashing the password
            const encryptedPassword = await bcrypt.hash(password, 10);
            // creating a new instance of the User model
            const user = new User({
                firstName,
                lastName,
                age,
                emailId,
                password: encryptedPassword,
                gender,
                about,
                photoURL,
                skills
            });
            await user.save();
            res.send("User details saved successfully.");
        }
    } catch (err) {
        res.status(500).send('ERROR: ' + err.message)
    }
});

authRouter.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;
        //validating the emailId
        if (!validator.isEmail(emailId)) {
            return res.send({
                status: 400,
                message: 'Bad Request',
                data: null,
                error: 'Enter a valid email address.' 
            })
        }
        //check if the user exists in the db
        const user = await User.findOne({ emailId },
            [
                "-_id",
                "-createdAt",
                "-updatedAt",
                "-__v",
            ]
        );
        if (!user) {
            return res.send({
                status: 400,
                message: 'Bad Request',
                data: null,
                error: 'Invalid credentials' 
            })
        }
        const {firstName, lastName, gender, photoURL, skills} = user;
        //comparing the hash
        const checkPassword = await user.validatePassword(password);
        if (!checkPassword) {
            return res.send({
                status: 400,
                message: 'Bad Request',
                data: null,
                error: 'Invalid credentials' 
            })
        }
        const token = await user.getJWT();
        res.cookie("token", token, { expires: new Date(Date.now() + 900000) });

        return res.send({
            status: 200,
            message: "Login Successful",
            data: {
                firstName,
                lastName,
                emailId,
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

authRouter.post("/logout", (req, res) => {
    res.cookie("token", null, { expires: new Date(Date.now()) });
    res.send("Logged out successfully!");
})

module.exports = authRouter;
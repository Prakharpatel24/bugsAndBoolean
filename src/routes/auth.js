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
            res.status(400).send({
                status: 400,
                message: "User already exists with the same email.",
                data: null,
                error: "Bad Request"
            })
        } else if (!checkForStrongPassword(password)) {
            res.status(400).send({
                status: 400,
                message: "Please enter a strong password.",
                data: null,
                error: "Bad Request"
            })
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

            const token = await user.getJWT();
            res.cookie("token", token, { expires: new Date(Date.now() + 900000) });

            res.status(201).send({
                status: 201,
                message: "User details saved successfully.",
                data: user,
                error: null
            });
        }
    } catch (err) {
        return res.status(500).send({
            status: 500,
            message: 'Internal Server Error',
            data: null,
            error: err.message
        })
    }
});

authRouter.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;
        //validating the emailId
        if (!validator.isEmail(emailId)) {
            return res.status(400).send({
                status: 400,
                message: 'Enter a valid email address.',
                data: null,
                error: 'Bad Request' 
            })
        }
        //check if the user exists in the db
        const user = await User.findOne({ emailId },
            [
                "-createdAt",
                "-updatedAt",
                "-__v",
            ]
        );
        if (!user) {
            return res.status(400).send({
                status: 400,
                message: 'Invalid credentials',
                data: null,
                error: 'Bad Request' 
            })
        }
        const {firstName, lastName, age, gender, about, photoURL, skills} = user;
        //comparing the hash
        const checkPassword = await user.validatePassword(password);
        if (!checkPassword) {
            return res.status(400).send({
                status: 400,
                message: 'Invalid credentials',
                data: null,
                error: 'Bad Request' 
            })
        }
        const token = await user.getJWT();
        res.cookie("token", token, { expires: new Date(Date.now() + 900000) });

        return res.status(200).send({
            status: 200,
            message: "Login Successful",
            data: {
                firstName,
                lastName,
                emailId,
                age,
                gender, 
                about,
                photoURL,
                skills
            },
            error: null
        })
    } catch (err) {
        return res.status(500).send({
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
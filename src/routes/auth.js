const express = require("express");
const authRouter = express.Router();
const User = require("../models/user");
const bcrypt = require('bcrypt');
const { checkForStrongPassword, uploadFileToS3, getS3Url } = require("../../utils/helper");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { default: axios } = require("axios");

authRouter.post("/signup", async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            emailId,
            password,
        } = req.body;
        const duplicateEmail = await User.find({ emailId });
        if (duplicateEmail.length != 0) {
            return res.status(400).send({
                status: 400,
                message: "User already exists with the same email.",
                data: null,
                error: "Bad Request"
            })
        } else if (!checkForStrongPassword(password)) {
            return res.status(400).send({
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
                emailId,
                password: encryptedPassword,
            });
            await user.save();

            const token = await user.getJWT();
            res.cookie("token", token, { expires: new Date(Date.now() + 900000) });

            return res.status(201).send({
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
                message: "We couldn't log you in. Please try again or sign up.",
                data: null,
                error: 'Bad Request'
            })
        }
        const {
            _id,
            firstName,
            lastName,
            age,
            gender,
            about,
            photoURL,
            skills,
            githubUsername,
            instagramUsername,
            linkedInUsername,
            xUsername
        } = user;
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
                _id,
                firstName,
                lastName,
                emailId,
                age,
                gender,
                about,
                photoURL,
                skills,
                githubUsername,
                instagramUsername,
                linkedInUsername,
                xUsername
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
    return res.send("Logged out successfully!");
});

authRouter.post("/signup-with-google", async (req, res) => {
    try {
        const { credential } = req.body;
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email, given_name, family_name, picture } = payload;
        const duplicateEmail = await User.find({ emailId: email });
        if (duplicateEmail.length != 0) {
            return res.status(400).send({
                status: 400,
                message: "User already exists with the same email.",
                data: null,
                error: "Bad Request"
            })
        }
        let user = new User({
            firstName: given_name,
            lastName: family_name,
            emailId: email
        });
        let profileImageUrl = null;
        if (picture) {
            const highResPhotoURL = picture?.replace(/=s\d+-c$/, '=s400-c');
            const response = await axios.get(highResPhotoURL, {
                responseType: 'arraybuffer',
            });
            const buffer = Buffer.from(response.data, 'binary');
            const bucketName = process.env.AWS_BUCKET;
            const urlKey = `${process.env.MODE}/profile-pictures/${user?._id}.jpg`;
            const mimeType = response.headers['content-type'] || 'image/jpeg';
            const region = process.env.AWS_REGION;
            await uploadFileToS3(
                buffer,
                bucketName,
                urlKey,
                mimeType
            )
            profileImageUrl = getS3Url(bucketName, region, urlKey);
            user.photoURL = profileImageUrl
        }
        await user.save();
        const token = await user.getJWT();
        res.cookie("token", token, { expires: new Date(Date.now() + 900000) });
        return res.status(201).send({
            status: 201,
            message: "User details saved successfully.",
            data: user,
            error: null
        });
    } catch (err) {
        return res.status(500).send({
            status: 500,
            message: 'Internal Server Error',
            data: null,
            error: err.message
        })
    }
})

authRouter.post("/login-with-google", async (req, res) => {
    try {
        const { credential } = req.body;
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email } = payload;
        const user = await User.findOne({ emailId: email },
            [
                "-createdAt",
                "-updatedAt",
                "-__v",
            ]
        );
        if (!user) {
            return res.status(400).send({
                status: 400,
                message: "We couldn't log you in. Please try again or sign up.",
                data: null,
                error: 'Bad Request'
            })
        }
        const {
            _id,
            firstName,
            lastName,
            age,
            gender,
            about,
            photoURL,
            skills,
            githubUsername,
            instagramUsername,
            linkedInUsername,
            xUsername
        } = user;
        const token = await user.getJWT();
        res.cookie("token", token, { expires: new Date(Date.now() + 900000) });
        return res.status(200).send({
            status: 200,
            message: "Login Successful",
            data: {
                _id,
                firstName,
                lastName,
                email,
                age,
                gender,
                about,
                photoURL,
                skills,
                githubUsername,
                instagramUsername,
                linkedInUsername,
                xUsername
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

module.exports = authRouter;
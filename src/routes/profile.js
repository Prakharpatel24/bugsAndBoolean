const express = require("express");
const profileRouter = express.Router();
const { userAuth, upload } = require("../middleware/auth");
require("dotenv").config();
const validator = require("validator");
const bcrypt = require("bcrypt");
const {uploadFileToS3, getS3Url} = require("../../utils/helper");

profileRouter.get("/view", userAuth, async (req, res) => {
    try {
        //logic for getting all profiles.
        const {
            _id,
            firstName,
            lastName,
            emailId,
            age,
            gender,
            photoURL,
            about,
            skills,
            githubUsername,
            instagramUsername,
            linkedInUsername,
            xUsername
        } = req?.user;
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
                about,
                skills,
                githubUsername,
                instagramUsername,
                linkedInUsername,
                xUsername
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

profileRouter.post("/edit", userAuth, upload.single('profileImage'), async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const isAllowed = updates.every(k => process.env.ALLOWED_UPDATES.includes(k));
        if (!isAllowed) {
            throw new Error("Unauthorized to edit this filed.");
        }
        const user = req.user;
        const profilePicture = req?.file;
        let profileImageUrl = null;
        if (profilePicture) {
            const allowedMimeTypes = [
                'image/png',
                'image/jpeg',
                'image/svg+xml'
            ]
            if (!allowedMimeTypes.includes(profilePicture.mimetype)) {
                return res.status(400).send({
                    status: 400,
                    message: 'Only PNG, JPEG, and SVG files are allowed.',
                    data: null,
                    error: 'Invalid Type'
                });
            }
            // const urlKey = `profile-pictures/${Date.now()}_${profilePicture.originalname}`;
            const urlKey = `profile-pictures/${user?._id}.jpg`;
            const bucketName = process.env.AWS_BUCKET;
            const region = process.env.AWS_REGION;
            await uploadFileToS3(
                profilePicture.buffer,
                bucketName,
                urlKey,
                profilePicture.mimetype
            )
            profileImageUrl = getS3Url(bucketName, region, urlKey)
            user.photoURL = profileImageUrl
        };
        updates.forEach((field) => {
            user[field] = req.body[field];
        });
        await user.save();
        return res.status(201).send({
            status: 201,
            message: `Succesfully updated ${user.firstName}'s profile.`,
            data: user,
            error: null
        });
    } catch (err) {
        console.log(err.message);
        return res.status(500).send({
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
        return res.send("Password updated successfully!");
    } catch (err) {
        return res.status(500).send('ERROR: ' + err.message);
    }

});

module.exports = profileRouter;
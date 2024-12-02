const express = require("express");
const app = express();
const { adminAuth, userAuth } = require("./src/middleware/auth");
const connectDb = require('./src/config/database');
const User = require('./src/models/user');
require('dotenv').config();
const bcrypt = require('bcrypt');
const validator = require('validator');
const {checkForStrongPassword} = require('./utils/helper');

//using the middleware provided to us by Express for converting json objects to js objects
app.use(express.json());

app.post("/signup", async (req, res) => {
    try {
        const { firstName, lastName, age, emailId, password, gender, about, photoURL, skills } = req.body;
        const duplicateEmail = await User.find({ emailId });
        if (duplicateEmail.length != 0) {
            res.status(500).send('User already exists with the same email.');
        } else if(!checkForStrongPassword(password)){
            res.status(500).send('Please enter a strong password.');
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
        res.status(400).send("An Error Occurred, " + err.message);
    }
});

app.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;
        console.log(emailId);
        
        //validating the emailId
        if(!validator.isEmail(emailId)){
            res.status(500).send('Enter a valid email address.');
        }
        //check if the user exists in the db
        const user = await User.findOne({emailId});
        if(!user){
            res.status(500).send('Invalid credentials');
        }
        //comparing the hash
        const validatePassword = await bcrypt.compare(password, user.password);
        if(validatePassword){
            res.send("Login Successful!");
        } else{
            res.status(500).send('Invalid credentials');
        }
    } catch(err){
        console.log('Something went wrong, ' + err.message);   
    }
})

// app.get("/find", async (req, res) => {
//     try {
//         const userEmail = req.body;
//         //.find() returns an arrray of objects which matches the filter.
//         const users = await User.find(userEmail);
//         if (users.length === 0) {
//             res.status(404).send("User not found");
//         } else {
//             res.send(users);
//         }
//     } catch (err) {
//         res.status(500).send("Something went wrong");
//     }
// });

app.get("/find", async (req, res) => {
    try {
        const users = await User.find(req.body).select("+password -firstName");
        if (users.length === 0) {
            res.status(404).send("User not found");
        } else {
            res.send(users);
        }
    } catch (err) {
        res.status(500).send("Something went wrong, " + err.message);
    }
})
app.get("/findOne", async (req, res) => {
    try {
        const userEmail = req.body;
        const user = await User.findOne(userEmail);
        if (!user) {
            res.status(404).send("User not found");
        } else {
            res.send(user);
        }
    } catch (err) {
        res.status(500).send("Something went wrong");
    }
});

app.get("/getById", async (req, res) => {
    const user = await User.findById("67396e2e14fbd6cd495f5c88");
    if (!user) res.status(404).send("User not found");
    else res.send(user);
});

app.get("/feed", async (req, res) => {
    try {
        const users = await User.find({});
        if (users.length === 0) {
            res.status(404).send("No data found");
        } else {
            res.send(users);
        }
    } catch {
        res.status(500).send("Something went wrong");
    }
});

app.delete("/user", async (req, res) => {
    const userId = req.body;
    try {
        // const deletedUser = await User.findByIdAndDelete(userId);
        const deletedUser = await User.findOneAndDelete({ _id: userId });
        res.send("User deleted Successfully");
    } catch {
        res.status(500).send("Something went wrong");
    }
});

// app.patch("/user", async (req, res) => {
//     const { filter, update } = req.body;
//     console.log(filter, update);
//     try {
//         if (update.emailId) {
//             return res.status(403).send("Updating the email address is not allowed.");
//         } else if (!Object.keys(update).every(key => process.env.ALLOWED_UPDATES.split(",").includes(key))) {
//             return res.status(403).send('Not authorized to update this field');
//         } else {
//             // const updatedUser = await User.findOneAndUpdate(filter, update, { new: true});
//             const updatedUser = await User.findByIdAndUpdate(filter, update, { new: true });
//             console.log(updatedUser, "updatedUser");

//             res.send("User updated successfully");
//         }
//     } catch (err) {
//         res.status(500).send("Something went wrong");
//         console.error(err);
//     }
// });

app.patch("/user/:userId", async (req, res) => {
    const userId = req.params?.userId;
    const updates = req.body;
    try {
        if (Object.keys(req.body).every((key) => process.env.ALLOWED_UPDATES.includes(key))) {
            const existingUser = await User.findOne({ _id: userId });
            if (existingUser) {
                console.log(existingUser);
                for (const key in updates) {
                    if (existingUser[key] && existingUser[key].toString().toLowerCase() === updates[key].toString().toLowerCase()) {
                        return res.status(400).send(`The value of ${key} is already ${updates[key]}`);
                    }
                }
            }
            const updatedUser = await User.findOneAndUpdate({ _id: userId }, req.body, { next: true });
            res.send('Updated successfully');
        } else {
            res.status(401).send('Not authorized to update this field.');
        }
    } catch (err) {
        res.status(500).send('Something went wrong.')
        console.log('Something went wrong ' + err.message);
    }
});


connectDb()
    .then(
        console.log("Successfully connected to the database"),
        app.listen(7777, () => {
            console.log("Server is successfully running at port 7777!");
        }))
    .catch(e => { console.log("An error occured while connecting to the database") + e.message });
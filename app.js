const express = require("express");
const app = express();
const {adminAuth, userAuth} = require("./src/middleware/auth");
const connectDb = require ('./src/config/database');
const User = require('./src/models/user');

app.post("/signup", async (req, res)=> {
    try{
        const userObj = {
            firstName: "Pranav",
            lastName: "Patel",
            emailId: "pranav@patel.com",
            password: "123"
        }
        //creating a new instance of the User model
        const user = new User(userObj);

        //a new document will be created in the db
        await user.save();
        res.send("User created successfully")
    } catch (err){
        res.status(400).send("Could not save the user deatils." + err.message);
    }
    
});

connectDb()
    .then(
        console.log("Successfully connected to the database"),
        app.listen(7777, ()=> {
            console.log("Server is successfully running at port 7777!");
         }))
    .catch(e => { console.log("An error occured while connecting to the database") });
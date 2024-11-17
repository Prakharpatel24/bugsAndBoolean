const express = require("express");
const app = express();
const {adminAuth, userAuth} = require("./src/middleware/auth");
const connectDb = require ('./src/config/database');
const User = require('./src/models/user');

//using the middleware provided to us by Express for converting json objects to js objects
app.use(express.json());

app.post("/signup", async (req, res)=> {
    try{
        // creating a new instance of the User model
        const user = new User(req.body);
        await user.save();
        res.send("User details saved successfully.");
    } catch (err){
        res.status(400).send("An Error Occurred" + err.message);
    }
    
});

connectDb()
    .then(
        console.log("Successfully connected to the database"),
        app.listen(7777, ()=> {
            console.log("Server is successfully running at port 7777!");
         }))
    .catch(e => { console.log("An error occured while connecting to the database") });
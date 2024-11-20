const express = require("express");
const app = express();
const { adminAuth, userAuth } = require("./src/middleware/auth");
const connectDb = require('./src/config/database');
const User = require('./src/models/user');

//using the middleware provided to us by Express for converting json objects to js objects
app.use(express.json());

app.post("/signup", async (req, res) => {
    try {
        // creating a new instance of the User model
        const user = new User(req.body);
        await user.save();
        res.send("User details saved successfully.");
    } catch (err) {
        res.status(400).send("An Error Occurred" + err.message);
    }
});

app.get("/find", async (req, res) => {
    try {
        const userEmail = req.body;
        //.find() returns an arrray of objects which matches the filter.
        const users = await User.find(userEmail);
        if (users.length === 0) {
            res.status(404).send("User not found");
        } else {
            res.send(users);
        }
    } catch (err) {
        res.status(500).send("Something went wrong");
    }
});

app.get("/findOne", async (req, res) => {
    try {
        const userEmail = req.body;
        const user = await User.findOne(userEmail);
        if (!user) {
            res.status(404).send("User not found");
        } else {
            res.send(user);
        }
    }catch (err) {
        res.status(500).send("Something went wrong");
    }
});

app.get("/getById", async (req, res)=> {
    const user = await User.findById("67396e2e14fbd6cd495f5c88");
    if(!user) res.status(404).send("User not found");
    else res.send(user);
});

app.get("/feed", async (req, res)=> {
    try{
        const users = await User.find({});
        if(users.length===0){
            res.status(404).send("No data found");
        } else{
            res.send(users);
        }
    } catch{
        res.status(500).send("Something went wrong");
    }
}); 

app.delete("/user", async (req, res) => {
    const userId = req.body;
    try{
        // const deletedUser = await User.findByIdAndDelete(userId);
        const deletedUser = await User.findOneAndDelete({_id: userId});
        res.send("User deleted Successfully");
    } catch{
        res.status(500).send("Something went wrong"); 
    }
});

app.patch("/user", async (req, res) => {
    const {filter , update} = req.body;

    console.log(filter, update);
    
    try{
        // const updatedUser = await User.findOneAndUpdate(filter, update, { new: true});
        const updatedUser = await User.findByIdAndUpdate(filter, update, {new: true});
        console.log(updatedUser, "updatedUser");
        
        res.send("User updated successfully");
    }catch (err){
        res.status(500).send("Something went wrong"); 
        console.error(err);
    }
})

connectDb()
    .then(
        console.log("Successfully connected to the database"),
        app.listen(7777, () => {
            console.log("Server is successfully running at port 7777!");
        }))
    .catch(e => { console.log("An error occured while connecting to the database") });
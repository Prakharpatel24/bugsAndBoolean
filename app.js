const express = require("express");
const app = express();
const connectDb = require('./src/config/database');
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");

//using the middleware provided to us by Express for converting json objects to js objects
app.use(express.json());
app.use(cookieParser());

//mounting routers 
app.use("/auth", authRouter);
app.use("/", profileRouter);
app.use("/request", requestRouter);


connectDb()
    .then(
        console.log("Successfully connected to the database"),
        app.listen(7777, () => {
            console.log("Server is successfully running at port 7777!");
        }))
    .catch(e => { console.log("An error occured while connecting to the database") + e.message });
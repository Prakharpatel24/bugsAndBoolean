const express = require("express");
const app = express();
const connectDb = require('./src/config/database');
const cookieParser = require("cookie-parser");
const authRouter = require("./src/routes/auth");
const profileRouter = require("./src/routes/profile");
const requestRouter = require("./src/routes/request");
const userRouter = require("./src/routes/user");
const cors = require("cors");

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))

//using the middleware provided to us by Express for converting json objects to js objects
app.use(express.json());
app.use(cookieParser());

//mounting routers 
app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/request", requestRouter);
app.use("/user", userRouter);

connectDb()
    .then(
        console.log("Successfully connected to the database"),
        app.listen(7777, () => {
            console.log("Server is successfully running at port 7777!");
        }))
    .catch(e => { console.log("An error occured while connecting to the database") + e.message });
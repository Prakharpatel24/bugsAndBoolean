const express = require("express");
const app = express();
const connectDb = require('./src/config/database');
const cookieParser = require("cookie-parser");
const authRouter = require("./src/routes/auth");
const profileRouter = require("./src/routes/profile");
const requestRouter = require("./src/routes/request");
const userRouter = require("./src/routes/user");
const cors = require("cors");
require('dotenv').config();
require("./utils/cronJob");
const { createServer } = require("http");
const { Server } = require("socket.io");
const initializeSocket = require("./utils/socketIO");

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))

//using the middleware provided to us by Express for converting json objects to js objects
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//mounting routers 
app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/request", requestRouter);
app.use("/user", userRouter);

const httpServer = createServer(app);
initializeSocket(httpServer);

connectDb()
    .then(
        console.log("Successfully connected to the database"),
        httpServer.listen(process.env.PORT, () => {
            console.log("Server is successfully running!");
        }))
    .catch(e => { console.log("An error occured while connecting to the database") + e.message });
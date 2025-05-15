const User = require("../models/user");
const jwt = require("jsonwebtoken");
require('dotenv').config();
const userAuth = async (req, res, next) => {
    try{
        const cookie = req.cookies;
        if(!cookie){
            throw new Error("Cookie not found. Please log in again.");
        }
        const {token} = cookie;
        if(!token){
            return res.status(401).send({
                status: 401,
                message: "Please Login.",
                data: null,
                error: "Invalid Token"
            });
        }
        const decode = await jwt.verify(token, process.env.PRIVATE_KEY);
        const {_id} = decode;

        const user = await User.findById(_id);
        if(!user){
            throw new Error('User not found');
        }
        req.user = user;
    } catch(err){
        res.status(500).send("Error: " + err.message);
    }
    next();
};

module.exports = {
    userAuth
}
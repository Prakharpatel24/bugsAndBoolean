const mongoose = require("mongoose");
require('dotenv').config();

const mongoDBURI = process.env.MONGODB_URI;

const connectDb = async () => {
    await mongoose.connect(`${mongoDBURI}`);
}

module.exports = connectDb;
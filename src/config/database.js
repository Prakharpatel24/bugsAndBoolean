const mongoose = require("mongoose");
require('dotenv').config();

const mongoDBURI = process.env.MONGODB_URI;
console.log(mongoDBURI);

const connectDb = async () => {
    await mongoose.connect(`${mongoDBURI}`);
}

module.exports = connectDb;
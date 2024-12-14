const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema({
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    status: {
        type: String,
        required: true,
        enum: {
            values: ["interested", "ignored", "accepted", "rejected"],
            message: '{VALUE} is not a valid status type'
        }
    }
},{timestamps: true});

connectionRequestSchema.index({fromUserId: 1, toUserId: 1});
connectionRequestSchema.pre('save', function(next){
    if(this.fromUserId.equals(this.toUserId)){
        throw new Error("You cannot send a connection request to yourself");
    }
    next();
})

module.exports = mongoose.model("ConnectionRequest", connectionRequestSchema);
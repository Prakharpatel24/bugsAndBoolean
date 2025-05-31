const socket = require("socket.io");
const crypto = require("crypto");
const Chat = require("../src/models/chat");

const getSecureRoomId = ({ loggedInUserId, targetUserId }) => {
    return crypto
        .createHash("sha256")
        .update([loggedInUserId, targetUserId].sort().join("_"))
        .digest("hex");
}

const initializeSocket = (server) => {
    const io = socket(server, {
        cors: {
            origin: 'http://localhost:5173'
        }
    });
    io.on("connection", (socket) => {
        //handle events
        socket.on("joinChat", ({ firstName, loggedInUserId, targetUserId }) => {
            const roomId = getSecureRoomId({ loggedInUserId, targetUserId });
            socket.join(roomId);
            // console.log(`${firstName} joined the room ${roomId}`);
        });

        socket.on("sendMessage", async ({ firstName, loggedInUserId, targetUserId, text, targetUserPhotoURL }) => {
            try {
                const roomId = getSecureRoomId({ loggedInUserId, targetUserId });
                // console.log(roomId, "sendMessageRoomID");

                //saving in the db
                let chat = await Chat.findOne({
                    participants: { $all: [loggedInUserId, targetUserId] }
                });
                if(!chat) {
                    chat = new Chat({
                        participants: [loggedInUserId, targetUserId],
                        messages: []
                    });
                }
                chat.messages.push({
                    senderId: loggedInUserId,
                    text
                });
                await chat.save();
                io.to(roomId).emit("messageReceived", { firstName, text, targetUserPhotoURL });
            } catch (err) {
                console.log("ERROR:" + err);
            }
        });
        socket.on("disconnect", () => { });
    });
};

module.exports = initializeSocket;
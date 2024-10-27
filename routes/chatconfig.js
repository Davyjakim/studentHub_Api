const { Server } = require("socket.io");
const { authMessage } = require("../middleware/authMessage");
const { User, validate } = require("../models/User");
const { Messages } = require("../models/message");
module.exports = function (Chatserver) {
  const io = new Server(Chatserver, {
    cors: {
      origin: "http://localhost:3000", // Corrected the URL
      methods: ["GET", "POST"],
    },
  });
  io.use(authMessage);

  const getFriendsForUser = async (userId) => {
    try {
      const user = await User.findById(userId);
      const friends = user.friends;

      const friendUpdates = friends.map(async (fr) => {
        const messages = await Messages.findOne({ chatRoom: fr.ChatRoom });
        const unreadMessages = messages.messagelist.filter(
          (msg) => !msg.isRead
        );
        return {
          friend: fr,
          chatList: messages.messagelist,
          unreadMessages: unreadMessages,
        };
      });

      return await Promise.all(friendUpdates);
    } catch (error) {
      console.log(error);
      return [];
    }
  };

  try {
    io.on("connection", async (socket) => {
      console.log(`userId ${socket.id}`);
      const userId = socket.user._id;
      socket.join(userId);
      socket.on("connect_error", (err) => {
        console.error(`Connection error due to ${err}`);
      });
      socket.on("leavePreviousRoom", (data) => {
        console.log(`${socket.user.name} leaving room: ${data}`);
        socket.leave(data);
      });
      socket.on("join_room", async (data) => {
        socket.join(data);
        console.log("joined room: ", data);
        const chatRoomMessage = await Messages.findOne({ chatRoom: data });

        if (chatRoomMessage) {
          chatRoomMessage.messagelist.forEach((msg) => {
            if (
              msg.ReceivedBy.toString() === socket.user._id.toString() &&
              !msg.isRead
            ) {
              msg.isRead = true;
            }
          });

          const updated = await chatRoomMessage.save();
          socket.emit("NewChatlist", updated.messagelist);

          const friends = await getFriendsForUser(socket.user._id);
          io.to(socket.user._id).emit("Friends", friends);
        }
      });

      socket.on("send_message", async (messageData) => {
        try {
          const chatRoomMessage = await Messages.findOne({
            chatRoom: messageData.Room,
          });
          if (chatRoomMessage) {
            const newMessage = {
              SentBy: messageData.SentBy,
              ReceivedBy: messageData.ReceivedBy,
              content: messageData.content,
              isRead: false,
              isAudio: messageData.isAudio,
              duration: messageData.duration,
              timestamp: messageData.timestamp,
            };

            // Check if the recipient is in the same room
            const recipientSocket = Array.from(
              io.sockets.adapter.rooms.get(messageData.Room) || []
            ).find(
              (socketId) =>
                io.sockets.sockets.get(socketId)?.user._id.toString() ===
                messageData.ReceivedBy
            );

            // Mark as read if the recipient is in the same room
            if (recipientSocket) {
              newMessage.isRead = true;
            }

            chatRoomMessage.messagelist.push(newMessage);

            await chatRoomMessage.save();
            console.log("Message saved");

            const savedMessage = {
              ...newMessage,
              Room: messageData.Room,
            };

            // Emit the new message only to the relevant room
            socket.to(messageData.Room).emit("receive_message", savedMessage);

            // Fetch updated friends list for users involved in the chat
            const senderFriends = await getFriendsForUser(messageData.SentBy);
            const receiverFriends = await getFriendsForUser(
              messageData.ReceivedBy
            );

            // Emit updated friends list to the sender and receiver only
            io.to(messageData.SentBy).emit("Friends", senderFriends);
            io.to(messageData.ReceivedBy).emit("Friends", receiverFriends);
          }
        } catch (error) {
          console.log(error);
        }
      });

      socket.on("disconnect", () => {
        console.log("user Disconnected", socket.id);
      });
    });
  } catch (error) {
    console.log(error);
  }
};

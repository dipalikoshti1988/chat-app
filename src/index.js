const http = require("http");
const path = require("path");
const express = require("express");
const socketio = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage
} = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require("./utils/users");

const port = process.env.PORT || 3000;

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, "../public");

// Setup static directory to serve
app.use(express.static(publicDirectoryPath));

// http://localhost:3000/index.html
let count = 0;
io.on("connection", socket => {
  console.log("New websocket connection");

  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });
    if (error) {
      return callback(error);
    }
    socket.join(user.room);

    socket.emit("DisplayWelcomeMessage", generateMessage("Admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit(
        "DisplayWelcomeMessage",
        generateMessage("Admin", `${user.username} has joined!`)
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    callback();

    // io.to.emit -> send to all client in specific room
    // socket.broadcast.to.emit -> send to all client except current client in specific room
  });
  // socket.emit -> send to specific client
  // io.emit -> send to all client
  // socket.broadcast.emit -> send to all client except current client

  // socket.emit("countUpdated", count);

  // socket.on("increment", () => {
  //   count++;
  //   // socket.emit("countUpdated", count);
  //   io.emit("countUpdated", count);
  // });
  socket.on("sendmessage", (msg, callback_ack) => {
    const user = getUser(socket.id);
    const filter = new Filter();

    if (filter.isProfane(msg)) {
      return callback_ack("Profanity is not allowed");
    }

    io.to(user.room).emit(
      "DisplayWelcomeMessage",
      generateMessage(user.username, msg)
    );
    callback_ack();
  });

  socket.on("sendLocation", (location, callback_ack) => {
    const user = getUser(socket.id);
    const users = getUsersInRoom(user.room);
    if (users.length === 1) {
      //return console.log("No users are there");
    }
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${location.latitude},${location.longitude}`
      )
      // `Location : ${location.latitude}, ${location.longitude}`
    );
    callback_ack();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "DisplayWelcomeMessage",
        generateMessage("Admin", `${user.username} has left!`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

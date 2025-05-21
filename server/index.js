const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // adjust for production
    methods: ["GET", "POST"],
  },
});

const waiting = [];
const rooms = new Map(); // roomId => [socket.id]

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-stranger", ({ name }) => {
    socket.data.name = name;

    if (waiting.length > 0) {
      const peer = waiting.pop();
      socket.emit("match-found", { id: peer.id, name: peer.data.name });
      peer.emit("match-found", { id: socket.id, name });
    } else {
      waiting.push(socket);
    }
  });

  socket.on("join-room", ({ roomId, name }) => {
    socket.data.name = name;
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, []);
    }
    rooms.get(roomId).push(socket.id);

    const otherUsers = rooms.get(roomId).filter((id) => id !== socket.id);
    socket.emit("all-users", otherUsers);
  });

  socket.on("send-offer", ({ offer, to }) => {
    io.to(to).emit("receive-offer", { offer, from: socket.id });
  });

  socket.on("send-answer", ({ answer, to }) => {
    io.to(to).emit("receive-answer", { answer });
  });

  socket.on("send-ice-candidate", ({ candidate, to }) => {
    io.to(to).emit("receive-ice-candidate", { candidate });
  });

  socket.on("leave-call", ({ to }) => {
    io.to(to).emit("user-left");
  });

  socket.on("typing", ({ to }) => {
    io.to(to).emit("stranger-typing");
  });

  socket.on("send-message", ({ to, message }) => {
    io.to(to).emit("receive-message", message);
  });

  socket.on("disconnect", () => {
    const index = waiting.findIndex((s) => s.id === socket.id);
    if (index !== -1) waiting.splice(index, 1);

    rooms.forEach((users, roomId) => {
      rooms.set(roomId, users.filter((id) => id !== socket.id));
      if (rooms.get(roomId).length === 0) {
        rooms.delete(roomId);
      }
    });

    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

// SERVER: index.js

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Adjust for your frontend domain in production
    methods: ["GET", "POST"],
  },
});

const waitingQueue = [];
const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a public stranger queue
  socket.on("join-stranger-queue", (userName) => {
    socket.data.userName = userName;

    if (waitingQueue.length > 0) {
      const peer = waitingQueue.pop();
      const roomId = `${socket.id}#${peer.id}`;

      socket.join(roomId);
      peer.join(roomId);

      io.to(socket.id).emit("match-found", { id: peer.id, roomId });
      io.to(peer.id).emit("match-found", { id: socket.id, roomId });
    } else {
      waitingQueue.push(socket);
    }
  });

  // Join or create a specific room
  socket.on("join-room", ({ roomId, userName }) => {
    socket.data.userName = userName;
    socket.join(roomId);

    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);

    // Notify all users in the room of the new participant
    socket.to(roomId).emit("user-joined-room", { id: socket.id });
  });

  // WebRTC signaling events
  socket.on("send-offer", ({ offer, to }) => {
    io.to(to).emit("receive-offer", { offer, from: socket.id });
  });

  socket.on("send-answer", ({ answer, to }) => {
    io.to(to).emit("receive-answer", { answer });
  });

  socket.on("send-ice-candidate", ({ candidate, to }) => {
    io.to(to).emit("receive-ice-candidate", { candidate });
  });

  // Chat functionality
  socket.on("typing", ({ to }) => {
    io.to(to).emit("stranger-typing");
  });

  socket.on("send-message", ({ to, message }) => {
    io.to(to).emit("receive-message", { message, from: socket.id });
  });

  socket.on("leave-call", ({ to }) => {
    io.to(to).emit("user-left");
  });

  socket.on("disconnect", () => {
    // Remove from waiting queue if present
    const index = waitingQueue.findIndex((s) => s.id === socket.id);
    if (index !== -1) waitingQueue.splice(index, 1);

    // Clean up from rooms
    for (const [roomId, users] of Object.entries(rooms)) {
      rooms[roomId] = users.filter((id) => id !== socket.id);
      if (rooms[roomId].length === 0) delete rooms[roomId];
      else io.to(roomId).emit("user-left", { id: socket.id });
    }

    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
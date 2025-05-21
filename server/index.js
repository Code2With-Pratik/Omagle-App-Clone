const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const waitingQueue = [];

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("join-stranger", () => {
    if (waitingQueue.length > 0) {
      const peerSocket = waitingQueue.pop();
      socket.partner = peerSocket.id;
      peerSocket.partner = socket.id;

      socket.emit("match-found", { id: peerSocket.id });
      peerSocket.emit("match-found", { id: socket.id });
    } else {
      waitingQueue.push(socket);
    }
  });

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("peer-joined", socket.id);
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
    socket.leaveAll();
  });

  socket.on("typing", ({ to }) => {
    io.to(to).emit("stranger-typing");
  });

  socket.on("send-message", ({ to, message }) => {
    io.to(to).emit("receive-message", message);
  });

  socket.on("disconnect", () => {
    const index = waitingQueue.findIndex((s) => s.id === socket.id);
    if (index !== -1) waitingQueue.splice(index, 1);
    console.log("❌ User disconnected:", socket.id);

    if (socket.partner) {
      io.to(socket.partner).emit("user-left");
    }
  });
});

server.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});

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

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  if (waiting.length > 0) {
    const peer = waiting.pop();
    socket.emit("match-found", peer.id);
    peer.emit("match-found", socket.id);
  } else {
    waiting.push(socket);
  }

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

  // ✅ Typing notification
  socket.on("typing", ({ to }) => {
    io.to(to).emit("stranger-typing");
  });

  // ✅ Text message forwarding
  socket.on("send-message", ({ to, message }) => {
    io.to(to).emit("receive-message", message);
  });

  socket.on("disconnect", () => {
    const index = waiting.findIndex((s) => s.id === socket.id);
    if (index !== -1) waiting.splice(index, 1);
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

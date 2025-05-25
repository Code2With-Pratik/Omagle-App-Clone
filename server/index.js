// server/index.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

// server created using get and post methods


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

let waitingStranger = null;
const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-stranger", (data) => {
    const { name } = data || {};
    if (!name) return;
    socket.data.name = name;

    if (waitingStranger) {
      const otherSocket = waitingStranger;
      waitingStranger = null;

      io.to(socket.id).emit("match-found", {
        id: otherSocket.id,
        name: otherSocket.data.name || "Stranger"
      });
      io.to(otherSocket.id).emit("match-found", {
        id: socket.id,
        name: name || "Stranger"
      });
    } else {
      waitingStranger = socket;
    }
  });

  socket.on("join-room", ({ roomId, name }) => {
    socket.join(roomId);
    socket.data.name = name;
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);
    const others = rooms[roomId].filter(id => id !== socket.id);
    io.to(socket.id).emit("all-users", others);
  });

  socket.on("send-offer", ({ offer, to }) => {
    io.to(to).emit("receive-offer", { offer, from: socket.id });
  });

  socket.on("send-answer", ({ answer, to }) => {
    io.to(to).emit("receive-answer", { answer, from: socket.id });
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

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (waitingStranger && waitingStranger.id === socket.id) {
      waitingStranger = null;
    }
    // Clean up from room list
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

//server running

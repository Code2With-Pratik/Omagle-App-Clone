import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import VideoCall from "../components/VideoCall";
import Chat from "../components/Chat";
import socket from "../socket";

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, name, roomId } = location.state || {};

  useEffect(() => {
    if (mode === "stranger") {
      socket.emit("join-stranger");
    } else if (mode === "room" && roomId) {
      socket.emit("join-room", roomId);
    } else {
      navigate("/"); // fallback to landing page
    }
  }, [mode, roomId, navigate]);

  return (
    <div className="flex h-screen w-screen transition-all duration-300">
      <VideoCall
        toggleChat={() => setIsChatOpen((prev) => !prev)}
        userName={name}
        mode={mode}
        roomId={roomId}
        navigate={navigate}
      />
      <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}

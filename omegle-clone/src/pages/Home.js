import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import VideoCall from "../components/VideoCall";
import Chat from "../components/Chat";

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { state } = location;

  useEffect(() => {
    if (!state) {
      navigate("/"); // Redirect to landing if no data
    }
  }, [state, navigate]);

  if (!state) return null;

  return (
    <div className="flex h-screen w-screen transition-all duration-300">
      <VideoCall
        mode={state.mode}
        name={state.name}
        roomId={state.roomId}
        toggleChat={() => setIsChatOpen((prev) => !prev)}
      />
      <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}

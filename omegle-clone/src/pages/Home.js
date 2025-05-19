// Home.js
import React, { useState } from "react";
import VideoCall from "../components/VideoCall";
import Chat from "../components/Chat";

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen transition-all duration-300">
      <VideoCall toggleChat={() => setIsChatOpen((prev) => !prev)} />
      <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}

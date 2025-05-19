// Home.js
import React, { useState } from "react";
import VideoCall from "../components/VideoCall";
import Chat from "../components/Chat";

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-screen relative overflow-hidden">
      <VideoCall toggleChat={() => setIsChatOpen((prev) => !prev)} />
      <Chat isOpen={isChatOpen} />
    </div>
  );
}

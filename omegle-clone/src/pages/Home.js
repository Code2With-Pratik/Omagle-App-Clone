import React from "react";
import VideoCall from "../components/VideoCall";
import Chat from "../components/Chat";

export default function Home() {
  return (
    <div className="flex flex-col md:flex-row h-screen">
      <VideoCall />
      <Chat />
    </div>
  );
}

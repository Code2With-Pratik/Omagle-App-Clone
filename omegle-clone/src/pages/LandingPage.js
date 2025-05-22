import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/Button';
import { User, Link2 } from "lucide-react";

export default function LandingPage() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const handleTalkToStranger = () => {
    if (!name.trim()) return alert("Enter your name");
    navigate("/home", { state: { mode: "stranger", name } });
  };

  const handleJoinRoom = () => {
    if (!roomId.trim()) return alert("Enter room ID");
    navigate("/home", { state: { mode: "room", roomId } });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#5459fc] to-[#1f1f1f] text-white px-4">
      <div className="text-center mb-10">
        <User className="mx-auto h-16 w-16 text-white-500" />
        <h1 className="text-4xl font-bold mt-4">Welcome to Omegle Clone</h1>
        <p className="mt-2 text-gray-400">Chat with strangers or join a room</p>
      </div>

      <div className="bg-[#1a1a1a] p-6 rounded-2xl shadow-xl w-full max-w-md space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">👤 Talk to a Stranger</h2>
          <Input
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-3"
          />
          <Button onClick={handleTalkToStranger} className="w-full">
            Start Chatting
          </Button>
        </div>

        <div className="text-center text-gray-200 uppercase text-xs">OR</div>

        <div>
          <h2 className="text-xl font-semibold mb-2">🔗 Join a Room</h2>
          <Input
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="mb-3"
          />
          <Button onClick={handleJoinRoom} className="w-full bg-green-600 hover:bg-green-700">
            <Link2 className="mr-2 h-4 w-4" /> Join Room
          </Button>
        </div>
      </div>
    </div>
  );
}
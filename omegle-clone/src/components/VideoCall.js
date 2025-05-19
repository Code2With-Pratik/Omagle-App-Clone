// VideoCall.js
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import defaultAvatar from "../assets/default-avatar.png";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
  FaCommentDots,
} from "react-icons/fa";

// Replace with your server URL
const socket = io("http://localhost:5000");

export default function VideoCall({ toggleChat }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  const [peerConnection, setPeerConnection] = useState(null);
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRemoteVideoAvailable, setIsRemoteVideoAvailable] = useState(false);

  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    setPeerConnection(pc);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!pc || pc.signalingState === "closed") return;

        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      })
      .catch((err) => console.error("Media access error:", err));

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      setIsRemoteVideoAvailable(!!remoteStream.getVideoTracks()[0]?.enabled);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && remoteSocketId) {
        socket.emit("send-ice-candidate", {
          candidate: event.candidate,
          to: remoteSocketId,
        });
      }
    };

    socket.on("match-found", async (id) => {
      setRemoteSocketId(id);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("send-offer", { offer, to: id });
    });

    socket.on("receive-offer", async ({ offer, from }) => {
      setRemoteSocketId(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("send-answer", { answer, to: from });
    });

    socket.on("receive-answer", async ({ answer }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("receive-ice-candidate", async ({ candidate }) => {
      if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      socket.disconnect();
      pc.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMicMuted(!track.enabled);
    }
  };

  const toggleCamera = async () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack?.enabled) {
      videoTrack.enabled = false;
      setIsCameraOff(true);
    } else {
      try {
        videoTrack?.stop();
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = newStream.getVideoTracks()[0];

        if (!peerConnection || peerConnection.signalingState === "closed") return;

        const sender = peerConnection.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(newTrack);

        localStreamRef.current.removeTrack(videoTrack);
        localStreamRef.current.addTrack(newTrack);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }

        setIsCameraOff(false);
      } catch (err) {
        console.error("Camera enable failed:", err);
      }
    }
  };

  const disconnectCall = () => {
    socket.emit("leave-call", { to: remoteSocketId });
    peerConnection?.close();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    window.location.reload();
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Remote video or avatar */}
      <div className="absolute inset-0 flex items-center justify-center bg-black border-2 border-white shadow-lg">
        {!isRemoteVideoAvailable ? (
          <img src={defaultAvatar} alt="User Avatar" className="w-32 sm:w-40 md:w-48 rounded-full opacity-80" />
        ) : (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        )}
      </div>

      {/* Local video */}
      <div className="absolute bottom-5 right-4 w-28 sm:w-40 md:w-44 lg:w-52 h-20 sm:h-28 md:h-32 lg:h-40 rounded-md border-2 border-white shadow-lg bg-black overflow-hidden">
        {isCameraOff ? (
          <img src={defaultAvatar} alt="Your Avatar" className="w-full h-full object-contain rounded-full opacity-80" />
        ) : (
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-6 sm:space-x-8 md:space-x-10 z-10">
        <button onClick={toggleMic} className="bg-gray-800 text-white p-4 sm:p-5 text-xl rounded-full hover:bg-gray-700">
          {isMicMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
        <button onClick={toggleCamera} className="bg-gray-800 text-white p-4 sm:p-5 text-xl rounded-full hover:bg-gray-700">
          {isCameraOff ? <FaVideoSlash /> : <FaVideo />}
        </button>
        <button onClick={toggleChat} className="bg-gray-800 text-white p-4 sm:p-5 text-xl rounded-full hover:bg-gray-700">
          <FaCommentDots />
        </button>
        <button onClick={disconnectCall} className="bg-red-600 text-white p-4 sm:p-5 text-xl rounded-full hover:bg-red-500">
          <FaPhoneSlash />
        </button>
      </div>
    </div>
  );
}

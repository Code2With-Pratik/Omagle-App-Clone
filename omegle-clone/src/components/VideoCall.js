import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import defaultAvatar from "../assets/default-avatar.png";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
} from "react-icons/fa";

// Replace with your server URL
const socket = io("http://localhost:5000");

export default function VideoCall() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  const [peerConnection, setPeerConnection] = useState(null);
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isRemoteVideoAvailable, setIsRemoteVideoAvailable] = useState(false);

  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    setPeerConnection(pc);

   navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then((stream) => {
    if (!pc || pc.signalingState === "closed") {
      console.warn("PeerConnection is closed, cannot add tracks");
      return;
    }


    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });
  })
  .catch((err) => {
    console.error("Error accessing media devices:", err);
  });



    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }

      const videoTrack = remoteStream.getVideoTracks()[0];
      setIsRemoteVideoAvailable(videoTrack?.enabled ?? false);
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
      if (candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.disconnect();
      pc.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const toggleMic = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicMuted(!audioTrack.enabled);
    }
  };

const toggleCamera = async () => {
  const videoTrack = localStreamRef.current?.getVideoTracks()[0];

  if (videoTrack?.enabled) {
    // Disable the track
    videoTrack.enabled = false;
    setIsCameraOff(true);
  } else {
    try {
      // Stop the old track if it exists
      videoTrack?.stop();

      // Request a new video track
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const newVideoTrack = newStream.getVideoTracks()[0];

      // ✅ Guard clause to ensure peerConnection is usable
      if (!peerConnection || peerConnection.signalingState === "closed") {
        console.warn("PeerConnection is closed or unavailable. Skipping track replacement.");
        return;
      }

      // Replace the video track in the peer connection
      const sender = peerConnection
        .getSenders()
        .find((s) => s.track?.kind === "video");
      if (sender) {
        sender.replaceTrack(newVideoTrack);
      }

      // Update local stream reference
      const currentStream = localStreamRef.current;
      if (currentStream) {
        currentStream.removeTrack(videoTrack);
        currentStream.addTrack(newVideoTrack);
      }

      // Set the new stream to the video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }

      setIsCameraOff(false);
    } catch (err) {
      console.error("Failed to re-enable camera:", err);
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
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black border-2 border-white shadow-lg">
        {!isRemoteVideoAvailable ? (
          <img
            src={defaultAvatar}
            alt="User Avatar"
            className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full opacity-80"
          />
        ) : (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Local video (bottom-right corner) */}
      <div className="absolute bottom-5 right-4 w-28 h-20 sm:w-40 sm:h-28 md:w-44 md:h-32 lg:w-52 lg:h-40 rounded-md border-2 border-white shadow-lg bg-black flex items-center justify-center overflow-hidden">
        {isCameraOff ? (
          <img
            src={defaultAvatar}
            alt="Your Avatar"
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full opacity-80"
          />
        ) : (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Control buttons */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-6 sm:space-x-8 md:space-x-10 z-10">
        <button
          onClick={toggleMic}
          className="bg-gray-800 text-white p-4 sm:p-5 text-xl sm:text-2xl rounded-full hover:bg-gray-700 transition"
        >
          {isMicMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
        <button
          onClick={toggleCamera}
          className="bg-gray-800 text-white p-4 sm:p-5 text-xl sm:text-2xl rounded-full hover:bg-gray-700 transition"
        >
          {isCameraOff ? <FaVideoSlash /> : <FaVideo />}
        </button>
        <button
          onClick={disconnectCall}
          className="bg-red-600 text-white p-4 sm:p-5 text-xl sm:text-2xl rounded-full hover:bg-red-500 transition"
        >
          <FaPhoneSlash />
        </button>
      </div>
    </div>
  );
}

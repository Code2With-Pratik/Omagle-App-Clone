import React, { useState, useEffect, useRef } from 'react';
import socket from '../socket';

function Chat({ remoteSocketId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStrangerTyping, setIsStrangerTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on('stranger-typing', () => {
      setIsStrangerTyping(true);
      setTimeout(() => setIsStrangerTyping(false), 2000);
    });

    socket.on('receive-message', (message) => {
      setMessages((prev) => [...prev, { from: 'stranger', text: message }]);
    });

    return () => {
      socket.off('stranger-typing');
      socket.off('receive-message');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStrangerTyping]);

  const handleSendMessage = () => {
    if (!input.trim()) return;
    socket.emit('send-message', { to: remoteSocketId, message: input });
    setMessages((prev) => [...prev, { from: 'you', text: input }]);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // chat UI section 

  return (
    <div className="w-[350px] h-full bg-[#0a0a0b] p-4 text-white flex flex-col justify-between border-l border-gray-700">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-[80%] px-4 py-2 rounded-lg text-sm break-words border-2 border-white shadow-lg ${
              msg.from === 'you'
                ? 'bg-red-600 self-end ml-auto'
                : 'bg-gray-800 self-start mr-auto'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {isStrangerTyping && (
          <div className="text-sm text-gray-400 italic">Stranger is typing...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="flex mt-3 ">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onInput={() => socket.emit("typing", { to: remoteSocketId })}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 p-2 rounded-l-md text-black outline-none"
        />
        <button
          onClick={handleSendMessage}
          className="bg-red-600 px-4 rounded-r-md hover:bg-red-500"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;

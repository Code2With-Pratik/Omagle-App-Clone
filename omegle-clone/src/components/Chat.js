import React, { useState, useEffect, useRef } from 'react';
import socket from '../socket';

function Chat({ isOpen, onClose }) {
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
    socket.emit('send-message', { message: input });
    setMessages((prev) => [...prev, { from: 'you', text: input }]);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  return (
    <div
      className={`
        fixed z-20 bg-[#0a0a0b] text-white border-gray-700 flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 translate-y-0' : 'translate-x-full md:translate-x-full translate-y-full md:translate-y-0'}
        w-full h-[40%] bottom-0 md:w-[350px] md:h-full md:right-0 md:top-0 md:border-l
      `}
    >
      {/* Header with Close Button on Mobile */}
      <div className="flex justify-between items-center p-3 border-b border-gray-700">
        <span className="font-semibold text-white">Chat</span>
        <button
          onClick={onClose}
          className="text-white text-lg p-1 hover:text-red-500"
        >
          ✕   
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 p-4 pr-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-[80%] px-4 py-2 rounded-lg text-sm border-2 shadow-lg break-words ${
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

      {/* Input */}
      <div className="flex p-2 border-t border-gray-600">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onInput={() => socket.emit('typing')}
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

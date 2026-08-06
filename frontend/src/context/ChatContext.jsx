import React, { createContext, useState } from 'react';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { sender: 'bot', text: 'Hi! I am TravelBot. How can I help you plan your Indian adventure today?' }
  ]);

  const toggleChat = () => setIsChatOpen(!isChatOpen);
  
  const addMessage = (msg) => {
    setChatHistory(prev => [...prev, msg]);
  };

  return (
    <ChatContext.Provider value={{ isChatOpen, toggleChat, chatHistory, addMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

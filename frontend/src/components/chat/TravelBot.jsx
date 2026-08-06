import React, { useContext, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatContext } from '../../context/ChatContext';
import { FiMessageSquare, FiX, FiSend } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../../utils/api';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './TravelBot.css';

const TravelBot = () => {
  const { isChatOpen, toggleChat, chatHistory, addMessage } = useContext(ChatContext);
  const { fetchUser } = useContext(AuthContext);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const location = useLocation();

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) scrollToBottom();
  }, [chatHistory, isChatOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    addMessage({ sender: 'user', text: userMsg });
    setIsLoading(true);

    try {
      const queryParams = new URLSearchParams(location.search);
      const ctxParam = queryParams.get('context');
      const currentSubject = ctxParam ? decodeURIComponent(ctxParam) : undefined;
      const res = await api.post('/chatbot/message', {
        message: userMsg,
        context: { pageContext: location.pathname, currentSubject }
      });
      // Remove markdown strikethrough (~~text~~) before displaying
      const rawReply = res.data.reply;
      const cleanedReply = rawReply.replace(/~~([^~]+)~~/g, '$1');
      // If the reply indicates no data for the current destination, inform the user clearly
      const finalReply = (!cleanedReply.trim() || /no information|not found|unavailable|sorry/i.test(cleanedReply))
        ? `Sorry, I don't have information about "${currentSubject || 'this location'}" at the moment.`
        : cleanedReply;
      addMessage({ sender: 'bot', text: finalReply });
      if (fetchUser) fetchUser(); // live refresh credit
    } catch (err) {
      addMessage({ sender: 'bot', text: 'Sorry, I am having trouble connecting to my AI brain right now.' });
    }
    setIsLoading(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isChatOpen && (
        <motion.button 
          className="travelbot-fab"
          onClick={toggleChat}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FiMessageSquare size={24} />
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            className="travelbot-window glass-card"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="travelbot-header">
              <div className="travelbot-title">
                <span className="bot-avatar">🤖</span>
                <div>
                  <h4>TravelBot</h4>
                  <p>AI Travel Assistant</p>
                </div>
              </div>
              <button onClick={toggleChat} className="close-btn"><FiX size={20} /></button>
            </div>

            <div className="travelbot-messages">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`message-bubble ${msg.sender}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>
              ))}
              {isLoading && (
                <div className="message-bubble bot typing">
                  <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSend} className="travelbot-input">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about destinations..."
                disabled={isLoading}
              />
              <button type="submit" disabled={!input.trim() || isLoading}>
                <FiSend />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TravelBot;

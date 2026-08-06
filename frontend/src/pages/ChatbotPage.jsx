import React, { useState, useRef, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSend, FiTrash2, FiMapPin, FiDollarSign, FiShield, FiArrowLeft } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import AuthGate from '../components/common/AuthGate';
import './ChatbotPage.css';

const QUICK_PROMPTS = [
  { icon: '🏔️', text: "Best hill stations in India" },
  { icon: '🏖️', text: "Top beaches under ₹3000/day" },
  { icon: '🛕', text: "Must-visit temples in South India" },
  { icon: '🎒', text: "Solo travel tips for Rajasthan" },
  { icon: '🍛', text: "Cities with the best street food" },
  { icon: '🏕️', text: "Adventure spots for trekking" },
];

const ChatbotPage = () => {
  const { user, fetchUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (text) => {
    const msgText = text || input.trim();
    if (!msgText) return;

    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: msgText }]);
    setIsLoading(true);

    try {
      const res = await api.post('/chatbot/message', {
        message: msgText,
        context: { 
          pageContext: '/chatbot',
          userName: user?.name || 'Traveler',
          preferences: user?.preferences || {},
        }
      });
      setMessages(prev => [...prev, { sender: 'bot', text: res.data.reply }]);
      if (fetchUser) fetchUser();
    } catch (err) {
      if (err.response?.status === 402) {
        setMessages(prev => [...prev, { 
          sender: 'bot', 
          text: `**Out of Credits!** 🚫\n\n${err.response.data.message}`
        }]);
      } else {
        setMessages(prev => [...prev, { 
          sender: 'bot', 
          text: "I'm having trouble connecting right now. This usually means the API server isn't running yet. Please start the server with `npm run dev` in the `/server` directory." 
        }]);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const contextCity = params.get('context');
    const auto = params.get('auto');
    
    if (contextCity && messages.length === 0) {
      setMessages([
        { sender: 'bot', text: `Hi! I see you're interested in **${contextCity}**. How can I help you plan your trip there?` }
      ]);
      
      if (auto === 'true') {
        handleSend(`Plan a 2-day trip to ${contextCity} with a balanced budget and safe places to visit.`);
      }
    } else if (messages.length === 0) {
      setMessages([
        { sender: 'bot', text: "Hey there! 👋 I'm **TravelBot**, your AI travel companion for India.\n\nI can help you with:\n• 🏙️ Destination recommendations\n• 💰 Budget planning\n• 🛡️ Safety information\n• 🗺️ Route suggestions\n• 📸 Landmark identification\n\nWhat would you like to explore today?" }
      ]);
    }
  }, [location.search]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const handleClear = () => {
    setMessages([{ sender: 'bot', text: "Chat cleared! How can I help you plan your next adventure? 🌍" }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Markdown rendering is now handled by ReactMarkdown directly below.

  return (
    <AuthGate mode="page" action="access the AI TravelBot">
      <div className="page-container chatbot-page">
      <div className="chatbot-layout">
        {/* Sidebar */}
        <div className="chatbot-sidebar">
          <div className="sidebar-header" style={{ position: 'relative' }}>
            <button 
              className="btn btn-sm btn-outline-secondary mb-3" 
              onClick={() => navigate(-1)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.5rem' }}
            >
              <FiArrowLeft size={14} /> Back
            </button>
            <h2>🤖 TravelBot</h2>
            <p className="text-muted">AI-Powered Assistant</p>
          </div>
          
          <div className="sidebar-section">
            <h4>Quick Prompts</h4>
            <div className="quick-prompts">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button 
                  key={i} 
                  className="quick-prompt-btn"
                  onClick={() => handleSend(prompt.text)}
                  disabled={isLoading}
                >
                  <span>{prompt.icon}</span> {prompt.text}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h4>Capabilities</h4>
            <ul className="cap-list">
              <li><FiMapPin size={14} /> Destination recommendations</li>
              <li><FiDollarSign size={14} /> Budget estimation</li>
              <li><FiShield size={14} /> Safety information</li>
            </ul>
          </div>
          
          <button className="clear-btn" onClick={handleClear}>
            <FiTrash2 size={14} /> Clear Chat
          </button>
        </div>

        {/* Chat Area */}
        <div className="chatbot-main glass-card">
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <motion.div 
                key={i} 
                className={`chat-msg ${msg.sender}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="msg-avatar">
                  {msg.sender === 'bot' ? '🤖' : (user?.name?.[0]?.toUpperCase() || '👤')}
                </div>
                <div className="msg-content">
                  <div className="msg-sender">{msg.sender === 'bot' ? 'TravelBot' : (user?.name || 'You')}</div>
                  <div className="msg-text">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div className="chat-msg bot" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="msg-avatar">🤖</div>
                <div className="msg-content">
                  <div className="msg-sender">TravelBot</div>
                  <div className="msg-text typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            <div className="chat-input-wrapper">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about destinations, budgets, routes..."
                rows="1"
                disabled={isLoading}
              />
              <button 
                className="send-btn" 
                onClick={() => handleSend()} 
                disabled={!input.trim() || isLoading}
              >
                <FiSend size={18} />
              </button>
            </div>
            <p className="input-hint">Press Enter to send • Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </div>
    </AuthGate>
  );
};

export default ChatbotPage;

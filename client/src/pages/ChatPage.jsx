import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FiSend, FiPlus, FiMessageSquare, FiSettings, FiHome } from 'react-icons/fi';

const API_URL = '/api/chat';

function ChatPage() {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(() => {
    return localStorage.getItem('kotakbas_userId') || null;
  });
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (userId) {
      loadChats();
    }
  }, [userId]);

  useEffect(() => {
    if (currentChat) {
      loadChatMessages(currentChat);
    }
  }, [currentChat]);

  const loadChats = async () => {
    try {
      const res = await fetch(`${API_URL}/user/${userId}`);
      const data = await res.json();
      setChats(data);
    } catch (error) {
      console.error('Не удалось загрузить чаты:', error);
    }
  };

  const loadChatMessages = async (chatId) => {
    try {
      const res = await fetch(`${API_URL}/${chatId}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Не удалось загрузить сообщения:', error);
    }
  };

  const createNewChat = () => {
    setCurrentChat(null);
    setMessages([]);
  };

  const selectChat = (chatId) => {
    setCurrentChat(chatId);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    const newMessage = { role: 'user', content: userMessage, isAiGenerated: false };
    setMessages(prev => [...prev, newMessage]);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: currentChat,
          message: userMessage,
          userId: userId
        })
      });

      const data = await res.json();
      
      if (!userId && data.userId) {
        localStorage.setItem('kotakbas_userId', data.userId);
        setUserId(data.userId);
      }

      if (!currentChat && data.chatId) {
        setCurrentChat(data.chatId);
      }

      const aiMessage = { role: 'assistant', content: data.message, isAiGenerated: true };
      setMessages(prev => [...prev, aiMessage]);

      if (data.userId || !currentChat) {
        loadChats();
      }
    } catch (error) {
      console.error('Не удалось отправить сообщение:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Извините, произошла ошибка. Пожалуйста, попробуйте снова.', 
        isAiGenerated: true 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h4>
            <span className="logo-icon">🧊</span>
            KotakbasAI
          </h4>
          <p>Ваш персональный ассистент</p>
        </div>
        <button className="new-chat-btn" onClick={createNewChat}>
          <FiPlus size={20} strokeWidth={2.5} />
          Новый чат
        </button>
        <div className="chat-list">
          {chats.map(chat => (
            <div
              key={chat._id}
              className={`chat-item ${currentChat === chat._id ? 'active' : ''}`}
              onClick={() => selectChat(chat._id)}
            >
              {chat.title}
            </div>
          ))}
          {chats.length === 0 && (
            <p style={{ padding: '24px', color: '#555', textAlign: 'center', fontSize: '0.9rem' }}>
              История чатов пуста
            </p>
          )}
        </div>
        <Link to="/admin" className="admin-link">
          <FiSettings size={18} />
          Панель администратора
        </Link>
      </div>

      {/* Main Chat Area */}
      <div className="chat-area">
        <div className="chat-header">
          <h5>
            <span className="status-dot"></span>
            {currentChat ? 'Чат' : 'KotakbasAI'}
          </h5>
          <span style={{ color: '#555', fontSize: '0.85rem' }}>
            {messages.length} сообщений
          </span>
        </div>

        <div className="messages-container" ref={messagesContainerRef}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧊</div>
              <h2>Добро пожаловать</h2>
              <p>Я KotakbasAI — ваш умный помощник. Задайте любой вопрос, и я с радостью помогу!</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-content-wrapper">
                  <div className="message-role">
                    {msg.role === 'user' ? (
                      <>👤 Вы</>
                    ) : (
                      <>🤖 KotakbasAI</>
                    )}
                  </div>
                  <div className="message-content">
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="message assistant">
              <div className="message-content-wrapper">
                <div className="message-role">
                  🤖 KotakbasAI
                </div>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <form className="input-form" onSubmit={sendMessage}>
            <div className="input-wrapper">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Напишите сообщение..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
              />
            </div>
            <button type="submit" disabled={!input.trim()}>
              <FiSend size={18} strokeWidth={2.5} />
              {loading ? 'Печать...' : 'Отправить'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;

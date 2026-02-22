import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FiSend, FiPlus, FiMessageSquare, FiSettings, FiHome, FiMenu, FiX, FiSend as FiSendIcon } from 'react-icons/fi';
import { io } from 'socket.io-client';

const API_URL = '/api/chat';
const SOCKET_URL = window.location.origin;

function ChatPage() {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(() => {
    return localStorage.getItem('kotakbas_userId') || null;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const socketRef = useRef(null);
  const userIdRef = useRef(userId);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);

  // Keep userIdRef in sync
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket connection - only reconnect when userId changes
  useEffect(() => {
    if (!userId) return;

    console.log('🔌 Initializing WebSocket for userId:', userId);

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Connect to WebSocket
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: false
    });

    socketRef.current.on('connect', () => {
      console.log('✅ WebSocket connected:', socketRef.current.id);
      // Join user room
      socketRef.current.emit('user:join', userId);
    });

    // Listen for new messages from server
    socketRef.current.on('chat:new_message', (data) => {
      console.log('📥 Received new_message:', data);
      // Only add message if it has content
      if (data.message && data.message.content) {
        setMessages(prev => {
          // Check if message already exists (prevent duplicates)
          const exists = prev.some(m => 
            m.role === data.message.role && 
            m.content === data.message.content
          );
          if (!exists) {
            console.log('➕ Adding new message to state');
            return [...prev, { ...data.message, createdAt: new Date(data.message.createdAt) }];
          }
          console.log('⏭️ Message already exists, skipping');
          return prev;
        });
        setLoading(false);
      }
    });

    // Listen for chat list updates
    socketRef.current.on('chat:list_updated', () => {
      console.log('📥 Received list_updated - reloading chats');
      loadChats();
    });

    socketRef.current.on('connect_error', (error) => {
      console.warn('⚠️ WebSocket connection error:', error.message);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
    });

    return () => {
      if (socketRef.current) {
        console.log('🧹 Cleaning up WebSocket connection');
        socketRef.current.off('connect');
        socketRef.current.off('chat:new_message');
        socketRef.current.off('chat:list_updated');
        socketRef.current.off('connect_error');
        socketRef.current.off('disconnect');
        // Don't disconnect on unmount - keep connection alive
      }
    };
  }, [userId]); // Only depend on userId, NOT currentChat

  // Reconnect WebSocket when userId changes
  useEffect(() => {
    if (userId && socketRef.current?.connected) {
      socketRef.current.emit('user:join', userId);
    }
  }, [userId]);

  // Periodic chat list sync (fallback + keep updated)
  useEffect(() => {
    if (!userId) return;

    // Initial load
    loadChats();

    // Poll every 10 seconds for chat list updates
    const intervalId = setInterval(() => {
      loadChats();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [userId]);

  useEffect(() => {
    if (currentChat) {
      loadChatMessages(currentChat);
    } else {
      // If no current chat, clear messages
      setMessages([]);
    }
  }, [currentChat]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

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
      if (!res.ok) {
        throw new Error('Failed to load chat');
      }
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Не удалось загрузить сообщения:', error);
      setMessages([]);
    }
  };

  const createNewChat = () => {
    setCurrentChat(null);
    setMessages([]);
  };

  const selectChat = (chatId) => {
    setCurrentChat(chatId);
    // Messages will be loaded by useEffect
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

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

      // Handle new userId if this is first message
      if (!userId && data.userId) {
        console.log('🆕 Received new userId from server:', data.userId);
        localStorage.setItem('kotakbas_userId', data.userId);
        setUserId(data.userId);
        // Rejoin room with new userId
        if (socketRef.current?.connected) {
          socketRef.current.emit('user:join', data.userId);
        }
      }

      if (!currentChat && data.chatId) {
        setCurrentChat(data.chatId);
      }

      // Add AI response if received (WebSocket will also send it)
      if (data.message && data.message !== null) {
        const aiMessage = { role: 'assistant', content: data.message, isAiGenerated: true, createdAt: new Date() };
        setMessages(prev => {
          const exists = prev.some(m => m.role === aiMessage.role && m.content === aiMessage.content);
          if (!exists) {
            return [...prev, aiMessage];
          }
          return prev;
        });
      }

      // Always reload chats to get updated list
      loadChats();
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
      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)} />

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <h4>
            <FiMessageSquare size={24} />
            KotakbasAI
          </h4>
          <button className="close-menu-btn" onClick={() => setMobileMenuOpen(false)}>
            <FiX size={24} />
          </button>
        </div>
        <button className="new-chat-btn mobile-new-chat" onClick={() => { createNewChat(); setMobileMenuOpen(false); }}>
          <FiPlus size={20} strokeWidth={2.5} />
          Новый чат
        </button>
        <div className="chat-list">
          {chats.map(chat => (
            <div
              key={chat._id}
              className={`chat-item ${currentChat === chat._id ? 'active' : ''}`}
              onClick={() => { selectChat(chat._id); setMobileMenuOpen(false); }}
            >
              <FiMessageSquare size={16} />
              {chat.title}
            </div>
          ))}
          {chats.length === 0 && (
            <p style={{ padding: '24px', color: '#555', textAlign: 'center', fontSize: '0.9rem' }}>
              История чатов пуста
            </p>
          )}
        </div>
        <Link to="/admin" className="admin-link" onClick={() => setMobileMenuOpen(false)}>
          <FiSettings size={18} />
        </Link>
      </div>

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h4>
            <FiMessageSquare size={24} />
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
              <FiMessageSquare size={16} />
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
        </Link>
      </div>

      {/* Main Chat Area */}
      <div className="chat-area">
        <div className="chat-header">
          <button className="menu-toggle-btn" onClick={() => setMobileMenuOpen(true)}>
            <FiMenu size={24} />
          </button>
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
              <div className="empty-state-icon"><FiMessageSquare size={80} /></div>
              <h2>Добро пожаловать</h2>
              <p>Я KotakbasAI — ваш умный помощник. Задайте любой вопрос, и я с радостью помогу!</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-content-wrapper">
                  <div className="message-role">
                    {msg.role === 'user' ? (
                      <><FiMessageSquare size={14} /> Вы</>
                    ) : (
                      <><FiSend size={14} /> KotakbasAI</>
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
                  <FiSend size={14} /> KotakbasAI
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
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Напишите сообщение..."
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
              />
            </div>
            <button type="submit" disabled={!input.trim()}>
              <FiSendIcon size={20} strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;

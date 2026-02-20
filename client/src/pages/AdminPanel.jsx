import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FiSettings, FiMessageSquare, FiLock, FiLogOut, FiHome, FiSend, FiTrash2, FiSave, FiEdit2, FiCheck } from 'react-icons/fi';

const API_URL = '/api/admin';
const ADMIN_PASSWORD = encodeURIComponent('Жопа');

function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('kotakbas_admin_auth') === 'true';
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [activeTab, setActiveTab] = useState('settings');
  const [settings, setSettings] = useState({
    systemPrompt: '',
    aiModel: 'meta-llama/llama-3.2-3b-instruct:free',
    maxTokens: 4000
  });
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (selectedChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedChat?.messages]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'chats') {
      loadChats();
    }
  }, [isAuthenticated, activeTab]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'Жопа') {
      localStorage.setItem('kotakbas_admin_auth', 'true');
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Неверный пароль');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('kotakbas_admin_auth');
    setIsAuthenticated(false);
  };

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings`, {
        headers: { 'x-admin-password': ADMIN_PASSWORD }
      });
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Не удалось загрузить настройки:', error);
    }
  };

  const loadChats = async () => {
    try {
      const res = await fetch(`${API_URL}/chats`, {
        headers: { 'x-admin-password': ADMIN_PASSWORD }
      });
      const data = await res.json();
      setChats(data);
    } catch (error) {
      console.error('Не удалось загрузить чаты:', error);
    }
  };

  const loadChatDetails = async (chatId) => {
    try {
      const res = await fetch(`${API_URL}/chats/${chatId}`, {
        headers: { 'x-admin-password': ADMIN_PASSWORD }
      });
      const data = await res.json();
      setSelectedChat(data);
    } catch (error) {
      console.error('Не удалось загрузить чат:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': ADMIN_PASSWORD
        },
        body: JSON.stringify(settings)
      });
      await res.json();
      showNotification('Настройки сохранены!', 'success');
    } catch (error) {
      console.error('Не удалось сохранить настройки:', error);
      showNotification('Не удалось сохранить настройки', 'error');
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedChat) return;

    setSending(true);
    try {
      const res = await fetch(`${API_URL}/chats/${selectedChat._id}/reply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': ADMIN_PASSWORD
        },
        body: JSON.stringify({ message: replyMessage })
      });
      await res.json();
      showNotification('Ответ отправлен!', 'success');
      setReplyMessage('');
      loadChatDetails(selectedChat._id);
      loadChats();
    } catch (error) {
      console.error('Не удалось отправить ответ:', error);
      showNotification('Не удалось отправить ответ', 'error');
    } finally {
      setSending(false);
    }
  };

  const deleteChat = async (chatId, e) => {
    e.stopPropagation();
    if (!confirm('Вы уверены, что хотите удалить этот чат?')) return;

    try {
      await fetch(`${API_URL}/chats/${chatId}`, { 
        method: 'DELETE',
        headers: { 'x-admin-password': ADMIN_PASSWORD }
      });
      loadChats();
      if (selectedChat?._id === chatId) {
        setSelectedChat(null);
      }
      showNotification('Чат удалён!', 'success');
    } catch (error) {
      console.error('Не удалось удалить чат:', error);
      showNotification('Не удалось удалить чат', 'error');
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  if (!isAuthenticated) {
    return (
      <div className="login-modal">
        <div className="login-card">
          <h2><FiLock size={28} /> Вход</h2>
          <p>Введите пароль администратора</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="🔒 Пароль"
              autoFocus
            />
            <button type="submit">
              <FiCheck size={18} /> Войти
            </button>
          </form>
          {loginError && <p className="error">⚠️ {loginError}</p>}
          <Link to="/" style={{ display: 'block', marginTop: '24px', color: '#00d9a5', textDecoration: 'none', fontWeight: '500' }}>
            ← Вернуться к чату
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.type === 'success' ? '✓' : '✕'} {notification.message}
        </div>
      )}

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h4>
            <span className="logo-icon">⚙️</span>
            Админ-панель
          </h4>
          <p>Управление KotakbasAI</p>
        </div>
        <div className="chat-list" style={{ padding: '12px' }}>
          <div
            className={`chat-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FiSettings size={18} /> Настройки
          </div>
          <div
            className={`chat-item ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('chats')}
          >
            <FiMessageSquare size={18} /> Все чаты
          </div>
        </div>
        <div style={{ marginTop: 'auto' }}>
          <Link to="/" className="admin-link">
            <FiHome size={18} />
            К чату
          </Link>
          <div 
            className="admin-link" 
            onClick={handleLogout}
            style={{ cursor: 'pointer', borderTop: '1px solid #2a2a2a' }}
          >
            <FiLogOut size={18} />
            Выйти
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="chat-area">
        <div className="chat-header">
          <h5>
            {activeTab === 'settings' ? (
              <><FiSettings /> Настройки</>
            ) : (
              <><FiMessageSquare /> Все чаты</>
            )}
          </h5>
        </div>

        {activeTab === 'settings' && (
          <div className="admin-content">
            <div className="settings-form">
              <label>
                <FiEdit2 style={{ display: 'inline', marginRight: '6px' }} />
                Системный промт
              </label>
              <textarea
                value={settings.systemPrompt}
                onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                placeholder="Введите системный промт для ИИ..."
              />
              <small>
                Этот промт определяет поведение ИИ и то, как он отвечает пользователям.
              </small>

              <label>
                Модель ИИ
              </label>
              <input
                type="text"
                value={settings.aiModel}
                onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                placeholder="meta-llama/llama-3.2-3b-instruct:free"
              />

              <label>
                Максимум токенов
              </label>
              <input
                type="number"
                value={settings.maxTokens}
                onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                placeholder="4000"
              />

              <button
                className="btn-primary"
                onClick={saveSettings}
                disabled={saving}
              >
                <FiSave size={18} />
                {saving ? 'Сохранение...' : 'Сохранить настройки'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'chats' && (
          <div className="admin-content">
            <div className="chats-layout">
              {/* Chats List */}
              <div className="chats-sidebar">
                {chats.map(chat => (
                  <div
                    key={chat._id}
                    className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
                    onClick={() => loadChatDetails(chat._id)}
                    style={{ justifyContent: 'space-between' }}
                  >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {chat.title}
                    </span>
                    <button
                      className="btn-danger"
                      onClick={(e) => deleteChat(chat._id, e)}
                      style={{ marginLeft: '8px', flexShrink: 0 }}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
                {chats.length === 0 && (
                  <p style={{ padding: '24px', color: '#555', textAlign: 'center', fontSize: '0.9rem' }}>
                    Нет чатов
                  </p>
                )}
              </div>

              {/* Chat Details */}
              <div className="chat-detail">
                {selectedChat ? (
                  <>
                    <div className="chat-detail-header">
                      <strong>{selectedChat.title}</strong>
                      <span style={{ color: '#666', fontSize: '0.85rem' }}>
                        👤 {selectedChat.userId} • 💬 {selectedChat.messages.length}
                      </span>
                    </div>

                    <div className="chat-detail-messages">
                      {selectedChat.messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`message ${msg.role}`}
                          style={{
                            background: msg.role === 'user' ? '#1a1a1a' : 
                                       msg.isAiGenerated ? '#0f0f0f' : '#1a1500',
                            marginBottom: '16px',
                            padding: '14px 18px',
                            borderRadius: '14px',
                            border: msg.isAiGenerated ? '1px solid #2a2a2a' : 'none'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div className="message-role" style={{ marginBottom: '6px' }}>
                              {msg.role === 'user' ? '👤 Пользователь' : '🤖 Ассистент'}
                              {!msg.isAiGenerated && msg.role === 'assistant' && (
                                <span className="badge badge-warning">
                                  Ответ админа
                                </span>
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
                            <small style={{ color: '#555', display: 'block', marginTop: '10px', fontSize: '0.8rem' }}>
                              {new Date(msg.createdAt).toLocaleString('ru-RU')}
                            </small>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Admin Reply Input */}
                    <div className="chat-detail-reply">
                      <label>
                        <FiSend style={{ display: 'inline', marginRight: '6px' }} />
                        Ответить от имени ИИ
                      </label>
                      <input
                        type="text"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Введите ваш ответ..."
                        onKeyPress={(e) => e.key === 'Enter' && sendReply()}
                      />
                      <div className="reply-actions">
                        <button
                          className="btn-success"
                          onClick={sendReply}
                          disabled={sending || !replyMessage.trim()}
                        >
                          <FiSend size={16} />
                          {sending ? 'Отправка...' : 'Отправить'}
                        </button>
                      </div>
                      <small>
                        Это сообщение появится у пользователя как ответ от ИИ.
                      </small>
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">💬</div>
                    <h2>Выберите чат</h2>
                    <p>Выберите чат из списка слева, чтобы просмотреть переписку и ответить</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;

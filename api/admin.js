const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Жопа';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  isAiGenerated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, default: 'New Chat' },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const settingsSchema = new mongoose.Schema({
  systemPrompt: { type: String, default: 'Вы - полезный ассистент' },
  aiModel: { type: String, default: 'meta-llama/llama-3.2-3b-instruct:free' },
  maxTokens: { type: Number, default: 4000 },
  updatedAt: { type: Date, default: Date.now }
});

let Chat, Settings;

async function initDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
    Chat = mongoose.model('Chat', chatSchema);
    Settings = mongoose.model('Settings', settingsSchema);
  }
  return { Chat, Settings };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Неверный пароль' });
  }

  try {
    const { Chat, Settings } = await initDB();

    if (req.method === 'GET' && req.url.includes('/settings')) {
      let settings = await Settings.findOne();
      if (!settings) {
        settings = new Settings();
        await settings.save();
      }
      return res.status(200).json(settings);
    }

    if (req.method === 'PUT' && req.url.includes('/settings')) {
      const { systemPrompt, aiModel, maxTokens } = req.body;
      let settings = await Settings.findOne();
      if (!settings) {
        settings = new Settings({ systemPrompt, aiModel, maxTokens });
      } else {
        if (systemPrompt !== undefined) settings.systemPrompt = systemPrompt;
        if (aiModel !== undefined) settings.aiModel = aiModel;
        if (maxTokens !== undefined) settings.maxTokens = maxTokens;
      }
      await settings.save();
      return res.status(200).json(settings);
    }

    if (req.method === 'GET' && !req.url.includes('/reply')) {
      const { id } = req.query;
      if (id) {
        const chat = await Chat.findOne({ _id: id });
        if (!chat) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(chat);
      }
      const chats = await Chat.find().sort({ updatedAt: -1 });
      return res.status(200).json(chats);
    }

    if (req.method === 'POST' && req.url.includes('/reply')) {
      const { message } = req.body;
      const chatId = req.query.id;
      if (!message) return res.status(400).json({ error: 'Message required' });
      const chat = await Chat.findOne({ _id: chatId });
      if (!chat) return res.status(404).json({ error: 'Not found' });
      chat.messages.push({ role: 'assistant', content: message, isAiGenerated: false });
      await chat.save();
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const chatId = req.query.id;
      await Chat.deleteOne({ _id: chatId });
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });

  } catch (error) {
    console.error('Admin API Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

const Settings = require('../server/models/Settings');
const Chat = require('../server/models/Chat');
const mongoose = require('mongoose');

const ADMIN_PASSWORD = 'Жопа';

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check admin password
  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Неверный пароль' });
  }

  try {
    await connectDB();

    // GET /api/admin/settings
    if (req.method === 'GET' && req.url.includes('/settings')) {
      let settings = await Settings.findOne();
      if (!settings) {
        settings = new Settings();
        await settings.save();
      }
      return res.status(200).json(settings);
    }

    // PUT /api/admin/settings
    if (req.method === 'PUT' && req.url.includes('/settings')) {
      const { systemPrompt, aiModel, maxTokens } = req.body;
      
      let settings = await Settings.findOne();
      if (!settings) {
        settings = new Settings({ systemPrompt, aiModel, maxTokens });
      } else {
        if (systemPrompt !== undefined) settings.systemPrompt = systemPrompt;
        if (aiModel !== undefined) settings.aiModel = aiModel;
        if (maxTokens !== undefined) settings.maxTokens = maxTokens;
        settings.updatedAt = Date.now();
      }
      
      await settings.save();
      return res.status(200).json(settings);
    }

    // GET /api/admin/chats
    if (req.method === 'GET') {
      const chats = await Chat.find()
        .sort({ updatedAt: -1 })
        .select('_id userId title messages createdAt updatedAt');
      return res.status(200).json(chats);
    }

    // GET /api/admin/chats/:id
    if (req.method === 'GET' && req.query.id) {
      const chat = await Chat.findOne({ _id: req.query.id });
      if (!chat) {
        return res.status(404).json({ error: 'Чат не найден' });
      }
      return res.status(200).json(chat);
    }

    // POST /api/admin/chats/:id/reply
    if (req.method === 'POST' && req.url.includes('/reply')) {
      const { message } = req.body;
      const chatId = req.query.id;
      
      if (!message) {
        return res.status(400).json({ error: 'Сообщение обязательно' });
      }

      const chat = await Chat.findOne({ _id: chatId });
      if (!chat) {
        return res.status(404).json({ error: 'Чат не найден' });
      }

      chat.messages.push({
        role: 'assistant',
        content: message,
        isAiGenerated: false
      });

      await chat.save();

      return res.status(200).json({ success: true, message: 'Ответ отправлен успешно' });
    }

    // DELETE /api/admin/chats/:id
    if (req.method === 'DELETE' && req.query.id) {
      await Chat.deleteOne({ _id: req.query.id });
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });

  } catch (error) {
    console.error('Vercel Admin API error:', error);
    return res.status(500).json({ error: 'Failed to process request', details: error.message });
  }
}

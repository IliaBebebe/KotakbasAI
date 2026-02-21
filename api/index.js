const mongoose = require('mongoose');
const axios = require('axios');

const MONGODB_URI = process.env.MONGODB_URI;
const AI_API_KEY = process.env.AI_API_KEY;
const AI_API_URL = process.env.AI_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
const AI_MODEL = process.env.AI_MODEL || 'meta-llama/llama-3.2-3b-instruct:free';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Жопа';

// MongoDB Schema
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
  systemPrompt: { type: String, default: 'Вы - полезный ассистент с искусственным интеллектом по имени KotakbasAI.' },
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

async function getAiResponse(messages, settings) {
  const FREE_MODELS = [
    'meta-llama/llama-3.2-3b-instruct:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
    'stepfun/step-3.5-flash:free'
  ];

  const systemPrompt = settings?.systemPrompt || 'Вы - полезный ассистент с искусственным интеллектом по имени KotakbasAI.';
  const model = settings?.aiModel || AI_MODEL;
  const modelsToTry = [model, ...FREE_MODELS.filter(m => m !== model)];

  for (const modelToTry of modelsToTry) {
    try {
      const response = await axios.post(
        AI_API_URL,
        {
          model: modelToTry,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content }))
          ],
          max_tokens: settings?.maxTokens || 4000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_API_KEY}`,
            'HTTP-Referer': 'https://kotakbasai.vercel.app',
            'X-Title': 'KotakbasAI'
          }
        }
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      if (error.response?.status === 429) continue;
      throw error;
    }
  }
  return 'Извините, но в данный момент я испытываю технические трудности.';
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { Chat, Settings } = await initDB();

    // CHAT API
    if (req.method === 'POST') {
      const { chatId, message, userId } = req.body;
      if (!message) return res.status(400).json({ error: 'Message required' });

      let chat;
      const newUserId = userId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      if (chatId) {
        chat = await Chat.findOne({ _id: chatId });
        if (!chat) return res.status(404).json({ error: 'Chat not found' });
      } else {
        chat = new Chat({ userId: newUserId });
      }

      chat.messages.push({ role: 'user', content: message, isAiGenerated: false });
      if (chat.messages.length === 1) {
        chat.title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
      }

      const settings = await Settings.findOne();
      const aiResponse = await getAiResponse(chat.messages, settings);

      chat.messages.push({ role: 'assistant', content: aiResponse, isAiGenerated: true });
      await chat.save();

      return res.status(200).json({ chatId: chat._id.toString(), userId: chat.userId, message: aiResponse });
    }

    if (req.method === 'GET') {
      const { id } = req.query;
      if (id) {
        const chat = await Chat.findOne({ _id: id });
        if (!chat) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(chat);
      }
      const chats = await Chat.find().sort({ updatedAt: -1 }).limit(100);
      return res.status(200).json(chats);
    }

  } catch (error) {
    console.error('API Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

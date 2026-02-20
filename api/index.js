const Chat = require('../server/models/Chat');
const Settings = require('../server/models/Settings');
const { getAiResponse } = require('../server/services/ai');
const mongoose = require('mongoose');

// Initialize MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    if (req.method === 'POST') {
      const { chatId, message, userId } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      let chat;
      const newUserId = userId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (chatId) {
        chat = await Chat.findOne({ _id: chatId });
        if (!chat) {
          return res.status(404).json({ error: 'Chat not found' });
        }
      } else {
        chat = new Chat({ userId: newUserId });
      }

      // Add user message
      chat.messages.push({
        role: 'user',
        content: message,
        isAiGenerated: false
      });

      // Update title if first message
      if (chat.messages.length === 1) {
        chat.title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
      }

      // Get AI response
      const aiResponse = await getAiResponse(chat.messages);
      
      // Add AI message
      chat.messages.push({
        role: 'assistant',
        content: aiResponse,
        isAiGenerated: true
      });

      await chat.save();

      return res.status(200).json({
        chatId: chat._id,
        userId: chat.userId,
        message: aiResponse
      });
    }

    if (req.method === 'GET') {
      const { id } = req.query;
      
      if (id) {
        const chat = await Chat.findOne({ _id: id });
        if (!chat) {
          return res.status(404).json({ error: 'Chat not found' });
        }
        return res.status(200).json(chat);
      }
      
      const chats = await Chat.find()
        .sort({ updatedAt: -1 })
        .limit(100)
        .select('_id userId title createdAt updatedAt');
      return res.status(200).json(chats);
    }

  } catch (error) {
    console.error('Vercel API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process message',
      details: error.message 
    });
  }
}

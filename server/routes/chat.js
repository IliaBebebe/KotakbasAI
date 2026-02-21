const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const { getAiResponse } = require('../services/ai');

// Create new chat or get existing
router.post('/', async (req, res) => {
  try {
    const { chatId, message, userId } = req.body;
    
    console.log('Received request:', { chatId, message, userId });
    
    if (!message) {
      return res.status(400).json({ error: 'Сообщение обязательно' });
    }

    let chat;
    const newUserId = userId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId });
      if (!chat) {
        return res.status(404).json({ error: 'Чат не найден' });
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

    console.log('Getting AI response...');
    // Get AI response (pass chat to check autoReplyDisabled)
    const aiResponse = await getAiResponse(chat.messages, chat);
    console.log('AI response received:', aiResponse ? aiResponse.substring(0, 50) : 'null');

    // Add AI message only if auto-reply is enabled
    if (aiResponse !== null) {
      chat.messages.push({
        role: 'assistant',
        content: aiResponse,
        isAiGenerated: true
      });
    }

    await chat.save();
    console.log('Chat saved:', chat._id);

    res.json({
      chatId: chat._id,
      userId: chat.userId,
      message: aiResponse
    });
  } catch (error) {
    console.error('Chat error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Не удалось обработать сообщение', details: error.message });
  }
});

// Get chat history
router.get('/:id', async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id });
    if (!chat) {
      return res.status(404).json({ error: 'Чат не найден' });
    }
    res.json(chat);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Не удалось получить чат' });
  }
});

// Get all chats for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.params.userId })
      .sort({ updatedAt: -1 })
      .select('_id title messages createdAt updatedAt');
    res.json(chats);
  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({ error: 'Не удалось получить чаты' });
  }
});

// Get all chats (for admin without auth - for public viewing)
router.get('/', async (req, res) => {
  try {
    const chats = await Chat.find()
      .sort({ updatedAt: -1 })
      .limit(100)
      .select('_id userId title createdAt updatedAt');
    res.json(chats);
  } catch (error) {
    console.error('Get all chats error:', error);
    res.status(500).json({ error: 'Не удалось получить чаты' });
  }
});

module.exports = router;

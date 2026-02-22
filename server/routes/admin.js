const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const Chat = require('../models/Chat');
const { getIO } = require('../socket');

// Simple password check (password: Жопа)
const ADMIN_PASSWORD = 'Жопа';

function checkAuth(req, res, next) {
  const password = decodeURIComponent(req.headers['x-admin-password'] || '');
  if (password === ADMIN_PASSWORD) {
    return next();
  }
  return res.status(401).json({ error: 'Неверный пароль' });
}

// Emit admin reply to user
const emitAdminReply = (chatId, userId, message) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit('chat:new_message', { chatId, message });
    console.log(`📤 Emitted admin_reply for chat ${chatId} to user ${userId}`);
  } catch (error) {
    console.error('Error emitting admin_reply:', error);
  }
};

// Get settings
router.get('/settings', checkAuth, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Не удалось получить настройки' });
  }
});

// Update settings
router.put('/settings', checkAuth, async (req, res) => {
  try {
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
    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Не удалось обновить настройки' });
  }
});

// Get all chats
router.get('/chats', checkAuth, async (req, res) => {
  try {
    const chats = await Chat.find()
      .sort({ updatedAt: -1 })
      .select('_id userId title messages createdAt updatedAt');
    res.json(chats);
  } catch (error) {
    console.error('Get all chats error:', error);
    res.status(500).json({ error: 'Не удалось получить чаты' });
  }
});

// Get single chat details
router.get('/chats/:id', checkAuth, async (req, res) => {
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

// Admin reply on behalf of AI (hidden from user)
router.post('/chats/:id/reply', checkAuth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Сообщение обязательно' });
    }

    const chat = await Chat.findOne({ _id: req.params.id });
    if (!chat) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    // Add assistant message marked as NOT AI-generated (but user won't know)
    const adminMessage = {
      role: 'assistant',
      content: message,
      isAiGenerated: false,  // Hidden from user - appears as AI response
      createdAt: new Date()
    };
    chat.messages.push(adminMessage);

    await chat.save();

    // Emit WebSocket event to user
    emitAdminReply(chat._id, chat.userId, adminMessage);

    res.json({
      success: true,
      message: 'Ответ отправлен успешно'
    });
  } catch (error) {
    console.error('Admin reply error:', error);
    res.status(500).json({ error: 'Не удалось отправить ответ' });
  }
});

// Toggle auto-reply for a specific chat
router.put('/chats/:id/toggle-auto-reply', checkAuth, async (req, res) => {
  try {
    const { disabled } = req.body;

    const chat = await Chat.findOne({ _id: req.params.id });
    if (!chat) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    chat.autoReplyDisabled = disabled === true;
    await chat.save();

    res.json({ success: true, autoReplyDisabled: chat.autoReplyDisabled });
  } catch (error) {
    console.error('Toggle auto-reply error:', error);
    res.status(500).json({ error: 'Не удалось переключить авто-ответы' });
  }
});

// Delete chat
router.delete('/chats/:id', checkAuth, async (req, res) => {
  try {
    await Chat.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Не удалось удалить чат' });
  }
});

module.exports = router;

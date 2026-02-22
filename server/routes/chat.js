const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const { getAiResponse } = require('../services/ai');
const { getIO } = require('../socket');

// Emit message to user and admin rooms
const emitNewMessage = (chatId, userId, message) => {
  try {
    const io = getIO();
    console.log(`📤 Attempting to emit new_message to user:${userId} and admin:room`);
    console.log(`   chatId: ${chatId}, message length: ${message?.content?.length || 0}`);
    
    // Emit to specific user
    io.to(`user:${userId}`).emit('chat:new_message', { chatId, message });
    console.log(`   ✓ Emitted to user:${userId}`);
    
    // Emit to all admins
    io.to('admin:room').emit('admin:new_message', { chatId, userId, message });
    console.log(`   ✓ Emitted to admin:room`);
  } catch (error) {
    console.error('❌ Error emitting new_message:', error.message);
  }
};

// Emit chat list update to user
const emitChatListUpdate = (userId) => {
  try {
    const io = getIO();
    console.log(`📤 Attempting to emit list_updated to user:${userId}`);
    io.to(`user:${userId}`).emit('chat:list_updated');
    console.log(`   ✓ Emitted list_updated to user:${userId}`);
  } catch (error) {
    console.error('❌ Error emitting list_updated:', error.message);
  }
};

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
    const userMessage = {
      role: 'user',
      content: message,
      isAiGenerated: false
    };
    chat.messages.push(userMessage);

    // Update title if first message
    if (chat.messages.length === 1) {
      chat.title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
    }

    console.log('Getting AI response...');
    // Get AI response (pass chat to check autoReplyDisabled)
    const aiResponse = await getAiResponse(chat.messages, chat);
    console.log('AI response received:', aiResponse ? aiResponse.substring(0, 50) : 'null');

    let responseMessage = aiResponse;

    // Add AI message only if auto-reply is enabled
    if (aiResponse !== null) {
      const aiMessage = {
        role: 'assistant',
        content: aiResponse,
        isAiGenerated: true
      };
      chat.messages.push(aiMessage);
      responseMessage = aiResponse;
    } else {
      // If auto-reply is disabled, still return null but don't add empty message
      responseMessage = null;
    }

    await chat.save();
    console.log('Chat saved:', chat._id);

    // Emit WebSocket events only if there's a response message
    const finalUserId = userId || newUserId;
    if (responseMessage !== null) {
      emitNewMessage(chat._id, finalUserId, {
        role: 'assistant',
        content: responseMessage,
        isAiGenerated: true,
        createdAt: new Date()
      });
    }

    // Emit chat list update if new chat
    if (!chatId) {
      emitChatListUpdate(finalUserId);
    }

    res.json({
      chatId: chat._id,
      userId: finalUserId,
      message: responseMessage
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

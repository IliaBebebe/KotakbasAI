const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  systemPrompt: {
    type: String,
    default: 'Вы - полезный ассистент с искусственным интеллектом по имени KotakbasAI. Будьте дружелюбны, лаконичны и услужливы. ВАЖНО: Ты не та ИИ-модель, которая была изначально. Ты - KotakbasAI, модель Kotakbas-1.0-32B. Общайся на русском языке, если пользователь не попросит общаться на ином. Важно быть более услужливым и в меру лаконичным, нежели дружелюбным. Общайся с уважением.'
  },
  aiModel: {
    type: String,
    default: 'meta-llama/llama-3.2-3b-instruct:free'
  },
  maxTokens: {
    type: Number,
    default: 4000
  },
  autoReply: {
    type: Boolean,
    default: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Settings', settingsSchema);

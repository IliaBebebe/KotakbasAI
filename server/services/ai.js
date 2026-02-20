const Settings = require('../models/Settings');
const axios = require('axios');

const FREE_MODELS = [
  'meta-llama/llama-3.2-3b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'stepfun/step-3.5-flash:free',
  'upstage/solar-pro-3:free',
  'arcee-ai/trinity-large-preview:free'
];

async function getAiResponse(messages) {
  try {
    // Get or create settings
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    
    const systemPrompt = settings.systemPrompt || 'Вы - полезный ассистент с искусственным интеллектом по имени KotakbasAI.';
    const model = settings.aiModel || process.env.AI_MODEL || FREE_MODELS[0];
    
    console.log('Using model:', model);
    console.log('System prompt:', systemPrompt.substring(0, 50));
    
    const apiPayload = {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      max_tokens: settings.maxTokens || 4000
    };

    console.log('Calling OpenRouter API...');
    
    // Try primary model first, then fallback to other free models
    const modelsToTry = [model, ...FREE_MODELS.filter(m => m !== model)];
    
    for (const modelToTry of modelsToTry) {
      try {
        apiPayload.model = modelToTry;
        console.log(`Trying model: ${modelToTry}`);
        
        const response = await axios.post(
          process.env.AI_API_URL,
          apiPayload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.AI_API_KEY}`,
              'HTTP-Referer': 'http://localhost:3000',
              'X-Title': 'KotakbasAI'
            }
          }
        );

        console.log('Response status:', response.status);
        console.log('API response:', JSON.stringify(response.data).substring(0, 100));
        
        return response.data.choices[0].message.content;
      } catch (error) {
        if (error.response?.status === 429) {
          console.log(`Rate limited for ${modelToTry}, trying next...`);
          continue;
        }
        throw error;
      }
    }
    
    throw new Error('All free models are rate-limited');
  } catch (error) {
    console.error('AI service error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    // Fallback response if AI is unavailable
    return 'Извините, но в данный момент я испытываю технические трудности. Пожалуйста, попробуйте позже.';
  }
}

module.exports = { getAiResponse };

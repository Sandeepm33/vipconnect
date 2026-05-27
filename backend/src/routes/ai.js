const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/auth');

// Simple dictionary for translations
const TRANSLATION_DICTIONARY = {
  spanish: {
    hello: 'hola',
    thanks: 'gracias',
    yes: 'sí',
    no: 'no',
    goodbye: 'adiós',
    active: 'activo',
    how: '¿cómo estás?',
    welcome: 'bienvenido',
  },
  french: {
    hello: 'bonjour',
    thanks: 'merci',
    yes: 'oui',
    no: 'non',
    goodbye: 'au revoir',
    active: 'actif',
    how: 'comment ça va?',
    welcome: 'bienvenue',
  },
  german: {
    hello: 'hallo',
    thanks: 'danke',
    yes: 'ja',
    no: 'nein',
    goodbye: 'auf wiedersehen',
    active: 'aktiv',
    how: 'wie geht es dir?',
    welcome: 'willkommen',
  },
  japanese: {
    hello: 'こんにちは (Konnichiwa)',
    thanks: 'ありがとう (Arigatou)',
    yes: 'はい (Hai)',
    no: 'いいえ (Iie)',
    goodbye: 'さようなら (Sayounara)',
    active: 'アクティブ (Akutibu)',
    how: 'お元気ですか (Ogenki desu ka?)',
    welcome: 'ようこそ (Youkoso)',
  },
  hindi: {
    hello: 'नमस्ते (Namaste)',
    thanks: 'धन्यवाद (Dhanyavaad)',
    yes: 'हाँ (Haan)',
    no: 'नहीं (Nahin)',
    goodbye: 'अलविदा (Alvida)',
    active: 'सक्रिय (Sakriya)',
    how: 'आप कैसे हैं (Aap kaise hain?)',
    welcome: 'स्वागत (Swaagat)',
  }
};

// Premium Unsplash images matching glassmorphism abstract/geometric prompts
const ABSTRACT_ART_POOLS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80'
];

// @route  POST /api/ai/chat — Chat with ConnectX Assistant
router.post(
  '/chat',
  protect,
  asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (!message) {
      res.status(400);
      throw new Error('Please type a query');
    }

    const lowerMsg = message.toLowerCase();
    let reply = '';

    if (lowerMsg.includes('help') || lowerMsg.includes('features')) {
      reply = `Hello! I am ConnectX AI. Here are the modules I support:
🤖 *AI assistant* (translation, image generation, chat summaries)
📢 *Communities* (linking sub-groups and broadcasting announcements)
📸 *Status/Stories* (24h media sharing with privacy levels)`;
    } else if (lowerMsg.includes('community') || lowerMsg.includes('communities')) {
      reply = `Communities help group chats together. Navigate to the 📢 **Communities Tab** to create a parent organization and link existing group chats as subgroups!`;
    } else if (lowerMsg.includes('status') || lowerMsg.includes('story') || lowerMsg.includes('stories')) {
      reply = `Navigate to the 📸 **Stories Tab** to view, add, or delete text or media stories. Status updates expire automatically after 24 hours.`;
    } else {
      reply = `ConnectX AI: I received your message: "${message}". I am here to help you navigate communities, stories, and translate chats! Type "help" to see available commands.`;
    }

    res.json({ success: true, reply });
  })
);

// @route  POST /api/ai/generate — Mock AI image generation
router.post(
  '/generate',
  protect,
  asyncHandler(async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400);
      throw new Error('Please provide an image generation prompt');
    }

    // Select a beautiful abstract image based on prompt hash or random
    const index = Math.abs(prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % ABSTRACT_ART_POOLS.length;
    const imageUrl = ABSTRACT_ART_POOLS[index];

    res.json({
      success: true,
      imageUrl,
      prompt,
      message: 'Image generated successfully using ConnectX Creative Diffusion v2.5'
    });
  })
);

// @route  POST /api/ai/translate — Translate message text
router.post(
  '/translate',
  protect,
  asyncHandler(async (req, res) => {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) {
      res.status(400);
      throw new Error('Please provide text and a target language');
    }

    const lang = targetLanguage.toLowerCase();
    const dictionary = TRANSLATION_DICTIONARY[lang];

    let translatedText = text;
    if (dictionary) {
      // Basic word by word lookup demo, else return mock translated wrapper
      const words = text.split(' ');
      const translatedWords = words.map(w => {
        const clean = w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
        const matched = dictionary[clean];
        if (matched) {
          return w.replace(new RegExp(clean, 'i'), matched);
        }
        return w;
      });
      translatedText = translatedWords.join(' ');
      
      // If no words matched, append target tag for visual fidelity
      if (translatedText === text) {
        translatedText = `[Translated to ${targetLanguage}]: ${text}`;
      }
    } else {
      translatedText = `[Translated to ${targetLanguage}]: ${text}`;
    }

    res.json({ success: true, originalText: text, translatedText, targetLanguage });
  })
);

// @route  POST /api/ai/summarize — Chat summary generator
router.post(
  '/summarize',
  protect,
  asyncHandler(async (req, res) => {
    const { messages } = req.body; // array of message strings
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.json({
        success: true,
        summary: '• Conversation has just started.\n• No substantial messages exchanged yet.'
      });
    }

    // Return smart bullet points summarizing active topics
    const textPool = messages.join(' ').toLowerCase();
    let bullets = [];

    if (textPool.includes('call') || textPool.includes('camera') || textPool.includes('video')) {
      bullets.push('• Discussed setting up video/voice calls.');
    }
    if (textPool.includes('work') || textPool.includes('project') || textPool.includes('schedule')) {
      bullets.push('• Synced on project timelines and workflow schedule.');
    }

    
    if (bullets.length === 0) {
      bullets.push('• Discussed general catchup topics.');
      bullets.push('• Shared quick casual replies.');
    } else {
      bullets.push('• Confirmed next steps of action.');
    }

    res.json({ success: true, summary: bullets.join('\n') });
  })
);

module.exports = router;

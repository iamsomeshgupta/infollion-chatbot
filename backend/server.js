const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const https = require('https');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

const upload = multer({ storage: multer.memoryStorage() });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const sessions = new Map();

async function extractPdfText(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '';
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      documentText = '',
      imageData = '',
      sessionId = 'default',
    } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message required' });
    }

    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, []);
    }

    const chatHistory = sessions.get(sessionId);

    let userMessage = message;
    if (documentText) {
      userMessage = `[Document]: ${documentText}\n\n[Question]: ${message}`;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const contents = [];

    for (const msg of chatHistory) {
      contents.push({ role: msg.role, parts: [{ text: msg.content }] });
    }

    const userParts = [{ text: userMessage }];

    if (imageData) {
      userParts.push({ inlineData: { mimeType: 'image/jpeg', data: imageData.split(',')[1] || imageData } });
    }

    contents.push({ role: 'user', parts: userParts });

    const result = await model.generateContent({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } });

    const botResponse = result.response.text();

    chatHistory.push({ role: 'user', content: message });
    chatHistory.push({ role: 'model', content: botResponse });

    if (chatHistory.length > 20) {
      chatHistory.splice(0, 2);
    }

    res.json({ success: true, response: botResponse, sessionId });

  } catch (error) {
    console.error('FULL ERROR:', error);
    console.error('Gemini Error:', error.response?.data);
    res.status(500).json({ success: false, error: error.message || 'Gemini failed' });
  }
});

app.post('/api/upload/document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file' });
    }

    let text = '';
    const ext = req.file.originalname.toLowerCase();

    if (ext.endsWith('.pdf')) {
      text = await extractPdfText(req.file.buffer);
    } else if (ext.endsWith('.txt')) {
      text = req.file.buffer.toString('utf-8');
    } else {
      return res.status(400).json({ success: false, error: 'Only PDF/TXT allowed' });
    }

    res.json({ success: true, text });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

app.post('/api/upload/image', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false });
    }

    const base64 = req.file.buffer.toString('base64');

    res.json({ success: true, imageData: base64 });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

app.post('/api/reset', (req, res) => {
  const { sessionId = 'default' } = req.body;
  sessions.delete(sessionId);
  res.json({ success: true });
});

app.get('/test-gemini', async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: 'Say hello' }] }], generationConfig: { maxOutputTokens: 64 } });
    res.send(result.response.text());
  } catch (err) {
    console.error('Test endpoint error:', err);
    res.status(500).send(err.message || 'Test failed');
  }
});

app.get('/list-models', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(400).json({ success: false, error: 'API key not configured' });
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
  https.get(url, (resp) => {
    let data = '';
    resp.on('data', (chunk) => (data += chunk));
    resp.on('end', () => {
      try {
        const json = JSON.parse(data);
        return res.json({ success: true, data: json });
      } catch (err) {
        console.error('List models parse error:', err, data);
        return res.status(500).json({ success: false, error: 'Failed to parse response' });
      }
    });
  }).on('error', (err) => {
    console.error('List models request error:', err);
    return res.status(500).json({ success: false, error: err.message });
  });
});
# AI Chatbot Application

A minimal web-based chatbot using Google's Gemini API with support for text conversation, document uploads, and image analysis.

## Features

-  Real-time text chat interface
-  Document support (PDF/TXT file uploads)
-  Image support (PNG/JPG file uploads)
-  Chat context management (tracks conversation history)
-  Reset conversation (New Chat button)

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **API**: Google Gemini API
- **State**: In-memory (session-based)

## Prerequisites

- Node.js (v16+)
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikeys))

## Installation & Setup

### 1. Backend Setup

```bash
cd backend
npm install
```

### 2. Configure Gemini API Key

Create a `.env` file in the `backend` folder:

```
GEMINI_API_KEY=your_api_key_here
PORT=3000
```

### 3. Run Backend

```bash
cd backend
npm start
```

Backend runs on `http://localhost:3000`

### 4. Open Frontend

Open `frontend/index.html` in your browser or serve it:

```bash
# Using Python 3
python -m http.server 8000 --directory frontend

# Using Node http-server
npx http-server frontend
```

Then visit: `http://localhost:8000`

## Usage

1. **Text Chat**: Type messages and click Send (or press Enter)
2. **Upload Document**: Click "Document Upload" to attach PDF or TXT files
3. **Upload Image**: Click "Image Upload" to attach PNG or JPG files
4. **Reset Chat**: Click "New Chat" to clear history and start fresh

### Example Scenarios

**Document Q&A**:
- Upload a PDF with notes
- Ask questions about the content
- Bot answers based on extracted text

**Image Analysis**:
- Upload a photo
- Ask "What's in this image?"
- Bot describes the contents

**Context-Aware Chat**:
- Upload document
- Ask follow-up questions
- Bot maintains context across messages

## Project Structure

```
infollion/
├── backend/
│   ├── server.js           # Express server
│   ├── package.json        # Dependencies
│   ├── .env               # Configuration
│   └── .gitignore
├── frontend/
│   ├── index.html         # Main UI
│   ├── styles.css         # Styling
│   └── script.js          # Client logic
├── README.md              # This file
└── .gitignore
```

## Constraints

-  Minimal UI - focus on functionality
-  In-memory storage only (no database)
-  No authentication required
-  Basic file extraction (PDF text, image binary)
-  Single chat session per browser
-  Chat history cleared on page refresh or "New Chat"

## License

MIT

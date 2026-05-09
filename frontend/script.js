const API_BASE_URL = 'http://localhost:3000';
const SESSION_ID = 'user_' + Date.now();

const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const docUploadBtn = document.getElementById('docUploadBtn');
const imgUploadBtn = document.getElementById('imgUploadBtn');
const documentInput = document.getElementById('documentInput');
const imageInput = document.getElementById('imageInput');
const loadingIndicator = document.getElementById('loadingIndicator');
const imagePreview = document.getElementById('imagePreview');
const documentPreview = document.getElementById('documentPreview');
const removeImageBtn = document.getElementById('removeImageBtn');
const removeDocumentBtn = document.getElementById('removeDocumentBtn');

let uploadedDocumentText = '';
let uploadedImageData = '';
let chatHistory = [];

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

newChatBtn.addEventListener('click', resetChat);
docUploadBtn.addEventListener('click', () => documentInput.click());
imgUploadBtn.addEventListener('click', () => imageInput.click());
documentInput.addEventListener('change', handleDocumentUpload);
imageInput.addEventListener('change', handleImageUpload);
removeImageBtn.addEventListener('click', removeImage);
removeDocumentBtn.addEventListener('click', removeDocument);

async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message) return;

    addMessage(message, 'user');
    messageInput.value = '';
    messageInput.focus();

    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                documentText: uploadedDocumentText,
                imageData: uploadedImageData,
                sessionId: SESSION_ID,
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to get response');
        }

        addMessage(data.response, 'bot');

        chatHistory.push({ role: 'user', content: message });
        chatHistory.push({ role: 'assistant', content: data.response });

    } catch (error) {
        console.error('Error:', error);
        addMessage(
            ` Error: ${error.message}\n\nMake sure the backend server is running on ${API_BASE_URL}`,
            'bot'
        );
    } finally {
        hideLoading();
        scrollToBottom();
    }
}

async function handleDocumentUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/api/upload/document`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to upload document');
        }

        uploadedDocumentText = data.text;
        showDocumentPreview(file.name, data.text);
        addMessage(`Document uploaded: ${file.name}`, 'bot');

    } catch (error) {
        console.error('Document upload error:', error);
        addMessage(`Document upload failed: ${error.message}`, 'bot');
    } finally {
        hideLoading();
        documentInput.value = '';
        scrollToBottom();
    }
}

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to upload image');
        }

        uploadedImageData = data.imageData;
        showImagePreview(file.name, file);
        addMessage(`Image uploaded: ${file.name}`, 'bot');

    } catch (error) {
        console.error('Image upload error:', error);
        addMessage(`Image upload failed: ${error.message}`, 'bot');
    } finally {
        hideLoading();
        imageInput.value = '';
        scrollToBottom();
    }
}

function showImagePreview(fileName, file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImg').src = e.target.result;
        document.getElementById('imageName').textContent = fileName;
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function showDocumentPreview(fileName, text) {
    const preview = text.substring(0, 300) + (text.length > 300 ? '...' : '');
    document.getElementById('documentPreviewText').textContent = preview;
    document.getElementById('documentName').textContent = fileName;
    documentPreview.style.display = 'block';
}

function removeImage() {
    uploadedImageData = '';
    imagePreview.style.display = 'none';
    addMessage('Image removed', 'bot');
}

function removeDocument() {
    uploadedDocumentText = '';
    documentPreview.style.display = 'none';
    addMessage('Document removed', 'bot');
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender === 'user' ? 'user-message' : 'bot-message'}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const p = document.createElement('p');
    p.textContent = text;

    contentDiv.appendChild(p);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    scrollToBottom();
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showLoading() {
    loadingIndicator.style.display = 'flex';
    sendBtn.disabled = true;
    messageInput.disabled = true;
}

function hideLoading() {
    loadingIndicator.style.display = 'none';
    sendBtn.disabled = false;
    messageInput.disabled = false;
}

async function resetChat() {
    try {
        await fetch(`${API_BASE_URL}/api/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId: SESSION_ID }),
        });

        chatMessages.innerHTML = '';
        messageInput.value = '';
        uploadedDocumentText = '';
        uploadedImageData = '';
        chatHistory = [];

        imagePreview.style.display = 'none';
        documentPreview.style.display = 'none';

        addMessage(
            "Hello! I'm your AI assistant powered by Google Gemini. You can chat with me, upload documents (PDF/TXT), or share images (PNG/JPG). How can I help you today?",
            'bot'
        );

        messageInput.focus();

    } catch (error) {
        console.error('Reset error:', error);
        alert('Failed to reset chat: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    messageInput.focus();
    console.log('Chatbot loaded. Session ID:', SESSION_ID);
});

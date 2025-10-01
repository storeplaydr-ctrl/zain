const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/exnebula';

// Basic security
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Socket.IO for real-time chat
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  socket.on('join-chat', (userData) => {
    activeUsers.set(socket.id, userData);
    console.log(`${userData.name} joined chat`);
  });

  socket.on('community-message', (message) => {
    const user = activeUsers.get(socket.id);
    if (user) {
      io.emit('community-message', {
        ...message,
        user: user.name,
        timestamp: new Date()
      });
    }
  });

  socket.on('mentor-message', (message) => {
    const user = activeUsers.get(socket.id);
    if (user) {
      // Simple AI responses
      const responses = [
        "Great question! For AI engineering, start with Python fundamentals.",
        "Based on your goals, I recommend focusing on machine learning basics first.",
        "That's a smart approach! Let's break this into smaller learning modules.",
        "Perfect! For your learning style, try hands-on projects alongside theory.",
        "Excellent question! This is fundamental to your chosen career path."
      ];
      const aiResponse = responses[Math.floor(Math.random() * responses.length)];

      socket.emit('mentor-response', {
        text: aiResponse,
        timestamp: new Date()
      });
    }
  });

  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      activeUsers.delete(socket.id);
      console.log(`${user.name} left chat`);
    }
  });
});

// API Routes
app.use('/api/auth', require('./src/routes/auth.js'));
app.use('/api/learning-path', require('./src/routes/learningPath.js'));
app.use('/api/chat', require('./src/routes/chat.js'));

// Health check for Render
app.get('/healthz', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Serve frontend for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Open: http://localhost:${PORT}`);
});

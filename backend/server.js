const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Ensure JWT_SECRET exists
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
  console.error('[Security Fatal] Server cannot start without JWT_SECRET environment variable!');
  process.exit(1);
}

const connectDB = require('./config/db');
const { seedAdminUser } = require('./controllers/userController');
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const holderRoutes = require('./routes/holderRoutes');
const chatRoutes = require('./routes/chatRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const Message = require('./models/Message');
const PurchaseRequest = require('./models/PurchaseRequest');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

// Connect Database & seed initial admin
connectDB().then(() => {
  seedAdminUser().catch(err => console.error('[Admin Seed Error]', err));
});

const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET.trim());
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    socket.user = user;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

// Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Rate Limiter for Auth Routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// REST Endpoints
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/holders', holderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'WishCard Verified Escrow & Peer Purchase Platform',
    timestamp: new Date()
  });
});

// Socket.io for Real-time Deal Chatrooms
io.on('connection', (socket) => {
  socket.on('join_chat', async (requestId) => {
    try {
      const reqObj = await PurchaseRequest.findById(requestId);
      if (!reqObj) return socket.emit('error', 'Request not found');

      const userIdStr = socket.user._id.toString();
      const isParticipant = (reqObj.buyer && reqObj.buyer.toString() === userIdStr) ||
                            (reqObj.matchedHolder && reqObj.matchedHolder.toString() === userIdStr) ||
                            socket.user.role === 'admin';

      if (!isParticipant) {
        return socket.emit('error', 'Access Denied: Room is private to deal participants');
      }

      socket.join(requestId);
    } catch (err) {
      console.error('Socket join_chat error:', err.message);
    }
  });

  socket.on('send_message', async (data) => {
    try {
      const { requestId, message, attachmentUrl } = data;
      if (!message || !message.trim()) return;

      const reqObj = await PurchaseRequest.findById(requestId);
      if (!reqObj) return;

      const userIdStr = socket.user._id.toString();
      const isBuyer = reqObj.buyer && reqObj.buyer.toString() === userIdStr;
      const isHolder = reqObj.matchedHolder && reqObj.matchedHolder.toString() === userIdStr;

      if (!isBuyer && !isHolder && socket.user.role !== 'admin') return;

      const savedMsg = await Message.create({
        requestId,
        sender: socket.user._id,
        senderName: socket.user.name,
        senderRole: isBuyer ? 'Buyer' : (isHolder ? 'Matched Cardholder' : 'Admin'),
        message: message.trim(),
        attachmentUrl: attachmentUrl || ''
      });

      io.to(requestId).emit('receive_message', savedMsg);
    } catch (err) {
      console.error('Socket send_message error:', err.message);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[WishCard Server] Running on http://localhost:${PORT}`);
});

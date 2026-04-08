const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const uploadsDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_DEV,
  ...(process.env.ALLOWED_ORIGINS || '').split(',').map(origin => origin.trim()),
].filter(Boolean);

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const isAllowedOrigin = (origin) => {
  // Native mobile apps may not send an Origin header.
  if (!origin) return true;
  return allowedOrigins.includes(origin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};

const io = new Server(server, {
  cors: corsOptions
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/channels', require('./routes/channels'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/files', require('./routes/files'));
app.use('/api/users', require('./routes/users'));

require('./socket')(io);

app.get('/', (req, res) => res.json({ status: 'ok', app: '10x Chat API' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`10x Chat running on port ${PORT}`));

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

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/channels', require('./routes/channels'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/files', require('./routes/files'));
app.use('/api/users', require('./routes/users'));

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

require('./socket')(io);

app.get('/', (req, res) => res.json({ status: 'ok', app: '10x Chat API' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => console.log('10x Chat running on port ' + PORT));

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 }
});

router.post('/upload/:channelId', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const fileUrl = `${process.env.CLIENT_URL}/uploads/${req.file.filename}`;
  const isImage = req.file.mimetype.startsWith('image/');
  const msgType = isImage ? 'image' : 'file';

  try {
    const msgId = uuidv4();
    await db.query(
      'INSERT INTO messages (id, channel_id, sender_id, content, type) VALUES (?, ?, ?, ?, ?)',
      [msgId, req.params.channelId, req.user.id, req.file.originalname, msgType]
    );
    await db.query(
      'INSERT INTO attachments (id, message_id, file_name, file_type, file_size, file_url) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), msgId, req.file.originalname, req.file.mimetype, req.file.size, fileUrl]
    );
    res.json({ message_id: msgId, file_url: fileUrl, file_name: req.file.originalname, type: msgType });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/channel/:channelId', auth, async (req, res) => {
  try {
    const [files] = await db.query(
      `SELECT a.*, u.name as uploaded_by, m.created_at
       FROM attachments a
       JOIN messages m ON a.message_id = m.id
       JOIN users u ON m.sender_id = u.id
       WHERE m.channel_id = ? AND m.is_deleted = 0
       ORDER BY m.created_at DESC`,
      [req.params.channelId]
    );
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

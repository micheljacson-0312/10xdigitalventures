const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/:channelId', auth, async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const before = req.query.before;

  try {
    let query = `
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('emoji', r.emoji, 'user_id', r.user_id))
         FROM reactions r WHERE r.message_id = m.id) as reactions
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.channel_id = ? AND m.is_deleted = 0
    `;
    const params = [req.params.channelId];

    if (before) {
      query += ' AND m.created_at < ?';
      params.push(before);
    }

    query += ' ORDER BY m.created_at DESC LIMIT ?';
    params.push(limit);

    const [messages] = await db.query(query, params);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:channelId', auth, async (req, res) => {
  const { content, type = 'text', reply_to } = req.body;
  if (!content) return res.status(400).json({ message: 'Content required' });

  try {
    const msgId = uuidv4();
    await db.query(
      'INSERT INTO messages (id, channel_id, sender_id, content, type, reply_to) VALUES (?, ?, ?, ?, ?, ?)',
      [msgId, req.params.channelId, req.user.id, content, type, reply_to || null]
    );
    res.json({ id: msgId, content, type });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { content } = req.body;
  try {
    await db.query(
      'UPDATE messages SET content = ?, is_edited = 1 WHERE id = ? AND sender_id = ?',
      [content, req.params.id, req.user.id]
    );
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query(
      'UPDATE messages SET is_deleted = 1 WHERE id = ? AND sender_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/react', auth, async (req, res) => {
  const { emoji } = req.body;
  try {
    const [existing] = await db.query(
      'SELECT id FROM reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
      [req.params.id, req.user.id, emoji]
    );
    if (existing.length > 0) {
      await db.query('DELETE FROM reactions WHERE id = ?', [existing[0].id]);
      return res.json({ action: 'removed' });
    }
    await db.query(
      'INSERT INTO reactions (id, message_id, user_id, emoji) VALUES (?, ?, ?, ?)',
      [uuidv4(), req.params.id, req.user.id, emoji]
    );
    res.json({ action: 'added' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

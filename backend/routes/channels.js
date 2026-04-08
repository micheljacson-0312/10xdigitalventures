const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const [channels] = await db.query(
      `SELECT c.*, cm.role FROM channels c
       JOIN channel_members cm ON c.id = cm.channel_id
       WHERE c.workspace_id = ? AND cm.user_id = ?`,
      [req.user.workspace_id, req.user.id]
    );
    res.json(channels);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  const { name, type = 'public', topic = '' } = req.body;
  if (!name) return res.status(400).json({ message: 'Channel name required' });

  try {
    const channelId = uuidv4();
    await db.query(
      'INSERT INTO channels (id, workspace_id, name, type, topic, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [channelId, req.user.workspace_id, name, type, topic, req.user.id]
    );
    await db.query(
      'INSERT INTO channel_members (id, channel_id, user_id, role) VALUES (?, ?, ?, "admin")',
      [uuidv4(), channelId, req.user.id]
    );
    res.json({ id: channelId, name, type, topic });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/members', auth, async (req, res) => {
  try {
    const [members] = await db.query(
      `SELECT u.id, u.name, u.avatar, u.is_online, u.status, cm.role
       FROM channel_members cm JOIN users u ON cm.user_id = u.id
       WHERE cm.channel_id = ?`,
      [req.params.id]
    );
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/join', auth, async (req, res) => {
  try {
    const [existing] = await db.query(
      'SELECT id FROM channel_members WHERE channel_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length > 0) return res.status(400).json({ message: 'Already a member' });

    await db.query(
      'INSERT INTO channel_members (id, channel_id, user_id) VALUES (?, ?, ?)',
      [uuidv4(), req.params.id, req.user.id]
    );
    res.json({ message: 'Joined successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

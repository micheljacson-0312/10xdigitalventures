const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, avatar, bio, status, is_online, last_seen FROM users WHERE workspace_id = ?',
      [req.user.workspace_id]
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', auth, async (req, res) => {
  const { name, bio, status } = req.body;
  try {
    await db.query(
      'UPDATE users SET name = ?, bio = ?, status = ? WHERE id = ?',
      [name, bio, status, req.user.id]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

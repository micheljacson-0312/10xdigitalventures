const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

router.post('/register', async (req, res) => {
  const { name, email, password, invite_code } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });

  try {
    const [workspaces] = await db.query('SELECT * FROM workspaces WHERE invite_code = ?', [invite_code]);
    if (workspaces.length === 0) return res.status(400).json({ message: 'Invalid invite code' });
    const workspace = workspaces[0];

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ message: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await db.query(
      'INSERT INTO users (id, workspace_id, name, email, password_hash) VALUES (?, ?, ?, ?, ?)',
      [userId, workspace.id, name, email, password_hash]
    );

    const [general] = await db.query(
      'SELECT id FROM channels WHERE name = "general" LIMIT 1',
      []
    );
    if (general.length > 0) {
      await db.query(
        'INSERT INTO channel_members (id, channel_id, user_id, role) VALUES (?, ?, ?, "member")',
        [uuidv4(), general[0].id, userId]
      );
    }

    const token = jwt.sign({ id: userId, email, workspace_id: workspace.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: userId, name, email, workspace_id: workspace.id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'All fields required' });

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(400).json({ message: 'Invalid credentials' });
    const user = users[0];

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });

    await db.query('UPDATE users SET is_online = 1, last_seen = NOW() WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, workspace_id: user.workspace_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, workspace_id: user.workspace_id }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, avatar, bio, status, is_online, workspace_id FROM users WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', require('../middleware/auth'), async (req, res) => {
  const { name, bio, status, avatar } = req.body;
  try {
    await db.query(
      'UPDATE users SET name = COALESCE(?, name), bio = COALESCE(?, bio), status = COALESCE(?, status), avatar = COALESCE(?, avatar) WHERE id = ?',
      [name, bio, status, avatar, req.user.id]
    );
    const [user] = await db.query('SELECT id, name, email, avatar, bio, status, is_online FROM users WHERE id = ?', [req.user.id]);
    res.json(user[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;

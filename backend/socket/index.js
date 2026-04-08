const jwt = require('jsonwebtoken');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`User connected: ${userId}`);

    await db.query('UPDATE users SET is_online = 1 WHERE id = ?', [userId]);
    io.emit('user:online', { user_id: userId });

    socket.on('join:channels', async () => {
      const [channels] = await db.query(
        'SELECT channel_id FROM channel_members WHERE user_id = ?',
        [userId]
      );
      channels.forEach(c => socket.join(c.channel_id));
    });

    socket.on('message:send', async (data) => {
      const { channel_id, content, type = 'text', reply_to } = data;
      try {
        const msgId = uuidv4();
        await db.query(
          'INSERT INTO messages (id, channel_id, sender_id, content, type, reply_to) VALUES (?, ?, ?, ?, ?, ?)',
          [msgId, channel_id, userId, content, type, reply_to || null]
        );
        const [users] = await db.query('SELECT name, avatar FROM users WHERE id = ?', [userId]);
        const msg = {
          id: msgId, channel_id, content, type, reply_to,
          sender_id: userId,
          sender_name: users[0].name,
          sender_avatar: users[0].avatar,
          created_at: new Date(),
          reactions: []
        };
        io.to(channel_id).emit('message:new', msg);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing:start', (data) => {
      socket.to(data.channel_id).emit('typing:start', { user_id: userId, channel_id: data.channel_id });
    });

    socket.on('typing:stop', (data) => {
      socket.to(data.channel_id).emit('typing:stop', { user_id: userId, channel_id: data.channel_id });
    });

    socket.on('message:edit', async (data) => {
      await db.query(
        'UPDATE messages SET content = ?, is_edited = 1 WHERE id = ? AND sender_id = ?',
        [data.content, data.message_id, userId]
      );
      io.to(data.channel_id).emit('message:edited', { message_id: data.message_id, content: data.content });
    });

    socket.on('message:delete', async (data) => {
      await db.query(
        'UPDATE messages SET is_deleted = 1 WHERE id = ? AND sender_id = ?',
        [data.message_id, userId]
      );
      io.to(data.channel_id).emit('message:deleted', { message_id: data.message_id, channel_id: data.channel_id });
    });

    socket.on('reaction:toggle', async (data) => {
      const { message_id, channel_id, emoji } = data;
      const [existing] = await db.query(
        'SELECT id FROM reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
        [message_id, userId, emoji]
      );
      if (existing.length > 0) {
        await db.query('DELETE FROM reactions WHERE id = ?', [existing[0].id]);
        io.to(channel_id).emit('reaction:updated', { message_id, user_id: userId, emoji, action: 'removed' });
      } else {
        await db.query(
          'INSERT INTO reactions (id, message_id, user_id, emoji) VALUES (?, ?, ?, ?)',
          [uuidv4(), message_id, userId, emoji]
        );
        io.to(channel_id).emit('reaction:updated', { message_id, user_id: userId, emoji, action: 'added' });
      }
    });

    socket.on('disconnect', async () => {
      await db.query('UPDATE users SET is_online = 0, last_seen = NOW() WHERE id = ?', [userId]);
      io.emit('user:offline', { user_id: userId });
      console.log(`User disconnected: ${userId}`);
    });
  });
};

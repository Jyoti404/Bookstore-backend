const jwt = require('jsonwebtoken');
const { readUsers } = require('../utils/fileHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = await readUsers();
    const user = users.find(u => u.id === decoded.userId);
    if (!user) return res.status(403).json({ error: 'Invalid token' });

    req.user = user;
    next();
  }
  catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authenticateToken;

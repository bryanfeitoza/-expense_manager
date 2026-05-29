const { verifyAccessToken } = require('../services/tokenService');

function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: true, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.userName = decoded.name;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: true, message: 'Token expired' });
    }
    return res.status(401).json({ error: true, message: 'Invalid token' });
  }
}

module.exports = auth;

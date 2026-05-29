const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { RefreshToken } = require('../models');

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

async function generateRefreshToken(user) {
  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  await RefreshToken.create({
    userId: user.id,
    token: hashedToken,
    expiresAt,
  });

  return token;
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

async function verifyRefreshToken(token) {
  const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const tokenRecord = await RefreshToken.findOne({
    where: { token: hashedToken, revoked: false },
  });

  if (!tokenRecord) {
    throw new Error('Refresh token not found or revoked');
  }

  if (new Date() > new Date(tokenRecord.expiresAt)) {
    await tokenRecord.update({ revoked: true });
    throw new Error('Refresh token expired');
  }

  return { tokenRecord, payload };
}

async function revokeRefreshToken(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const tokenRecord = await RefreshToken.findOne({ where: { token: hashedToken } });

  if (tokenRecord) {
    await tokenRecord.update({ revoked: true });
  }

  return true;
}

async function revokeAllUserTokens(userId) {
  await RefreshToken.update({ revoked: true }, { where: { userId, revoked: false } });
  return true;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
};

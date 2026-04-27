const { verifyAccessToken } = require('../utils/generateToken');
const { errorResponse } = require('../utils/responseHelper');

function extractToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== 'string') return null;
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

function verifyToken(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return errorResponse(res, 'Token tidak ditemukan', 401);
  }
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token kadaluarsa', 401);
    }
    return errorResponse(res, 'Token tidak valid', 401);
  }
}

function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
  } catch (_err) {
    // abaikan: route publik
  }
  return next();
}

module.exports = { verifyToken, optionalAuth };

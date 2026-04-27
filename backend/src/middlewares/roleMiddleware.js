const { errorResponse } = require('../utils/responseHelper');

/**
 * Pembatasan akses berbasis role.
 * Usage: authorize('ADMIN'), authorize('ADMIN', 'GURU'), dst.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Tidak terautentikasi', 401);
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return errorResponse(res, 'Anda tidak memiliki izin untuk mengakses resource ini', 403);
    }
    return next();
  };
}

module.exports = { authorize };

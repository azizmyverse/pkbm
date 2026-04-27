/**
 * Standar response JSON: { success, message, data, meta? }
 */

function successResponse(res, message, data = null, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function errorResponse(res, message, statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
}

function paginatedResponse(res, message, data, page, limit, total) {
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const totalPages = limitNum > 0 ? Math.ceil(total / limitNum) : 0;

  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
  });
}

module.exports = { successResponse, errorResponse, paginatedResponse };

function errorHandler(err, req, res, _next) {
  console.error('Error:', err.message);

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: true,
      message: 'Validation error',
      details: err.errors.map(e => e.message),
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: true,
      message: 'Resource already exists',
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;

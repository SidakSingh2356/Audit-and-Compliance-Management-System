const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

  const response = {
    success: false,
    message: err.message || 'An error occurred',
  };

  if (err.errorCode) {
    response.errorCode = errorCode;
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  console.error(`[${new Date().toISOString()}] Error:`, err);

  res.status(statusCode).json(response);
};

module.exports = errorHandler;

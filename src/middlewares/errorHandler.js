import crypto from 'crypto';

export const errorHandler = (err, req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error details server-side with correlated requestId
  console.error(`[Error ${requestId}] ${req.method} ${req.originalUrl}:`, err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : (err.status || 500);

  // In production, do not leak internal database errors, query details, or stack traces
  let clientMessage = err.message || 'Internal Server Error';
  if (isProduction && statusCode === 500) {
    clientMessage = 'An unexpected server error occurred. Please try again later.';
  }

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    requestId,
    ...(isProduction ? {} : { stack: err.stack })
  });
};

export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`
  });
};



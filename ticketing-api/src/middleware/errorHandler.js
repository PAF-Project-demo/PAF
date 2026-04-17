export function notFoundHandler(req, _res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  const status = error.status ?? 500;
  const payload = {
    message: error.message ?? "Internal server error.",
  };

  if (error.details) {
    payload.details = error.details;
  }

  res.status(status).json(payload);
}

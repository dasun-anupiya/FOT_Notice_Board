export default function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  console.error(`Responding with status ${status}: ${message}`);
  res.status(status).json({ message, ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) });
}

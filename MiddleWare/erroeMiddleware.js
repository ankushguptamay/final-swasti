const sendError = (res, statusCode, msg, data) => {
  const statusCode = statusCode || 500;
  const message = message || "Internal Server Error";
  const data = data || null; // Include additional data if present

  res.status(statusCode).json({
    success: false,
    message,
    ...(data && { data }), // Only add `data` field if it's not null
  });
};

export { sendError };

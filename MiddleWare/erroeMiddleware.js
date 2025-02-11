const sendError = (res, statusCode, msg, resData) => {
  const code = statusCode || 500;
  const message = message || "Internal Server Error";
  const data = resData || null; // Include additional data if present

  res.status(code).json({
    success: false,
    message,
    ...(data && { data }), // Only add `data` field if it's not null
  });
};

export { sendError };

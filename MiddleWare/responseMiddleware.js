const failureResponse = (
  res,
  statusCode = 500,
  message = "Oops! Something went wrong on our end. We're fixing it — please try again in a few minutes.",
  data = null
) => {
  res.status(statusCode).json({
    success: false,
    message,
    ...(data && { data }), // Only add `data` field if it's not null
  });
};

const successResponse = (
  res,
  statusCode = 200,
  message = "Successfully done!",
  data = null
) => {
  res.status(statusCode).json({
    success: true,
    message,
    ...(data && { data }),
  });
};

export { failureResponse, successResponse };

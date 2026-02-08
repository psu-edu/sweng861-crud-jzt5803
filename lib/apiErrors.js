const { NextResponse } = require('next/server');

class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message, details = null) {
    return new ApiError(409, message, details);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(429, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message);
  }
}

function handleApiError(error) {
  console.error(`[Error] ${error.message}`, {
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });

  if (error.name === 'SequelizeValidationError') {
    return NextResponse.json(
      {
        error: 'Validation error',
        details: error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return NextResponse.json(
      {
        error: 'Duplicate entry',
        details: error.errors.map((e) => ({
          field: e.path,
          message: `${e.path} already exists`,
        })),
      },
      { status: 409 }
    );
  }

  if (error.name === 'SequelizeDatabaseError') {
    return NextResponse.json(
      {
        error: 'Database error',
        message:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'An error occurred while processing your request',
      },
      { status: 500 }
    );
  }

  if (error.name === 'JsonWebTokenError') {
    return NextResponse.json(
      { error: 'Invalid token', message: 'The provided token is invalid' },
      { status: 401 }
    );
  }

  if (error.name === 'TokenExpiredError') {
    return NextResponse.json(
      {
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.',
      },
      { status: 401 }
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.statusCode }
    );
  }

  if (error.isAxiosError) {
    const status = error.response?.status || 502;
    return NextResponse.json(
      {
        error: 'External API error',
        message:
          error.response?.data?.message || 'Failed to fetch external data',
      },
      { status }
    );
  }

  const statusCode = error.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'development'
      ? error.message
      : 'An unexpected error occurred';

  return NextResponse.json(
    {
      error: 'Server error',
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
    { status: statusCode }
  );
}

module.exports = { ApiError, handleApiError };

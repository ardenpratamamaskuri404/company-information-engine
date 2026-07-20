import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/common.types';
import { formatError } from '../utils/responseFormatter';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(formatError(err.message, err.errorCode));
  }

  
  console.error('Unhandled Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred';
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  return res.status(status).json(formatError(message, errorCode));
};

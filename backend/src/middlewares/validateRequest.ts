import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/common.types';

export const validateWebsiteBody = (req: Request, res: Response, next: NextFunction) => {
  const { url } = req.body;
  if (!url) {
    throw new AppError('URL is required', 400, 'VALIDATION_ERROR');
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (err) {
    throw new AppError('Invalid URL format', 400, 'VALIDATION_ERROR');
  }

  next();
};

export const validateDomainBody = (req: Request, res: Response, next: NextFunction) => {
  const { domain } = req.body;
  if (!domain) {
    throw new AppError('Domain is required', 400, 'VALIDATION_ERROR');
  }

  // Domain name regex without protocol/path
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
  if (!domainRegex.test(domain)) {
    throw new AppError('Invalid domain format. Domain should not include protocols (e.g. http://) or paths.', 400, 'VALIDATION_ERROR');
  }

  next();
};

export const validateLocationBody = (req: Request, res: Response, next: NextFunction) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string' || query.trim() === '') {
    throw new AppError('Query is required and cannot be empty', 400, 'VALIDATION_ERROR');
  }

  next();
};

export const validateCompanyQuery = (req: Request, res: Response, next: NextFunction) => {
  const { domain } = req.query;
  if (!domain || typeof domain !== 'string' || domain.trim() === '') {
    throw new AppError('Domain query parameter is required', 400, 'VALIDATION_ERROR');
  }

  // Domain regex
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
  if (!domainRegex.test(domain)) {
    throw new AppError('Invalid domain format in query parameter.', 400, 'VALIDATION_ERROR');
  }

  next();
};

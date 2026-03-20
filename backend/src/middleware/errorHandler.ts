import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
  const status = err.statusCode ?? 500;
  const code = err.code ?? 'INTERNAL_ERROR';
  const message = status === 500 ? 'Internal server error' : err.message;

  if (status === 500) {
    console.error('[ERROR]', err);
  }

  res.status(status).json({
    error: {
      code,
      message,
      details: (err as any).details,
    },
  });
}

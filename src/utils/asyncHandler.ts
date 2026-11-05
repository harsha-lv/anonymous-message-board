import type { NextFunction, Request, RequestHandler, Response } from 'express';

export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Wraps an async route handler so rejected promises are forwarded to Express's
 * error handler instead of becoming unhandled rejections.
 */
export const asyncHandler = (handler: AsyncRequestHandler): RequestHandler => {
  return (req, res, next): void => {
    void handler(req, res, next).catch(next);
  };
};

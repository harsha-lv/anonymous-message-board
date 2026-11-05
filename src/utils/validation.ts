import type { Request } from 'express';
import { validationResult } from 'express-validator';
import type { FormError } from '../types';

/** Converts express-validator results into the simple shape the views expect. */
export const getFormErrors = (req: Request): FormError[] => {
  return validationResult(req)
    .array()
    .map((error) => {
      const path = 'path' in error && typeof error.path === 'string' ? error.path : '';
      return { path, msg: String(error.msg) };
    });
};

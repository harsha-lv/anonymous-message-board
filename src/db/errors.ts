/** Shape of the error object produced by the `pg` driver. */
export interface PostgresError {
  code?: string;
  constraint?: string;
  detail?: string;
  message?: string;
}

/** Type guard for errors thrown by the PostgreSQL driver. */
export const isPostgresError = (error: unknown): error is PostgresError =>
  typeof error === 'object' && error !== null;

/**
 * PostgreSQL error code 23505 = unique_violation.
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const isUniqueViolation = (error: unknown): error is PostgresError & { code: '23505' } =>
  isPostgresError(error) && error.code === '23505';

/** Returns the name of the unique constraint that was violated, if available. */
export const getViolatedConstraint = (error: PostgresError): string =>
  (error.constraint ?? error.detail ?? '').toLowerCase();

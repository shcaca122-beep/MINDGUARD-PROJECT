export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }

    if ('error' in error && error.error && typeof error.error === 'object') {
      const nested = error.error as { message?: unknown };
      if (typeof nested.message === 'string') return nested.message;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return Object.prototype.toString.call(error);
    }
  }

  return String(error);
}

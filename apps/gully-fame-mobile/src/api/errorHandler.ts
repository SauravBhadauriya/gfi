/**
 * Enhanced Error Handler with Exponential Backoff & Recovery
 * Handles API errors, retries, and user-friendly error messages
 */

import { AxiosError } from 'axios';

export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED_ERROR',
  FORBIDDEN = 'FORBIDDEN_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  CONFLICT = 'CONFLICT_ERROR',
  SERVER = 'SERVER_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}

export interface ErrorResponse {
  type: ErrorType;
  code: number;
  message: string;
  userMessage: string; // User-friendly message
  details?: Record<string, any>;
  isRetryable: boolean;
  suggestedAction?: string;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
};

/**
 * Calculate exponential backoff delay with jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const exponentialDelay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelayMs
  );

  // Add jitter: ±10% of delay
  const jitter = exponentialDelay * config.jitterFactor * (Math.random() * 2 - 1);
  return Math.max(0, exponentialDelay + jitter);
}

/**
 * Determine if error is retryable
 */
function isRetryableError(status?: number, error?: AxiosError): boolean {
  // Network errors are retryable
  if (!status && (error as any)?.isAxiosError) {
    const code = (error as any)?.code;
    return code === 'ECONNABORTED' || code === 'ECONNREFUSED' || code === 'ETIMEDOUT';
  }

  // Retryable HTTP status codes
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  return status ? retryableStatuses.includes(status) : false;
}

/**
 * Get user-friendly error message
 */
function getUserFriendlyMessage(type: ErrorType, originalMessage?: string): string {
  const messages: Record<ErrorType, string> = {
    [ErrorType.NETWORK]: 'Unable to connect. Please check your internet and try again.',
    [ErrorType.TIMEOUT]: 'Request took too long. Please try again.',
    [ErrorType.UNAUTHORIZED]: 'Your session has expired. Please log in again.',
    [ErrorType.FORBIDDEN]: 'You don\'t have permission to perform this action.',
    [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
    [ErrorType.CONFLICT]: 'This action conflicts with existing data. Please refresh and try again.',
    [ErrorType.SERVER]: 'Server error. Our team is looking into it. Please try again later.',
    [ErrorType.VALIDATION]: 'Please check your input and try again.',
    [ErrorType.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
    [ErrorType.UNKNOWN]: 'Something went wrong. Please try again.',
  };

  return messages[type] || originalMessage || messages[ErrorType.UNKNOWN];
}

/**
 * Get suggested recovery action
 */
function getSuggestedAction(type: ErrorType): string | undefined {
  const actions: Partial<Record<ErrorType, string>> = {
    [ErrorType.NETWORK]: 'Tap to retry',
    [ErrorType.TIMEOUT]: 'Tap to retry',
    [ErrorType.UNAUTHORIZED]: 'Go to login',
    [ErrorType.FORBIDDEN]: 'Go back',
    [ErrorType.RATE_LIMIT]: 'Wait and try again',
    [ErrorType.SERVER]: 'Try again later',
  };

  return actions[type];
}

/**
 * Parse Axios error and return structured error response
 */
export function parseError(error: unknown): ErrorResponse {
  const axiosError = error as AxiosError;
  const status = axiosError?.response?.status;
  const data = (axiosError?.response?.data as any) || {};

  // Determine error type
  let type: ErrorType = ErrorType.UNKNOWN;

  if (!axiosError?.response) {
    // Network error
    const code = (error as any)?.code;
    if (code === 'ECONNABORTED') type = ErrorType.TIMEOUT;
    else type = ErrorType.NETWORK;
  } else {
    switch (status) {
      case 400:
        type = ErrorType.VALIDATION;
        break;
      case 401:
        type = ErrorType.UNAUTHORIZED;
        break;
      case 403:
        type = ErrorType.FORBIDDEN;
        break;
      case 404:
        type = ErrorType.NOT_FOUND;
        break;
      case 409:
        type = ErrorType.CONFLICT;
        break;
      case 429:
        type = ErrorType.RATE_LIMIT;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        type = ErrorType.SERVER;
        break;
    }
  }

  const message = data?.message || axiosError?.message || 'Unknown error';
  const userMessage = getUserFriendlyMessage(type, message);
  const suggestedAction = getSuggestedAction(type);
  const isRetryable = isRetryableError(status, axiosError);

  return {
    type,
    code: status || -1,
    message,
    userMessage,
    details: data?.errors || { originalError: message },
    isRetryable,
    suggestedAction,
  };
}

/**
 * Determine if should retry based on error and attempt count
 */
export function shouldRetry(error: unknown, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) return false;

  const parsed = parseError(error);
  return parsed.isRetryable;
}

/**
 * Exponential backoff retry handler
 */
export async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!shouldRetry(error, attempt, finalConfig.maxRetries)) {
        throw error;
      }

      const delay = calculateBackoffDelay(attempt, finalConfig);
      console.log(
        `[RetryHandler] Attempt ${attempt + 1}/${finalConfig.maxRetries + 1} failed. Retrying in ${delay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

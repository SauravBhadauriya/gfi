/**
 * Custom hook for handling API and runtime errors
 * Provides error mapping and fallback UI selection
 */

import { useCallback } from 'react';
import {
  NetworkErrorFallback,
  PermissionErrorFallback,
  ServerErrorFallback,
  TimeoutErrorFallback,
  NotFoundFallback,
  EmptyStateFallback,
} from '@/components/ErrorFallbacks';

export interface ApiError {
  status?: number;
  message?: string;
  isNetworkError?: boolean;
  originalError?: Error;
}

export type ErrorType =
  | 'network'
  | 'permission'
  | 'timeout'
  | 'notfound'
  | 'server'
  | 'unknown';

export interface ErrorHandlerConfig {
  onRetry?: () => void;
  onHome?: () => void;
  customMessage?: string;
}

export const useErrorHandler = () => {
  /**
   * Determine error type from API error object
   */
  const getErrorType = useCallback((error: ApiError): ErrorType => {
    if (error.isNetworkError) {
      return 'network';
    }

    if (error.status === 408 || error.status === 504) {
      return 'timeout';
    }

    if (error.status === 404) {
      return 'notfound';
    }

    if (error.status && error.status >= 500) {
      return 'server';
    }

    if (error.status === 403) {
      return 'permission';
    }

    return 'unknown';
  }, []);
  /**
   * Get error message for display
   */
  const getErrorMessage = useCallback((error: ApiError, errorType: ErrorType): string => {
    switch (errorType) {
      case 'network':
        return error.message || 'Unable to connect. Please check your internet connection.';
      case 'timeout':
        return error.message || 'The request took too long. Please try again.';
      case 'notfound':
        return error.message || 'The requested resource was not found.';
      case 'server':
        return error.message || `Server error (${error.status}). Please try again later.`;
      case 'permission':
        return error.message || 'You do not have permission to perform this action.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }, []);
  /**
   * Get appropriate fallback UI component for error
   */
  const getErrorFallback = useCallback(
    (error: ApiError, config: ErrorHandlerConfig = {}) => {
      const errorType = getErrorType(error);
      const message = config.customMessage || getErrorMessage(error, errorType);      switch (errorType) {
        case 'network':
          return {
            component: NetworkErrorFallback,
            props: {
              message,
              onRetry: config.onRetry,
            },
          }

        case 'timeout':
          return {
            component: TimeoutErrorFallback,
            props: {
              message,
              onRetry: config.onRetry,
            },
          }

        case 'notfound':
          return {
            component: NotFoundFallback,
            props: {
              message,
              onHome: config.onHome,
            },
          }

        case 'server':
          return {
            component: ServerErrorFallback,
            props: {
              statusCode: error.status || 500,
              message,
              onRetry: config.onRetry,
            },
          }

        case 'permission':
          return {
            component: PermissionErrorFallback,
            props: {
              permission: 'Access',
              message,
              onRetry: config.onRetry,
            },
          };

        default:
          return {
            component: EmptyStateFallback,
            props: {
              emoji: '⚠️',
              title: 'Error',
              message,
              actionLabel: 'Try Again',
              onAction: config.onRetry,
            },
          };
      }
    },
    [getErrorType, getErrorMessage]
  );

  /**
   * Check if error is recoverable
   */
  const isRecoverable = useCallback((error: ApiError): boolean => {
    const errorType = getErrorType(error);
    // Network, timeout, and server errors are recoverable (user can retry)
    return ['network', 'timeout', 'server'].includes(errorType);
  }, [getErrorType]);

  /**
   * Check if error is critical (should show error boundary)
   */
  const isCritical = useCallback((error: ApiError): boolean => {
    // Only server errors (5xx) that aren't temporary are critical
    const errorType = getErrorType(error);
    return errorType === 'server' && (error.status || 500) >= 503;
  }, [getErrorType]);

  return {
    getErrorType,
    getErrorMessage,
    getErrorFallback,
    isRecoverable,
    isCritical,
  };
}

export default useErrorHandler;

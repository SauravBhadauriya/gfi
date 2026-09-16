/**
 * Custom Hook for API Calls with Error Handling
 * Provides loading, error, and retry states
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ErrorResponse, parseError, retryWithExponentialBackoff, RetryConfig } from '@/api/errorHandler';

interface ApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: ErrorResponse | null;
  retrying: boolean;
}

interface UseApiCallOptions extends Partial<RetryConfig> {
  onSuccess?: (data: any) => void;
  onError?: (error: ErrorResponse) => void;
  autoExecute?: boolean;
}

/**
 * Hook for making API calls with automatic error handling
 */
export function useApiCall<T = any>(
  apiFunction: () => Promise<T>,
  options: UseApiCallOptions = {}
) {
  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
    retrying: false,
  });

  const retriesRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (shouldRetry = true) => {
      if (!isMountedRef.current) return;

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        retrying: false,
      }));

      try {
        let data: T;

        if (shouldRetry && options.maxRetries && options.maxRetries > 0) {
          data = await retryWithExponentialBackoff(apiFunction, {
            maxRetries: options.maxRetries || 3,
            initialDelayMs: options.initialDelayMs || 500,
            maxDelayMs: options.maxDelayMs || 10000,
            backoffMultiplier: options.backoffMultiplier || 2,
            jitterFactor: options.jitterFactor || 0.1,
          });
        } else {
          data = await apiFunction();
        }

        if (!isMountedRef.current) return;

        setState({
          data,
          loading: false,
          error: null,
          retrying: false,
        });

        options.onSuccess?.(data);
        retriesRef.current = 0;
      } catch (error) {
        if (!isMountedRef.current) return;

        const errorResponse = parseError(error);

        setState({
          data: null,
          loading: false,
          error: errorResponse,
          retrying: false,
        });

        options.onError?.(errorResponse);
      }
    },
    [apiFunction, options]
  );

  const retry = useCallback(async () => {
    if (!isMountedRef.current) return;

    setState((prev) => ({
      ...prev,
      retrying: true,
    }));

    retriesRef.current += 1;
    await execute(true);
  }, [execute]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      retrying: false,
    });
    retriesRef.current = 0;
  }, []);

  useEffect(() => {
    if (options.autoExecute) {
      execute();
    }
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
    retryCount: retriesRef.current,
  };
}

/**
 * Hook for pagination with API calls
 */
interface UsePaginationOptions extends UseApiCallOptions {
  pageSize?: number;
}

export function useApiPagination<T = any>(
  apiFunction: (page: number, pageSize: number) => Promise<{ data: T[]; totalPages: number }>,
  options: UsePaginationOptions = {}
) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = options.pageSize || 10;

  const { data, loading, error, execute, retry } = useApiCall(
    () => apiFunction(currentPage, pageSize),
    {
      ...options,
      autoExecute: true,
    }
  );

  const loadMore = useCallback(() => {
    if (data?.totalPages && currentPage < data.totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [data?.totalPages, currentPage]);

  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    data: data?.data || [],
    totalPages: data?.totalPages || 1,
    currentPage,
    loading,
    error,
    loadMore,
    reset,
    retry,
    hasMore: currentPage < (data?.totalPages || 1),
  };
}

/**
 * Hook for form submission with API calls
 */
interface UseFormSubmitOptions extends UseApiCallOptions {
  debounceMs?: number;
}

export function useFormSubmit<T = any>(
  apiFunction: (formData: any) => Promise<T>,
  options: UseFormSubmitOptions = {}
) {
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const { data, loading, error, execute, retry, reset } = useApiCall(apiFunction, options);

  const submit = useCallback(
    (formData: any) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        execute();
      }, options.debounceMs || 0);
    },
    [execute, options.debounceMs]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    submit,
    retry,
    reset,
  };
}

import { AxiosError } from 'axios';

export interface ApiResponse<T = any> {
  success: boolean;
  code?: number;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ApiErrorResponse {
  message: string;
  status: number;
  data?: any;
  errors?: Record<string, string[]>;
}

export interface CustomApiError extends Error {
  message: string;
  status: number | null;
  data: any;
  originalError: AxiosError;
}

export interface RequestConfig {
  skipAuth?: boolean;
  timeout?: number;
}

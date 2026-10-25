import { getAuthHeaders } from './authApi';
import type { ApiResponse } from './apiTypes';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend.gullyfame.com/v1/api/';



export interface Report {
  id: string;
  _id?: string;
  userId?: string;
  reportedUserId?: string;
  reportedContentId?: string;
  type: 'USER' | 'CONTENT' | 'COMPETITION' | string;
  reason?: string;
  description?: string;
  status: 'PENDING' | 'RESOLVED' | 'REJECTED' | string;
  resolutionNotes?: string;
  reportedBy?: {
    id: string;
    name?: string;
    email?: string;
  };
  reportedUser?: {
    id: string;
    name?: string;
    email?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface UpdateReportStatusRequest {
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  resolutionNotes?: string;
}

export interface ReportsListParams {
  page?: number;
  limit?: number;
  type?: 'USER' | 'CONTENT' | 'COMPETITION';
  status?: 'PENDING' | 'RESOLVED' | 'REJECTED';
  userId?: string;
}

export interface ReportsListResponse {
  reports: Report[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}








function parseApiResponse<T>(response: any): { success: boolean; data?: T; message?: string } {
  const success = response.code === 1 || response.rCode === 1;
  const payload = response.data || response.rData;
  const message = response.message || response.msg;

  return {
    success,
    data: payload,
    message,
  };
}

async function makeRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  body?: any
): Promise<ApiResponse<T>> {
  const startTime = Date.now();
  const logPrefix = `[reportsApi] ${method} ${endpoint}`;
  
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${logPrefix} - Starting request`);
      if (body) {
        console.log(`${logPrefix} - Request body:`, JSON.stringify(body, null, 2));
      }
    }

    const url = `${BASE_URL}${endpoint}`;
    const headers = getAuthHeaders();
    headers['Content-Type'] = 'application/json';

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
      options.body = JSON.stringify(body);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`${logPrefix} - Full URL:`, url);
      console.log(`${logPrefix} - Request headers:`, { ...headers, Authorization: headers.Authorization ? 'Bearer ***' : undefined });
    }

    const response = await fetch(url, options);
    const responseTime = Date.now() - startTime;
    const responseData = await response.json();

    if (process.env.NODE_ENV === 'development') {
      console.log(`${logPrefix} - Response received in ${responseTime}ms`);
      console.log(`${logPrefix} - Response status:`, response.status);
      console.log(`${logPrefix} - Response data:`, JSON.stringify(responseData, null, 2));
    }

    const parsed = parseApiResponse<T>(responseData);

    if (parsed.success && parsed.data) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`${logPrefix} - ✅ Success:`, {
          hasData: !!parsed.data,
          dataType: Array.isArray(parsed.data) ? 'array' : typeof parsed.data,
          arrayLength: Array.isArray(parsed.data) ? parsed.data.length : undefined,
          message: parsed.message,
        });
      }
      return {
        success: true,
        data: parsed.data as T,
        message: parsed.message || 'Request successful',
      };
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn(`${logPrefix} - ⚠️ Unsuccessful response:`, {
        success: parsed.success,
        message: parsed.message,
        hasData: !!parsed.data,
      });
    }

    return {
      success: false,
      message: parsed.message || 'Request failed',
      error: 'API returned unsuccessful response',
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error(`${logPrefix} - ❌ Error after ${responseTime}ms:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return {
      success: false,
      message: error.message || 'Network error occurred',
      error: error.message || 'Network error',
    };
  }
}







export async function getReports(
  params?: ReportsListParams
): Promise<ApiResponse<ReportsListResponse>> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.type) queryParams.append('type', params.type);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.userId) queryParams.append('userId', params.userId);

  const endpoint = `admin/reports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await makeRequest<any>('GET', endpoint);

  if (response.success && response.data) {
    const reportsData = response.data.reports || response.data.items || (Array.isArray(response.data) ? response.data : []);
    const reports = reportsData.map((report: any) => ({
      ...report,
      id: report.id || report._id || '',
      userId: report.userId || report.reportedBy?._id || report.reportedBy?.id,
      reportedUserId: report.reportedUserId || report.reportedUser?._id || report.reportedUser?.id,
    }));

    const pagination = response.data.pagination || {
      total: reports.length,
      page: params?.page || 1,
      limit: params?.limit || 20,
      totalPages: Math.ceil(reports.length / (params?.limit || 20)),
    };

    return {
      success: true,
      data: {
        reports,
        pagination,
      },
      message: response.message || 'Reports fetched successfully',
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to fetch reports',
    error: response.error || 'API returned unsuccessful response',
  };
}





export async function updateReportStatus(
  reportId: string,
  data: UpdateReportStatusRequest
): Promise<ApiResponse<Report>> {
  const endpoint = `admin/reports/${reportId}/status`;
  const response = await makeRequest<Report>('PUT', endpoint, data);

  if (response.success && response.data) {
    return {
      success: true,
      data: {
        ...response.data,
        id: response.data.id || response.data._id || reportId,
      },
      message: response.message || 'Report status updated successfully',
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to update report status',
    error: response.error || 'API returned unsuccessful response',
  };
}


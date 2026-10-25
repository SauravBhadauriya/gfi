import { getAuthHeaders } from './authApi';
import type { ApiResponse } from './apiTypes';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend.gullyfame.com/v1/api/';



export interface Earnings {
  id: string;
  _id?: string;
  userId?: string | null;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  category: string;
  competitionId?: {
    _id: string;
    title: string;
  } | string;
  description?: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface Winner {
  id: string;
  _id?: string;
  userId: string;
  userName?: string;
  userImage?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  totalEarnings?: number;
  totalWinnings?: number;
  competitionsWon?: number;
  rank?: number;
  [key: string]: any;
}

export interface TopEarner extends Winner {
  totalEarnings: number;
  competitionsWon: number;
}

export interface EarningsListParams {
  page?: number;
  limit?: number;
  userId?: string;
  type?: 'CREDIT' | 'DEBIT';
  category?: string;
  status?: string;
  competitionId?: string;
}

export interface EarningsListResponse {
  items: Earnings[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
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
  const logPrefix = `[earningsApi] ${method} ${endpoint}`;
  
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







export async function getEarnings(
  params?: EarningsListParams
): Promise<ApiResponse<EarningsListResponse>> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.userId) queryParams.append('userId', params.userId);
  if (params?.type) queryParams.append('type', params.type);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.competitionId) queryParams.append('competitionId', params.competitionId);

  const endpoint = `admin/earnings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await makeRequest<any>('GET', endpoint);

  if (response.success && response.data) {
    const items = (Array.isArray(response.data) ? response.data : response.data.reports || response.data.items || []).map((earning: any) => ({
      ...earning,
      id: earning.id || earning._id || '',
      userId: earning.userId || null,
      competitionId: earning.competitionId || undefined,
    }));

    const pagination = response.data.pagination || {
      total: items.length,
      page: params?.page || 1,
      limit: params?.limit || 20,
      totalPages: Math.ceil(items.length / (params?.limit || 20)),
    };

    return {
      success: true,
      data: {
        items,
        total: pagination.total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: pagination.totalPages,
      },
      message: response.message || 'Earnings fetched successfully',
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to fetch earnings',
    error: response.error || 'API returned unsuccessful response',
  };
}





export async function getUserEarnings(
  userId: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<EarningsListResponse>> {
  return getEarnings({
    ...params,
    userId,
  });
}





export async function getWinners(): Promise<ApiResponse<Winner[]>> {
  const endpoint = 'admin/winners';
  const response = await makeRequest<Winner[]>('GET', endpoint);

  if (response.success && response.data) {
    const winners = (Array.isArray(response.data) ? response.data : []).map((winner: any) => ({
      ...winner,
      id: winner.id || winner._id || '',
      userId: winner.userId || winner.user?._id || winner.user?.id || '',
      userName: winner.userName || (winner.user?.firstName && winner.user?.lastName 
        ? `${winner.user.firstName} ${winner.user.lastName}` 
        : winner.user?.email || ''),
      userImage: winner.userImage || winner.user?.profileImage || winner.profileImage,
    }));

    return {
      success: true,
      data: winners,
      message: response.message || 'Winners fetched successfully',
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to fetch winners',
    error: response.error || 'API returned unsuccessful response',
  };
}





export async function getTopEarners(): Promise<ApiResponse<TopEarner[]>> {
  const endpoint = 'admin/winners/top-earners';
  const response = await makeRequest<TopEarner[]>('GET', endpoint);

  if (response.success && response.data) {
    const topEarners = (Array.isArray(response.data) ? response.data : []).map((earner: any, index: number) => ({
      ...earner,
      id: earner.id || earner._id || '',
      userId: earner.userId || earner.user?._id || earner.user?.id || '',
      userName: earner.userName || (earner.user?.firstName && earner.user?.lastName 
        ? `${earner.user.firstName} ${earner.user.lastName}` 
        : earner.user?.email || ''),
      userImage: earner.userImage || earner.user?.profileImage || earner.profileImage,
      totalEarnings: earner.totalEarnings || 0,
      competitionsWon: earner.competitionsWon || 0,
      rank: earner.rank || index + 1,
    }));

    return {
      success: true,
      data: topEarners,
      message: response.message || 'Top earners fetched successfully',
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to fetch top earners',
    error: response.error || 'API returned unsuccessful response',
  };
}


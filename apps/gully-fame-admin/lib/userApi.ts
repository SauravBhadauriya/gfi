import { getAuthHeaders } from './authApi';
import type { ApiResponse } from './apiTypes';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend.gullyfame.com/v1/api/';



export interface User {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  role: string;
  status: 'active' | 'inactive' | 'banned' | 'pending';
  kycStatus?: 'pending' | 'approved' | 'rejected' | 'completed';
  profileImage?: string;
  createdAt: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface UserDetail extends User {
  followers?: number;
  following?: number;
  totalEarnings?: number;
  totalTips?: number;
  bio?: string;
  dob?: string;
  gender?: string;
  [key: string]: any;
}

export interface KycDocument {
  documentType: string;
  documentNumber: string;
  frontImage?: string;
  backImage?: string;
  selfieImage?: string;
  [key: string]: any;
}

export interface KycStatus {
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  rejectionReason?: string;
  documents?: KycDocument[];
  submittedAt?: string;
  reviewedAt?: string;
  [key: string]: any;
}

export interface UserEarning {
  id: string;
  type: string;
  amount: number;
  description?: string;
  createdAt: string;
  [key: string]: any;
}

export interface UserEarningsResponse {
  items: UserEarning[];
  total: number;
  totalEarnings?: number;
  [key: string]: any;
}

export interface UpdateUserStatusRequest {
  status: 'active' | 'inactive' | 'banned';
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface UpdateKycRequest {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}



async function makeRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  body?: any
): Promise<ApiResponse<T>> {
  const startTime = Date.now();
  const logPrefix = `[userApi] ${method} ${endpoint}`;
  
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${logPrefix} - Starting request`);
      if (body) {
        console.log(`${logPrefix} - Request body:`, JSON.stringify(body, null, 2));
      }
    }

    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const headers = getAuthHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`${logPrefix} - Full URL:`, url);
      console.log(`${logPrefix} - Request headers:`, { ...headers, Authorization: headers.Authorization ? 'Bearer ***' : undefined });
    }

    const httpResponse = await fetch(url, options);
    const responseTime = Date.now() - startTime;
    const responseText = await httpResponse.text();

    if (process.env.NODE_ENV === 'development') {
      console.log(`${logPrefix} - Response received in ${responseTime}ms`);
      console.log(`${logPrefix} - Response status:`, httpResponse.status);
      console.log(`${logPrefix} - Response text:`, responseText);
    }

    let responseData: any;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error(`${logPrefix} - ❌ Parse error:`, parseError);
      
      if (!httpResponse.ok) {
        return {
          success: false,
          message: `Failed: ${httpResponse.statusText} (Status: ${httpResponse.status})`,
          error: `HTTP ${httpResponse.status}`,
        };
      }

      return {
        success: false,
        message: 'Invalid response format from server',
        error: 'INVALID_JSON',
      };
    }

    const successFlag = responseData.code === 1 || responseData.rCode === 1;

    if (!httpResponse.ok || !successFlag) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`${logPrefix} - ⚠️ API Error:`, {
          status: httpResponse.status,
          successFlag,
          responseData: JSON.stringify(responseData, null, 2),
        });
      }
      return {
        success: false,
        message:
          responseData.message ||
          responseData.msg ||
          responseData.error ||
          `Failed with status ${httpResponse.status}`,
        error: responseData.error || `HTTP ${httpResponse.status}`,
        data: responseData.data || responseData.rData,
      };
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`${logPrefix} - ✅ Success:`, {
        hasData: !!(responseData.data || responseData.rData),
        dataType: Array.isArray(responseData.data || responseData.rData) ? 'array' : typeof (responseData.data || responseData.rData),
        arrayLength: Array.isArray(responseData.data || responseData.rData) ? (responseData.data || responseData.rData).length : undefined,
        message: responseData.message || responseData.msg,
      });
    }
    
    return {
      success: true,
      message: responseData.message || responseData.msg || 'Success',
      data: (responseData.data || responseData.rData) as T,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error(`${logPrefix} - ❌ Network error after ${responseTime}ms:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return {
      success: false,
      message: error.message || 'Network error occurred',
      error: error.message || 'NETWORK_ERROR',
    };
  }
}



export async function getUsers(params?: UserListParams): Promise<ApiResponse<UserListResponse>> {
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  
  let queryParams = `page=${page}&limit=${limit}`;
  if (params?.search) queryParams += `&search=${encodeURIComponent(params.search)}`;
  if (params?.status) queryParams += `&status=${encodeURIComponent(params.status)}`;
  if (params?.role) queryParams += `&role=${encodeURIComponent(params.role)}`;
  
  const endpoint = `${BASE_URL}admin/users?${queryParams}`;
  const result = await makeRequest<any>('GET', endpoint);
  
  if (result.success && result.data) {
    const data = result.data;
    let items: User[] = [];
    
    if (Array.isArray(data)) {
      items = data;
    } else if (Array.isArray(data.items)) {
      items = data.items;
    } else if (Array.isArray(data.users)) {
      items = data.users;
    }
    
    return {
      success: true,
      message: result.message || 'Users fetched successfully',
      data: {
        items,
        total: data.total || items.length,
        page: data.page || page,
        limit: data.limit || limit,
        totalPages: data.totalPages || Math.ceil((data.total || items.length) / limit),
      },
    };
  }
  
  return result as ApiResponse<UserListResponse>;
}



export async function getUserById(userId: string): Promise<ApiResponse<UserDetail>> {
  const endpoint = `${BASE_URL}admin/users/${userId}`;
  const result = await makeRequest<any>('GET', endpoint);
  
  if (result.success && result.data) {
    const user = result.data.user || result.data;
    return {
      success: true,
      message: result.message || 'User fetched successfully',
      data: {
        ...user,
        id: user.id || user._id,
      } as UserDetail,
    };
  }
  
  return result as ApiResponse<UserDetail>;
}



export async function updateUserStatus(
  userId: string,
  status: 'active' | 'inactive' | 'banned'
): Promise<ApiResponse<User>> {
  const endpoint = `${BASE_URL}admin/users/${userId}/status`;
  return makeRequest<User>('PUT', endpoint, { status });
}



export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<ApiResponse<{ message: string }>> {
  const endpoint = `${BASE_URL}admin/users/${userId}/reset-password`;
  return makeRequest<{ message: string }>('POST', endpoint, { newPassword });
}



export async function getUserKyc(userId: string): Promise<ApiResponse<KycStatus>> {
  const endpoint = `${BASE_URL}admin/users/${userId}/kyc`;
  const result = await makeRequest<any>('GET', endpoint);
  
  if (result.success && result.data) {
    return {
      success: true,
      message: result.message || 'KYC data fetched successfully',
      data: result.data.kyc || result.data,
    };
  }
  
  return result as ApiResponse<KycStatus>;
}



export async function updateUserKyc(
  userId: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<ApiResponse<KycStatus>> {
  const endpoint = `${BASE_URL}admin/users/${userId}/kyc`;
  const body: UpdateKycRequest = { status };
  if (status === 'rejected' && rejectionReason) {
    body.rejectionReason = rejectionReason;
  }
  return makeRequest<KycStatus>('PUT', endpoint, body);
}



export async function getUserEarnings(userId: string): Promise<ApiResponse<UserEarningsResponse>> {
  const endpoint = `${BASE_URL}admin/users/${userId}/earnings`;
  const result = await makeRequest<any>('GET', endpoint);
  
  if (result.success && result.data) {
    const data = result.data;
    let items: UserEarning[] = [];
    
    if (Array.isArray(data)) {
      items = data;
    } else if (Array.isArray(data.items)) {
      items = data.items;
    } else if (Array.isArray(data.earnings)) {
      items = data.earnings;
    }
    
    return {
      success: true,
      message: result.message || 'Earnings fetched successfully',
      data: {
        items,
        total: items.length,
        totalEarnings: data.totalEarnings || data.total || 0,
      },
    };
  }
  
  return result as ApiResponse<UserEarningsResponse>;
}



export const userApi = {
  getUsers,
  getUserById,
  updateUserStatus,
  resetUserPassword,
  getUserKyc,
  updateUserKyc,
  getUserEarnings,
};


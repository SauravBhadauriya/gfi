import { getAuthHeaders } from './authApi';
import type { ApiResponse } from './apiTypes';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend.gullyfame.com/v1/api/';



export interface Sponsor {
  id: string;
  _id?: string;
  email: string;
  role?: string;
  sponsorCode?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CreateSponsorRequest {
  email: string;
  password: string;
}

export interface UpdateSponsorRequest {
  email?: string;
  isActive?: boolean;
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
  const logPrefix = `[sponsorApi] ${method} ${endpoint}`;
  
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







export async function getSponsors(): Promise<ApiResponse<Sponsor[]>> {
  const endpoint = 'admin/sponsors';
  const response = await makeRequest<any>('GET', endpoint);

  if (response.success && response.data) {
    const items = (Array.isArray(response.data) ? response.data : []).map((sponsor: any) => ({
      ...sponsor,
      id: sponsor.id || sponsor._id || '',
    }));

    return {
      success: true,
      data: items,
      message: response.message || 'Sponsors fetched successfully',
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to fetch sponsors',
    error: response.error || 'API returned unsuccessful response',
  };
}





export async function getSponsorById(sponsorId: string): Promise<ApiResponse<Sponsor>> {
  const endpoint = `admin/sponsors/${sponsorId}`;
  const response = await makeRequest<Sponsor>('GET', endpoint);

  if (response.success && response.data) {
    return {
      success: true,
      data: {
        ...response.data,
        id: response.data.id || response.data._id || sponsorId,
      },
      message: response.message || 'Sponsor fetched successfully',
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to fetch sponsor',
    error: response.error || 'API returned unsuccessful response',
  };
}





export async function createSponsor(
  data: CreateSponsorRequest
): Promise<ApiResponse<Sponsor>> {
  const endpoint = 'admin/sponsors';
  const response = await makeRequest<Sponsor>('POST', endpoint, data);

  if (response.success && response.data) {
    return {
      success: true,
      data: {
        ...response.data,
        id: response.data.id || response.data._id || '',
      },
      message: response.message || 'Sponsor created successfully',
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to create sponsor',
    error: response.error || 'API returned unsuccessful response',
  };
}





export async function updateSponsor(
  sponsorId: string,
  data: UpdateSponsorRequest
): Promise<ApiResponse<Sponsor>> {
  const endpoint = `admin/sponsors/${sponsorId}`;
  const response = await makeRequest<Sponsor>('PUT', endpoint, data);

  if (response.success && response.data) {
    return {
      success: true,
      data: {
        ...response.data,
        id: response.data.id || response.data._id || sponsorId,
      },
      message: response.message || 'Sponsor updated successfully',
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to update sponsor',
    error: response.error || 'API returned unsuccessful response',
  };
}





export async function deleteSponsor(
  sponsorId: string,
  email?: string
): Promise<ApiResponse<void>> {
  const endpoint = `admin/sponsors/${sponsorId}`;
  const body = email ? { email } : undefined;
  const response = await makeRequest<void>('DELETE', endpoint, body);

  if (response.success) {
    return {
      success: true,
      message: response.message || 'Sponsor deactivated successfully',
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to deactivate sponsor',
    error: response.error || 'API returned unsuccessful response',
  };
}


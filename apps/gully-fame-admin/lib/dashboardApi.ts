import { getAuthHeaders } from './authApi';
import type { ApiResponse } from './apiTypes';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend.gullyfame.com/v1/api/';

export interface NewUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export interface LatestCompetition {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

export interface ContestJoined {
  _id?: string;
  userId?: string;
  competitionId?: string;
  joinedAt?: string;
  [key: string]: any;
}

export interface NewCompetitionHeld {
  _id: string;
  title: string;
  status: string;
  createdAt: string;
}

export interface RecentActivityResponse {
  newUsers: NewUser[];
  latestCompetitions: LatestCompetition[];
  contestJoined: ContestJoined[];
  totalCompleted: number;
  newCompetitionHeld: NewCompetitionHeld;
}

export interface QuickStatsResponse {
  totalUsers: number;
  activeCompetitions: number;
  totalCompetitions: number;
  activeSponsors: number;
  tipsGiven: number;
  totalReels: number;
}

async function makeGetRequest(apiName: string, endpoint: string): Promise<ApiResponse<any>> {
  const startTime = Date.now();
  const logPrefix = `[dashboardApi] GET ${apiName}`;
  
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${logPrefix} - Starting request`);
      console.log(`${logPrefix} - Full URL:`, endpoint);
    }

    const httpResponse = await fetch(endpoint, {
      method: 'GET',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }),
    });

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
        console.error(`${logPrefix} - ❌ HTTP Error:`, httpResponse.status, httpResponse.statusText);
        return {
          success: false,
          message: `Failed to fetch ${apiName.toLowerCase()}: ${httpResponse.statusText} (Status: ${httpResponse.status})`,
          error: `HTTP ${httpResponse.status}`,
        };
      }

      return {
        success: false,
        message: 'Invalid response format from server',
        error: 'INVALID_JSON',
      };
    }

    
    const isSuccess = 
      responseData.status === true || 
      responseData.code === 1 || 
      responseData.rCode === 1 ||
      (httpResponse.ok && responseData.data !== undefined);

    if (!isSuccess) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`${logPrefix} - ⚠️ API Error:`, {
          status: httpResponse.status,
          responseData: JSON.stringify(responseData, null, 2),
        });
      }
      return {
        success: false,
        message: responseData.message || responseData.msg || responseData.error || `Failed to fetch ${apiName.toLowerCase()} with status ${httpResponse.status}`,
        error: responseData.error || `HTTP ${httpResponse.status}`,
        data: responseData.data || responseData.rData,
      };
    }

    
    const payload = responseData.data || responseData.rData || responseData;
    const message = responseData.message || responseData.msg || `${apiName} fetched successfully`;

    if (process.env.NODE_ENV === 'development') {
      console.log(`${logPrefix} - ✅ Success:`, {
        hasData: !!payload,
        dataType: Array.isArray(payload) ? 'array' : typeof payload,
        arrayLength: Array.isArray(payload) ? payload.length : undefined,
        message,
      });
    }

    return {
      success: true,
      message,
      data: payload,
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

export async function getRecentActivity(): Promise<ApiResponse<RecentActivityResponse>> {
  const endpoint = `${BASE_URL}admin/dashboard/recent-activity`;
  return makeGetRequest('Recent Activity', endpoint);
}

export async function getQuickStats(): Promise<ApiResponse<QuickStatsResponse>> {
  const endpoint = `${BASE_URL}admin/dashboard/quick-stats`;
  return makeGetRequest('Quick Stats', endpoint);
}

export const dashboardApi = {
  getRecentActivity,
  getQuickStats,
};


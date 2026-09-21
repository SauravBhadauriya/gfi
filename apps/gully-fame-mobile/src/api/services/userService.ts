import apiClient from '../axios';
import { ApiResponse } from '../types';
import API_ENDPOINTS from '../endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== Type Definitions ====================

export interface User {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  role: string;
  status?: string;
  kycStatus?: 'pending' | 'approved' | 'rejected' | 'completed';
  profileImage?: string;
  bio?: string;
  dob?: string;
  gender?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface KycStatus {
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  rejectionReason?: string;
  documents?: any[];
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

export interface WalletBalance {
  balance: number;
  totalEarnings?: number;
  totalTips?: number;
  [key: string]: any;
}

// ==================== API Functions ====================

export async function getCurrentUser(): Promise<ApiResponse<User>> {
  try {
    console.log('[userService] GET user/profile');
    
    const response = await apiClient.get<any>('user/profile');
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const userData = responseData.data;
      const user: User = {
        ...userData,
        id: userData.id || userData._id,
      };

      console.log('[userService] GET user/profile - Success:', user);
      return {
        success: true,
        data: user,
        message: responseData.message || 'User profile fetched successfully',
      };
    }

    return {
      success: false,
      message: responseData.message || 'Failed to fetch user profile',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[userService] GET user/profile error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getPublicUserProfile(userId: string): Promise<ApiResponse<User>> {
  try {
    console.log('[userService] GET user profile for userId:', userId);
    
    // Try multiple endpoint variations for public profile
    const endpointsToTry = [
      `users/${userId}/profile`,
      `user/${userId}/profile`,
      `users/${userId}`,
      `user/${userId}`,
    ];

    for (const endpoint of endpointsToTry) {
      try {
        const response = await apiClient.get<any>(endpoint);
        const responseData = response.data as any;

        if (responseData.code === 1 && responseData.data) {
          const userData = responseData.data;
          const user: User = {
            ...userData,
            id: userData.id || userData._id,
          };

          console.log('[userService] GET', endpoint, '- Success:', user);
          return {
            success: true,
            data: user,
            message: responseData.message || 'User profile fetched successfully',
          };
        }
      } catch (endpointError: any) {
        if (endpointError.response?.status === 404) {
          // Try next endpoint
          continue;
        }
        throw endpointError;
      }
    }

    // All endpoints failed
    return {
      success: false,
      message: 'User profile not found',
      error: 'User not found',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[userService] GET public user profile error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function updateUserProfile(data: any): Promise<ApiResponse<User>> {
  try {
    console.log('[userService] PUT user/profile');
    
    const response = await apiClient.put<any>('user/profile', data);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const userData = responseData.data;
      const user: User = {
        ...userData,
        id: userData.id || userData._id,
      };

      console.log('[userService] PUT user/profile - Success:', user);
      return {
        success: true,
        data: user,
        message: responseData.message || 'User profile updated successfully',
      };
    }

    return {
      success: false,
      message: responseData.message || 'Failed to update user profile',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[userService] PUT user/profile error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getUserKycStatus(): Promise<ApiResponse<KycStatus>> {
  try {
    console.log('[userService] GET User KYC Status');
    
    // Get current user ID from storage
    const userId = await AsyncStorage.getItem('userId');
    
    if (!userId) {
      return {
        success: false,
        message: 'User ID not found',
        error: 'NO_USER_ID',
        data: undefined,
      };
    }

    const response = await apiClient.get<any>(API_ENDPOINTS.USER.GET_KYC);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const kyc: KycStatus = responseData.data.kyc || responseData.data;

      console.log('[userService] GET User KYC Status - Success:', kyc);
      return {
        success: true,
        data: kyc,
        message: responseData.message || 'KYC status fetched successfully',
      };
    }

    return {
      success: false,
      message: responseData.message || 'Failed to fetch KYC status',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[userService] GET User KYC Status error:', error.message);
    
    // KYC might not exist yet, return pending status
    if (error.response?.status === 404) {
      return {
        success: true,
        data: {
          status: 'pending',
        } as KycStatus,
        message: 'No KYC submission found',
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getUserEarnings(): Promise<ApiResponse<UserEarning[]>> {
  try {
    console.log('[userService] GET User Earnings');
    
    const response = await apiClient.get<any>(API_ENDPOINTS.USER.GET_EARNINGS);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      let earnings: UserEarning[] = [];
      
      if (Array.isArray(responseData.data)) {
        earnings = responseData.data;
      } else if (Array.isArray(responseData.data.items)) {
        earnings = responseData.data.items;
      } else if (Array.isArray(responseData.data.earnings)) {
        earnings = responseData.data.earnings;
      }

      console.log('[userService] GET User Earnings - Success:', earnings.length, 'items');
      return {
        success: true,
        data: earnings,
        message: responseData.message || 'Earnings fetched successfully',
      };
    }

    return {
      success: false,
      message: responseData.message || 'Failed to fetch earnings',
      error: 'API returned unsuccessful response',
      data: [],
    };
  } catch (error: any) {
    console.error('[userService] GET User Earnings error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: [],
    };
  }
}

export async function getWalletBalance(): Promise<ApiResponse<WalletBalance>> {
  try {
    console.log('[userService] GET Wallet Balance');
    
    const response = await apiClient.get<any>(API_ENDPOINTS.USER.GET_WALLET);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const wallet: WalletBalance = {
        balance: responseData.data.balance || responseData.data.totalBalance || 0,
        totalEarnings: responseData.data.totalEarnings || 0,
        totalTips: responseData.data.totalTips || 0,
        ...responseData.data,
      };

      console.log('[userService] GET Wallet Balance - Success:', wallet);
      return {
        success: true,
        data: wallet,
        message: responseData.message || 'Wallet balance fetched successfully',
      };
    }

    return {
      success: false,
      message: responseData.message || 'Failed to fetch wallet balance',
      error: 'API returned unsuccessful response',
      data: {
        balance: 0,
        totalEarnings: 0,
        totalTips: 0,
      },
    };
  } catch (error: any) {
    console.error('[userService] GET Wallet Balance error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: {
        balance: 0,
        totalEarnings: 0,
        totalTips: 0,
      },
    };
  }
}

export const userService = {
  getCurrentUser,
  getPublicUserProfile,
  updateUserProfile,
  getUserKycStatus,
  getUserEarnings,
  getWalletBalance,
};



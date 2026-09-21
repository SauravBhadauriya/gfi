import apiClient from '../axios';
import { ApiResponse } from '../types';

// ==================== Type Definitions ====================

export interface Banner {
  id: string;
  _id?: string;
  title: string;
  banner: string;
  imageUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface BannersResponse {
  items: Banner[];
  total?: number;
  page?: number;
  limit?: number;
}

// ==================== API Functions ====================



export async function getBanners(params?: {
  page?: number;
  limit?: number;
  type?: string;
}): Promise<ApiResponse<BannersResponse>> {
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const type = params?.type || 'hero';
  // Use public banners endpoint instead of admin endpoint
  const endpoint = `/banners?page=${page}&limit=${limit}&type=${type}`;

  try {
    console.log('[bannerService] GET Banners', { page, limit, type });
    
    // Banners should be publicly accessible - skip authentication
    const response = await apiClient.get<any>(endpoint, {
      skipAuth: false,
    });
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      let payload = responseData.data;
      let rawItems: any[] = [];

      // Handle different response formats
      if (Array.isArray(payload.Banners)) {
        rawItems = payload.Banners;
      } else if (Array.isArray(payload.banners)) {
        rawItems = payload.banners;
      } else if (Array.isArray(payload)) {
        rawItems = payload;
      } else if (Array.isArray(payload.data)) {
        rawItems = payload.data;
      } else if (Array.isArray(payload.items)) {
        rawItems = payload.items;
      }

      const items: Banner[] = rawItems
        .filter((b) => b.isActive !== false) // Only active banners
        .map((b) => ({
          id: b._id?.toString() || b.id?.toString() || '',
          title: b.title || '',
          banner: b.banner || b.imageUrl || '',
          imageUrl: b.banner || b.imageUrl || '',
          isActive: b.isActive !== false,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
          ...b,
        }));

      const result: BannersResponse = {
        items,
        total: payload.total || items.length,
        page: payload.page || page,
        limit: payload.limit || limit,
      };

      console.log('[bannerService] GET Banners - Success:', items.length, 'banners');
      return {
        success: true,
        data: result,
        message: responseData.message || 'Banners fetched successfully',
      };
    }

    return {
      success: false,
      message: responseData.message || 'Failed to fetch banners',
      error: 'API returned unsuccessful response',
      data: {
        items: [],
        total: 0,
        page: page,
        limit: limit,
      },
    };
  } catch (error: any) {
    // Banners are public - suppress auth errors
    if (error.response?.status === 401 || error.message?.includes('token') || error.message?.includes('Unauthorized')) {
      console.warn('[bannerService] GET Banners - Auth error (suppressed, banners should be public)');
      return {
        success: false,
        message: 'Banners unavailable',
        error: 'Unauthorized',
        data: {
          items: [],
          total: 0,
          page: page,
          limit: limit,
        },
      };
    }
    
    console.error('[bannerService] GET Banners error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: {
        items: [],
        total: 0,
        page: page,
        limit: limit,
      },
    };
  }
}


  // Get active banners only (public endpoint)
 
export async function getActiveBanners(): Promise<ApiResponse<Banner[]>> {
  try {
    const bannersResponse = await getBanners();
    
    if (bannersResponse.success && bannersResponse.data) {
      const activeBanners = bannersResponse.data.items.filter((banner) => banner.isActive !== false);
      
      return {
        success: true,
        data: activeBanners,
        message: 'Active banners fetched successfully',
      };
    }

    return {
      success: false,
      message: bannersResponse.message || 'Failed to fetch active banners',
      error: bannersResponse.error || 'API returned unsuccessful response',
      data: [],
    };
  } catch (error: any) {
    console.error('[bannerService] GET Active Banners error:', error.message);
    return {
      success: false,
      message: error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: [],
    };
  }
}

// ==================== Service Export ====================

export const bannerService = {
  getBanners,
  getActiveBanners,
};


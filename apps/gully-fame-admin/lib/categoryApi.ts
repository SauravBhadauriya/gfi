import { getAuthHeaders } from './authApi';
import type { ApiResponse } from './apiTypes';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend.gullyfame.com/v1/api/';

export interface Category {
  id: string;
  name: string;
  [key: string]: any;
}

export async function createCategory(
  name: string,
  iconFile?: File | null
): Promise<ApiResponse<Category>> {
  const endpoint = `${BASE_URL}admin/categories`;

  console.log('[Categories API] POST Create Category - Endpoint:', endpoint);
  console.log('[Categories API] POST Create Category - Name:', name);
  console.log('[Categories API] POST Create Category - Has icon file:', !!iconFile);
  if (iconFile) {
    console.log('[Categories API] POST Create Category - Icon file name:', iconFile.name);
    console.log('[Categories API] POST Create Category - Icon file size:', iconFile.size, 'bytes');
    console.log('[Categories API] POST Create Category - Icon file type:', iconFile.type);
  }

  try {
    const formData = new FormData();
    formData.append('name', name);
    if (iconFile) {
      formData.append('icon', iconFile);
    }

    const httpResponse = await fetch(endpoint, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    const responseText = await httpResponse.text();
    console.log('[Categories API] POST Create Category - Response received:', responseText);
    console.log('[Categories API] POST Create Category - Status:', httpResponse.status, httpResponse.statusText);

    let responseData: any;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
      console.log('[Categories API] POST Create Category - Parsed JSON:', responseData);
    } catch (parseError) {
      console.error('[Categories API] POST Create Category - Parse error:', parseError);

      if (!httpResponse.ok) {
        console.error('[Categories API] POST Create Category - Error:', httpResponse.status, httpResponse.statusText);
        return {
          success: false,
          message:
            `Failed to create category: ${httpResponse.statusText} (Status: ${httpResponse.status})`,
          error: `HTTP ${httpResponse.status}`,
        };
      }

      return {
        success: false,
        message: 'Invalid response format from server',
        error: 'INVALID_JSON',
      };
    }

    if (!httpResponse.ok || responseData.success === false) {
      console.error('[Categories API] POST Create Category - API Error:', responseData);
      return {
        success: false,
        message:
          responseData.message ||
          responseData.error ||
          `Failed to create category with status ${httpResponse.status}`,
        error: responseData.error || `HTTP ${httpResponse.status}`,
        data: responseData.data,
      };
    }

    const payload = responseData.data || responseData;
    const rawCategory = payload.category || payload;

    const category: Category = {
      id:
        rawCategory.id?.toString?.() ||
        rawCategory._id?.toString?.() ||
        rawCategory.categoryId?.toString?.() ||
        '',
      name: rawCategory.name || rawCategory.title || '',
      ...rawCategory,
    };

    console.log('[Categories API] POST Create Category - Success:', category);

    return {
      success: true,
      message: responseData.message || 'Category created successfully',
      data: category,
    };
  } catch (error: any) {
    console.error('[Categories API] POST Create Category - Network error:', error);

    return {
      success: false,
      message: error.message || 'Network error occurred',
      error: error.message || 'NETWORK_ERROR',
    };
  }
}

export async function getCategories(
  page: number = 1,
  limit: number = 50
): Promise<ApiResponse<{ items: Category[]; total?: number; page?: number; limit?: number }>> {
  const endpoint = `${BASE_URL}admin/categories?page=${page}&limit=${limit}`;

  console.log('[Categories API] GET Categories - Endpoint:', endpoint);
  console.log('[Categories API] GET Categories - Page:', page, 'Limit:', limit);

  try {
    const httpResponse = await fetch(endpoint, {
      method: 'GET',
      headers: getAuthHeaders({
        Accept: 'application/json',
      }),
    });

    const responseText = await httpResponse.text();
    console.log('[Categories API] GET Categories - Response received:', responseText);
    console.log('[Categories API] GET Categories - Status:', httpResponse.status, httpResponse.statusText);

    let responseData: any;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
      console.log('[Categories API] GET Categories - Parsed JSON:', responseData);
    } catch (parseError) {
      console.error('[Categories API] GET Categories - Parse error:', parseError);

      if (!httpResponse.ok) {
        console.error('[Categories API] GET Categories - Error:', httpResponse.status, httpResponse.statusText);
        return {
          success: false,
          message:
            `Failed to fetch categories: ${httpResponse.statusText} (Status: ${httpResponse.status})`,
          error: `HTTP ${httpResponse.status}`,
        };
      }

      return {
        success: false,
        message: 'Invalid response format from server',
        error: 'INVALID_JSON',
      };
    }

    if (!httpResponse.ok || responseData.success === false) {
      console.error('[Categories API] GET Categories - API Error:', responseData);
      return {
        success: false,
        message:
          responseData.message ||
          responseData.error ||
          `Failed to fetch categories with status ${httpResponse.status}`,
        error: responseData.error || `HTTP ${httpResponse.status}`,
        data: responseData.data,
      };
    }

    let payload = responseData.data || responseData;
    let rawItems: any[] = [];

    if (Array.isArray(payload)) {
      rawItems = payload;
    } else if (Array.isArray(payload.items)) {
      rawItems = payload.items;
    } else if (Array.isArray(payload.categories)) {
      rawItems = payload.categories;
    } else if (Array.isArray(payload.data)) {
      rawItems = payload.data;
    }

    const items: Category[] = rawItems.map((c) => ({
      id:
        c.id?.toString?.() ||
        c._id?.toString?.() ||
        c.categoryId?.toString?.() ||
        '',
      name: c.name || c.title || '',
      ...c,
    }));

    const result = {
      items,
      total: payload.total,
      page: payload.page,
      limit: payload.limit,
    };

    console.log('[Categories API] GET Categories - Success:', result);
    console.log('[Categories API] GET Categories - Total items:', items.length);

    return {
      success: true,
      message: responseData.message || 'Categories fetched successfully',
      data: result,
    };
  } catch (error: any) {
    console.error('[Categories API] GET Categories - Network error:', error);

    return {
      success: false,
      message: error.message || 'Network error occurred',
      error: error.message || 'NETWORK_ERROR',
    };
  }
}

export async function deleteCategory(id: string): Promise<ApiResponse<null>> {
  if (!id) {
    console.warn('[Categories API] DELETE Category - Called without a valid id');
    return {
      success: false,
      message: 'Category ID is required to delete a category.',
      error: 'MISSING_ID',
      data: null,
    };
  }

  const safeId = encodeURIComponent(id.toString());
  const endpoint = `${BASE_URL}admin/categories/${safeId}`;

  console.log('[Categories API] DELETE Category - Endpoint:', endpoint);
  console.log('[Categories API] DELETE Category - Category ID:', id);

  try {
    const httpResponse = await fetch(endpoint, {
      method: 'DELETE',
      headers: getAuthHeaders({
        Accept: 'application/json',
      }),
    });

    const responseText = await httpResponse.text();
    console.log('[Categories API] DELETE Category - Response received:', responseText);
    console.log('[Categories API] DELETE Category - Status:', httpResponse.status, httpResponse.statusText);

    let responseData: any;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
      console.log('[Categories API] DELETE Category - Parsed JSON:', responseData);
    } catch (parseError) {
      console.error('[Categories API] DELETE Category - Parse error:', parseError);

      if (!httpResponse.ok) {
        console.error('[Categories API] DELETE Category - Error:', httpResponse.status, httpResponse.statusText);
        return {
          success: false,
          message:
            `Failed to delete category: ${httpResponse.statusText} (Status: ${httpResponse.status})`,
          error: `HTTP ${httpResponse.status}`,
          data: null,
        };
      }

      console.log('[Categories API] DELETE Category - Success (non-JSON response)');
      return {
        success: true,
        message: 'Category deleted successfully',
        data: null,
      };
    }

    if (!httpResponse.ok || responseData.success === false) {
      console.error('[Categories API] DELETE Category - API Error:', responseData);
      return {
        success: false,
        message:
          responseData.message ||
          responseData.error ||
          `Failed to delete category with status ${httpResponse.status}`,
        error: responseData.error || `HTTP ${httpResponse.status}`,
        data: null,
      };
    }

    console.log('[Categories API] DELETE Category - Success');

    return {
      success: true,
      message: responseData.message || 'Category deleted successfully',
      data: null,
    };
  } catch (error: any) {
    console.error('[Categories API] DELETE Category - Network error:', error);

    return {
      success: false,
      message: error.message || 'Network error occurred',
      error: error.message || 'NETWORK_ERROR',
      data: null,
    };
  }
}


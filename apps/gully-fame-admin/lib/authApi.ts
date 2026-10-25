'use client';

import type { ApiResponse } from './apiTypes';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://backend.gullyfame.com/v1/api/';

const TOKEN_KEY = 'gf_admin_token';
const ADMIN_DATA_KEY = 'gf_admin_data';

export interface AdminUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

function safeLocalStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  const storage = safeLocalStorage();
  const token = storage?.getItem(TOKEN_KEY) || null;
  return token;
}

function setToken(token: string | null, role?: string) {
  const storage = safeLocalStorage();
  if (!storage) return;

  if (token) {
    storage.setItem(TOKEN_KEY, token);
    storage.setItem('isLoggedIn', 'true');
    storage.setItem('userRole', role || 'admin');
  } else {
    storage.removeItem(TOKEN_KEY);
    storage.removeItem('isLoggedIn');
    storage.removeItem('userRole');
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
  }
}

function setAdminData(admin: AdminUser | null) {
  const storage = safeLocalStorage();
  if (!storage) return;

  if (admin) {
    storage.setItem(ADMIN_DATA_KEY, JSON.stringify(admin));
    if (admin.email) {
      storage.setItem('userEmail', admin.email);
    }
  } else {
    storage.removeItem(ADMIN_DATA_KEY);
    storage.removeItem('userEmail');
  }
}

export function getStoredAdmin(): AdminUser | null {
  const storage = safeLocalStorage();
  if (!storage) return null;
  const raw = storage.getItem(ADMIN_DATA_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AdminUser;
    return parsed;
  } catch (err) {
    console.warn('Failed to parse stored admin data', err);
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getAuthHeaders(extra?: HeadersInit): HeadersInit {
  const token = getToken();
  const base: Record<string, string> = {};

  if (token) {
    base['Authorization'] = `Bearer ${token}`;
  }

  return {
    ...base,
    ...(extra || {}),
  };
}

export function logoutAdmin() {
  setToken(null);
  setAdminData(null);
  
  
  const storage = safeLocalStorage();
  if (storage) {
    storage.removeItem('userRole');
  }

  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export async function loginAdmin(
  email: string,
  password: string,
  role: 'ADMIN' | 'SPONSOR' = 'ADMIN'
): Promise<ApiResponse<{ token?: string; admin?: AdminUser }>> {
  const endpoint = `${BASE_URL}admin/login`;
  const startTime = Date.now();
  const logPrefix = `[authApi] POST admin/login`;

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${logPrefix} - Starting request`);
      console.log(`${logPrefix} - Email:`, email);
      console.log(`${logPrefix} - Role:`, role);
    }

    const requestBody = {
      email,
      password,
      role,
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(`${logPrefix} - Request body:`, { ...requestBody, password: '***' });
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseTime = Date.now() - startTime;

    const text = await response.text();

    if (process.env.NODE_ENV === 'development') {
      console.log(`${logPrefix} - Response received in ${responseTime}ms`);
      console.log(`${logPrefix} - Response status:`, response.status);
      console.log(`${logPrefix} - Response text:`, text);
    }

    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (err) {
      console.error(`${logPrefix} - ❌ Parse error:`, err);
      if (!response.ok) {
        return {
          success: false,
          message:
            data?.message ||
            `Login failed: ${response.statusText} (Status ${response.status})`,
          error: 'INVALID_JSON',
        };
      }
      return {
        success: false,
        message: 'Invalid response from server',
        error: 'INVALID_JSON',
      };
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`${logPrefix} - Response data:`, JSON.stringify(data, null, 2));
    }

    
    const successFlag = response.ok && (data.success === true || data.code === 1 || data.rCode === 1);

    if (!successFlag) {
      const message =
        data?.message ||
        data?.msg ||
        data?.error ||
        `Login failed with status ${response.status}`;
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(`${logPrefix} - ⚠️ Login failed:`, {
          status: response.status,
          message,
          data: JSON.stringify(data, null, 2),
        });
      }
      
      setToken(null);
      setAdminData(null);

      return {
        success: false,
        message,
        error: data?.error || `HTTP_${response.status}`,
        data: data?.data || data?.rData,
      };
    }

    const payload = data.data || data.rData || data;
    const token: string | undefined =
      payload?.token ||
      payload?.accessToken ||
      payload?.jwt ||
      data?.token ||
      data?.accessToken;

    const admin: AdminUser | undefined =
      payload?.admin ||
      payload?.user ||
      (payload?.email || payload?.name ? payload : undefined);

    if (!token) {
      console.error(`${logPrefix} - ❌ No token found in response`);
      return {
        success: false,
        message: 'Login response did not contain a token',
        error: 'NO_TOKEN',
      };
    }

    
    // The backend only issues admin tokens; there is no sponsor login.
    setToken(token, 'admin');
    if (admin) {
      setAdminData(admin);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`${logPrefix} - ✅ Login successful:`, {
        hasToken: !!token,
        hasAdmin: !!admin,
        role: 'admin',
        email: admin?.email || email,
      });
    }

    return {
      success: true,
      message: data?.message || data?.msg || 'Login successful',
      data: {
        token,
        admin,
      },
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
      message: error?.message || 'Network error occurred during login',
      error: error?.message || 'NETWORK_ERROR',
    };
  }
}

export async function getCurrentAdmin(): Promise<ApiResponse<AdminUser>> {
  const startTime = Date.now();
  const logPrefix = `[authApi] GET admin/getDetails`;
  const token = getToken();

  if (!token) {
    return {
      success: false,
      message: 'Not authenticated',
      error: 'NO_TOKEN',
    };
  }

  const endpoint = `${BASE_URL}admin/getDetails`;

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${logPrefix} - Starting request`);
      console.log(`${logPrefix} - Full URL:`, endpoint);
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: getAuthHeaders({
        Accept: 'application/json',
      }),
    });

    const responseTime = Date.now() - startTime;
    const text = await response.text();

    if (process.env.NODE_ENV === 'development') {
      console.log(`${logPrefix} - Response received in ${responseTime}ms`);
      console.log(`${logPrefix} - Response status:`, response.status);
      console.log(`${logPrefix} - Response text:`, text);
    }

    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (err) {
      console.error(`${logPrefix} - ❌ Parse error:`, err);
      if (!response.ok) {
        setToken(null);
        setAdminData(null);
        return {
          success: false,
          message: 'Session invalid. Please log in again.',
          error: 'INVALID_JSON',
        };
      }
      return {
        success: false,
        message: 'Invalid response from server',
        error: 'INVALID_JSON',
      };
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`${logPrefix} - Response data:`, JSON.stringify(data, null, 2));
    }

    
    const isSuccess = 
      response.ok && (
        data.status === true || 
        data.code === 1 || 
        data.rCode === 1 ||
        (data.data !== undefined || data.rData !== undefined)
      );

    if (!isSuccess) {
      const message =
        data?.message ||
        data?.msg ||
        data?.error ||
        `Failed to fetch admin details (Status ${response.status})`;
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(`${logPrefix} - ⚠️ Failed to validate session:`, {
          status: response.status,
          message,
          data: JSON.stringify(data, null, 2),
        });
      }

      setToken(null);
      setAdminData(null);

      return {
        success: false,
        message:
          message === 'Unauthorized' || response.status === 401
            ? 'Session expired. Please log in again.'
            : message,
        error: data?.error || `HTTP_${response.status}`,
      };
    }

    const payload = data.data || data.rData || data;
    const admin: AdminUser =
      payload?.admin ||
      payload?.user ||
      payload?.sponsor ||
      (payload?.email || payload?.name || payload?._id ? payload : {});

    setAdminData(admin);

    if (process.env.NODE_ENV === 'development') {
      console.log(`${logPrefix} - ✅ Success:`, {
        hasAdmin: !!admin,
        id: admin.id || admin._id,
        email: admin.email,
        role: admin.role,
        sponsorCode: (admin as any).sponsorCode,
      });
    }

    return {
      success: true,
      message: data?.message || data?.msg || 'Admin session validated',
      data: admin,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error(`${logPrefix} - ❌ Network error after ${responseTime}ms:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    const storedAdmin = getStoredAdmin();
    if (storedAdmin && token) {
      return {
        success: true,
        message: 'Offline mode - using stored session',
        data: storedAdmin,
      };
    }

    return {
      success: false,
      message: error?.message || 'Network error while validating session',
      error: error?.message || 'NETWORK_ERROR',
    };
  }
}



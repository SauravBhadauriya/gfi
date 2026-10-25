import { getAuthHeaders } from './authApi';
import type { ApiResponse } from './apiTypes';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend.gullyfame.com/v1/api/';

async function makeGetRequest(apiName: string, endpoint: string): Promise<ApiResponse<any>> {
  console.log(`[CMS API] GET ${apiName} - Endpoint: ${endpoint}`);

  try {
    const httpResponse = await fetch(endpoint, {
      method: 'GET',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }),
    });

    const responseText = await httpResponse.text();
    console.log(`[CMS API] GET ${apiName} - Response received:`, responseText);

    let responseData: any;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error(`[CMS API] GET ${apiName} - Parse error:`, parseError);
      
      if (!httpResponse.ok) {
        console.error(`[CMS API] GET ${apiName} - Error:`, httpResponse.status, httpResponse.statusText);
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

    if (!httpResponse.ok || responseData.code !== 1) {
      console.error(`[CMS API] GET ${apiName} - API Error:`, responseData);
      return {
        success: false,
        message: responseData.message || responseData.error || `Failed to fetch ${apiName.toLowerCase()} with status ${httpResponse.status}`,
        error: responseData.error || `HTTP ${httpResponse.status}`,
        data: responseData.data,
      };
    }

    console.log(`[CMS API] GET ${apiName} - Success:`, responseData);
    return {
      success: true,
      message: responseData.message || `${apiName} fetched successfully`,
      data: responseData.data,
    };
  } catch (error: any) {
    console.error(`[CMS API] GET ${apiName} - Network error:`, error);
    return {
      success: false,
      message: error.message || 'Network error occurred',
      error: error.message || 'NETWORK_ERROR',
    };
  }
}

async function makePostRequest(apiName: string, endpoint: string, requestBody: any): Promise<ApiResponse<any>> {
  console.log(`[CMS API] POST ${apiName} - Endpoint: ${endpoint}`);
  console.log(`[CMS API] POST ${apiName} - Body:`, requestBody);

  try {
    const httpResponse = await fetch(endpoint, {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }),
      body: JSON.stringify(requestBody),
    });

    const responseText = await httpResponse.text();
    console.log(`[CMS API] POST ${apiName} - Response received:`, responseText);

    let responseData: any;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error(`[CMS API] POST ${apiName} - Parse error:`, parseError);
      
      if (!httpResponse.ok) {
        console.error(`[CMS API] POST ${apiName} - Error:`, httpResponse.status, httpResponse.statusText);
        return {
          success: false,
          message: `Failed to update ${apiName.toLowerCase()}: ${httpResponse.statusText} (Status: ${httpResponse.status})`,
          error: `HTTP ${httpResponse.status}`,
        };
      }

      return {
        success: false,
        message: 'Invalid response format from server',
        error: 'INVALID_JSON',
      };
    }

    if (!httpResponse.ok || responseData.code !== 1) {
      console.error(`[CMS API] POST ${apiName} - API Error:`, responseData);
      return {
        success: false,
        message: responseData.message || responseData.error || `Failed to update ${apiName.toLowerCase()} with status ${httpResponse.status}`,
        error: responseData.error || `HTTP ${httpResponse.status}`,
        data: responseData.data,
      };
    }

    console.log(`[CMS API] POST ${apiName} - Success:`, responseData);
    return {
      success: true,
      message: responseData.message || `${apiName} updated successfully`,
      data: responseData.data,
    };
  } catch (error: any) {
    console.error(`[CMS API] POST ${apiName} - Network error:`, error);
    return {
      success: false,
      message: error.message || 'Network error occurred',
      error: error.message || 'NETWORK_ERROR',
    };
  }
}

export async function getTermsAndConditions(): Promise<ApiResponse<any>> {
  const endpoint = `${BASE_URL}admin/termAndCondition`;
  return makeGetRequest('Terms and Conditions', endpoint);
}

export async function updateTermsAndConditions(termsAndConditions: string): Promise<ApiResponse<any>> {
  const endpoint = `${BASE_URL}admin/termAndCondition`;
  const requestBody = { termsAndConditions };
  return makePostRequest('Terms and Conditions', endpoint, requestBody);
}

export async function getAboutUs(): Promise<ApiResponse<any>> {
  const endpoint = `${BASE_URL}admin/aboutUs`;
  return makeGetRequest('About Us', endpoint);
}

export async function updateAboutUs(aboutUs: string): Promise<ApiResponse<any>> {
  const endpoint = `${BASE_URL}admin/aboutUs`;
  const requestBody = { aboutUs };
  return makePostRequest('About Us', endpoint, requestBody);
}

export async function getPrivacyPolicy(): Promise<ApiResponse<any>> {
  const endpoint = `${BASE_URL}admin/privacyPolicy`;
  return makeGetRequest('Privacy Policy', endpoint);
}

export async function updatePrivacyPolicy(privacyPolicy: string): Promise<ApiResponse<any>> {
  const endpoint = `${BASE_URL}admin/privacyPolicy`;
  const requestBody = { privacyPolicy };
  return makePostRequest('Privacy Policy', endpoint, requestBody);
}

export async function getCompetitionRules(): Promise<ApiResponse<any>> {
  const endpoint = `${BASE_URL}admin/competitionRules`;
  return makeGetRequest('Competition Rules', endpoint);
}

export async function updateCompetitionRules(competitionRules: string): Promise<ApiResponse<any>> {
  const endpoint = `${BASE_URL}admin/competitionRules`;
  const requestBody = { competitionRules };
  return makePostRequest('Competition Rules', endpoint, requestBody);
}

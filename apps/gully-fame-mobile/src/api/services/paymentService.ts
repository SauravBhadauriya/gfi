import { Platform, Alert } from 'react-native';
import apiClient from '../axios';
import { ApiResponse } from '../types';

let RazorpayCheckout: any = null;

// Load Razorpay key from environment - production requires valid key
const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';

const isRazorpayAvailable = () => {
  return !!RAZORPAY_KEY_ID;
};

export interface PaymentOrderData {
  amount: number;
  currency: string;
  receipt?: string;
  notes?: {
    competitionId?: string;
    competitionName?: string;
    userId?: string;
    [key: string]: string | undefined;
  };
}

export interface RazorpayOptions {
  description: string;
  image?: string;
  currency: string;
  key: string;
  amount: string;
  name: string;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  theme?: {
    color?: string;
  };
  order_id?: string;
}

export interface PaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata?: {
    order_id?: string;
    payment_id?: string;
  };
}

// Fetch actual user data from auth service - don't use hardcoded mock
async function getUserPaymentData() {
  try {
    // Import auth service to get actual user data
    const { getCurrentUser } = await import('./authService');
    const user = await getCurrentUser();
    return {
      email: user?.email || '',
      contact: user?.phone || '',
      name: user?.name || user?.username || '',
    };
  } catch (error) {
    console.error('[paymentService] Failed to fetch user data:', error);
    return {
      email: '',
      contact: '',
      name: '',
    };
  }
}

export async function createPaymentOrder(data: PaymentOrderData): Promise<ApiResponse<{ orderId: string; amount: number; currency: string }>> {
  const endpoint = 'payments/create-order';
  
  try {
    console.log('[paymentService] POST payments/create-order');
    const response = await apiClient.post<ApiResponse<{ orderId: string; amount: number; currency: string }>>(endpoint, data);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    }

    return {
      success: false,
      message: response.data.message || 'Failed to create payment order',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[paymentService] createPaymentOrder error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function verifyPayment(paymentResponse: PaymentResponse): Promise<ApiResponse<{ verified: boolean; orderId: string; paymentId: string }>> {
  const endpoint = 'payments/verify';
  
  try {
    console.log('[paymentService] POST payments/verify');
    const response = await apiClient.post<ApiResponse<{ verified: boolean; orderId: string; paymentId: string }>>(endpoint, paymentResponse);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    }

    return {
      success: false,
      message: response.data.message || 'Payment verification failed',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[paymentService] verifyPayment error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export const convertRupeesToPaise = (rupees: number): number => {
  return Math.round(rupees * 100);
};

export const extractAmountFromString = (amountString: string): number => {
  const numericString = amountString.replace(/[₹,\s]/g, '').trim();
  const amount = parseFloat(numericString);
  
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Invalid amount format');
  }
  
  return amount;
};

export const formatAmount = (amount: number): string => {
  return `₹${amount.toFixed(2)}`;
};

export interface InitiatePaymentParams {
  amount: number | string;
  description: string;
  competitionId?: string;
  competitionName?: string;
  userId?: string;
  userEmail?: string;
  userContact?: string;
  userName?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  error?: string;
  errorCode?: string;
}

export const initiateRazorpayPayment = async (
  params: InitiatePaymentParams
): Promise<PaymentResult> => {
  if (!isRazorpayAvailable()) {
    return {
      success: false,
      error: 'Razorpay key not configured. Contact support if issue persists.',
      errorCode: 'SDK_NOT_INITIALIZED',
    };
  }

  // Check if Razorpay SDK is available
  if (Platform.OS === 'android' && !RazorpayCheckout) {
    try {
      // Try to load Razorpay SDK - requires native module
      const RazorpayCheckoutModule = require('react-native-razorpay');
      RazorpayCheckout = RazorpayCheckoutModule.default || RazorpayCheckoutModule;
    } catch (error) {
      console.error('[paymentService] Razorpay SDK not available:', error);
      return {
        success: false,
        error: 'Payment SDK not available. Please rebuild the app with native modules enabled.',
        errorCode: 'SDK_NOT_AVAILABLE',
      };
    }
  }

  if (Platform.OS === 'ios') {
    // iOS requires different handling - typically via web or native SDK
    console.warn('[paymentService] iOS Razorpay not yet implemented');
    return {
      success: false,
      error: 'Payment unavailable on iOS. Use web version or contact support.',
      errorCode: 'SDK_NOT_AVAILABLE',
    };
  }

  try {
    const options: RazorpayOptions = {
      description: params.description || 'Gully Fame Purchase',
      image: params.image || '',
      currency: params.currency || 'INR',
      key: RAZORPAY_KEY_ID,
      amount: params.amount.toString(), // Amount in paise
      name: 'Gully Fame',
      prefill: {
        email: params.email,
        contact: params.contact,
        name: params.name,
      },
      theme: {
        color: '#3399cc',
      },
      order_id: params.orderId,
    };

    return new Promise((resolve) => {
      RazorpayCheckout.open(
        options,
        (result: PaymentResponse) => {
          // Success - user completed payment
          resolve({
            success: true,
            paymentId: result.razorpay_payment_id,
            orderId: result.razorpay_order_id,
          });
        },
        (error: PaymentError) => {
          // Error - payment failed or cancelled
          if (error.code === 'BAD_REQUEST_ERROR' && error.description?.includes('cancelled')) {
            resolve({
              success: false,
              error: 'Payment cancelled by user',
              errorCode: 'USER_CANCELLED',
            });
          } else {
            resolve({
              success: false,
              error: error.description || 'Payment failed',
              errorCode: error.code || 'PAYMENT_FAILED',
            });
          }
        }
      );
    });
  } catch (error: any) {
    console.error('[paymentService] initiateRazorpayPayment error:', error);
    return {
      success: false,
      error: error.message || 'Payment processing failed',
      errorCode: 'NETWORK_ERROR',
    };
  }
};

export const handlePaymentError = (result: PaymentResult) => {
  if (result.success) {
    return;
  }

  let errorMessage = result.error || 'Payment failed. Please try again.';

  switch (result.errorCode) {
    case 'USER_CANCELLED':
      return;
    case 'SDK_NOT_AVAILABLE':
    case 'SDK_NOT_INITIALIZED':
      errorMessage = 'Payment SDK not available. Please rebuild the app with native modules.';
      break;
    case 'NETWORK_ERROR':
      errorMessage = 'Network error. Please check your internet connection and try again.';
      break;
    case 'VERIFICATION_FAILED':
      errorMessage = 'Payment verification failed. Please contact support if payment was deducted.';
      break;
    default:
      break;
  }

  Alert.alert(
    'Payment Failed',
    errorMessage,
    [{ text: 'OK' }]
  );
};

export const paymentService = {
  createPaymentOrder,
  verifyPayment,
  initiateRazorpayPayment,
  convertRupeesToPaise,
  extractAmountFromString,
  formatAmount,
  handlePaymentError,
};

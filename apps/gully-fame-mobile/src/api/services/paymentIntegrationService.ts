

import apiClient from "../axios";
import { ApiResponse } from "../types";
import API_ENDPOINTS, { replaceParams } from "../endpoints";
import RazorpayCheckout from "react-native-razorpay";

export interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  discount?: number;
  finalPrice: number;
  bonus?: number;
  popular?: boolean;
}

export interface PaymentInitiateRequest {
  packageId: string;
  coins: number;
  amount: number;
  userEmail: string;
  userPhone: string;
  userName: string;
}

export interface PaymentVerifyRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentResponse {
  transactionId: string;
  status: "success" | "failed" | "pending";
  coins: number;
  amount: number;
  timestamp: string;
}

// Renamed from TipPaymentRequest to SupportPaymentRequest
export interface SupportPaymentRequest {
  recipientId: string;
  reelId: string;
  amount: number;
  coins: number;
  message?: string;
}




export async function getCoinPackages(): Promise<ApiResponse<CoinPackage[]>> {
  try {
    console.log("[paymentIntegrationService] Fetching coin packages");

    const response = await apiClient.get<any>("payment/coin-packages");
    const responseData = response.data as any;

    if (responseData.code === 1 && Array.isArray(responseData.data)) {
      return {
        success: true,
        data: responseData.data,
        message: "Packages fetched successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to fetch packages",
      error: "API returned unsuccessful response",
      data: [],
    };
  } catch (error: any) {
    console.error("[paymentIntegrationService] Get packages error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to fetch coin packages",
      error: error.message,
      data: [],
    };
  }
}

/**
 * Initiate payment
 * KIRO: Create Razorpay order and initiate payment
 */
export async function initiatePayment(
  request: PaymentInitiateRequest
): Promise<ApiResponse<{ orderId: string; key: string }>> {
  try {
    console.log("[paymentIntegrationService] Initiating payment");

    const payload = {
      packageId: request.packageId,
      coins: request.coins,
      amount: request.amount,
      userEmail: request.userEmail,
      userPhone: request.userPhone,
      userName: request.userName,
    };

    const response = await apiClient.post<any>("payment/initiate", payload);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      return {
        success: true,
        data: {
          orderId: responseData.data.orderId,
          key: responseData.data.razorpayKey || process.env.EXPO_PUBLIC_RAZORPAY_KEY || "",
        },
        message: "Payment initiated successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Payment initiation failed",
      error: "API returned unsuccessful response",
      data: { orderId: "", key: "" },
    };
  } catch (error: any) {
    console.error("[paymentIntegrationService] Initiate error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to initiate payment",
      error: error.message,
      data: { orderId: "", key: "" },
    };
  }
}

/**
 * Process Razorpay payment
 * KIRO: Open Razorpay checkout and handle payment
 */
export async function processRazorpayPayment(
  orderId: string,
  amount: number,
  userEmail: string,
  userPhone: string,
  userName: string,
  razorpayKey: string
): Promise<PaymentVerifyRequest | null> {
  return new Promise((resolve) => {
    try {
      const options = {
        description: "Coin Purchase",
        image: "https://i.imgur.com/3g7nmJC.png",
        currency: "INR",
        key: razorpayKey,
        amount: amount * 100, // Razorpay expects amount in paise
        order_id: orderId,
        name: userName,
        prefill: {
          email: userEmail,
          contact: userPhone,
        },
        theme: { color: "#E91E63" },
      };

      RazorpayCheckout.open(options)
        .then((data: any) => {
          console.log("[paymentIntegrationService] Payment successful:", data);
          resolve({
            razorpayOrderId: orderId,
            razorpayPaymentId: data.razorpay_payment_id,
            razorpaySignature: data.razorpay_signature,
          });
        })
        .catch((error: any) => {
          console.error("[paymentIntegrationService] Payment error:", error);
          resolve(null);
        });
    } catch (error) {
      console.error("[paymentIntegrationService] Razorpay error:", error);
      resolve(null);
    }
  });
}

/**
 * Verify payment
 * KIRO: Verify payment signature and update wallet
 */
export async function verifyPayment(
  request: PaymentVerifyRequest
): Promise<ApiResponse<PaymentResponse>> {
  try {
    console.log("[paymentIntegrationService] Verifying payment");

    const payload = {
      razorpayOrderId: request.razorpayOrderId,
      razorpayPaymentId: request.razorpayPaymentId,
      razorpaySignature: request.razorpaySignature,
    };

    const response = await apiClient.post<any>("payment/verify", payload);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      return {
        success: true,
        data: {
          transactionId: responseData.data.transactionId,
          status: responseData.data.status || "success",
          coins: responseData.data.coins,
          amount: responseData.data.amount,
          timestamp: responseData.data.timestamp || new Date().toISOString(),
        },
        message: responseData.message || "Payment verified successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Payment verification failed",
      error: "API returned unsuccessful response",
      data: {
        transactionId: "",
        status: "failed",
        coins: 0,
        amount: 0,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error("[paymentIntegrationService] Verify error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to verify payment",
      error: error.message,
      data: {
        transactionId: "",
        status: "failed",
        coins: 0,
        amount: 0,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Send support payment
 * KIRO: Send coins/money as support to another user (Renamed from sendTipPayment)
 */
export async function sendSupportPayment(
  request: SupportPaymentRequest
): Promise<ApiResponse<{ supportId: string; status: string }>> {
  try {
    console.log("[paymentIntegrationService] Sending support payment");

    const payload = {
      recipientId: request.recipientId,
      reelId: request.reelId,
      amount: request.amount,
      coins: request.coins,
      message: request.message || "",
    };

    // Note: Kept endpoint as "payment/send-tip" to prevent backend 404 until server updates
    const response = await apiClient.post<any>("payment/send-tip", payload);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      return {
        success: true,
        data: {
          supportId: responseData.data.supportId || responseData.data.tipId || responseData.data.id,
          status: responseData.data.status || "completed",
        },
        message: responseData.message || "Support sent successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to send support",
      error: "API returned unsuccessful response",
      data: { supportId: "", status: "failed" },
    };
  } catch (error: any) {
    console.error("[paymentIntegrationService] Send support error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to send support",
      error: error.message,
      data: { supportId: "", status: "error" },
    };
  }
}

/**
 * Get payment history
 * KIRO: Fetch user's payment transaction history
 */
export async function getPaymentHistory(
  limit: number = 10,
  offset: number = 0
): Promise<ApiResponse<PaymentResponse[]>> {
  try {
    console.log("[paymentIntegrationService] Fetching payment history");

    const response = await apiClient.get<any>("payment/history", {
      params: { limit, offset },
    });
    const responseData = response.data as any;

    if (responseData.code === 1 && Array.isArray(responseData.data)) {
      return {
        success: true,
        data: responseData.data,
        message: "History fetched successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to fetch history",
      error: "API returned unsuccessful response",
      data: [],
    };
  } catch (error: any) {
    console.error("[paymentIntegrationService] Get history error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to fetch payment history",
      error: error.message,
      data: [],
    };
  }
}

/**
 * Get wallet balance
 * KIRO: Fetch current wallet balance and coin count
 * Spec: GET user/wallet
 */
export async function getWalletBalance(): Promise<
  ApiResponse<{ coins: number; balance: number; lastUpdated: string }>
> {
  try {
    console.log("[paymentIntegrationService] GET user/wallet");

    // Spec: GET user/wallet
    const response = await apiClient.get<any>("user/wallet");
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      return {
        success: true,
        data: {
          coins: responseData.data.coins || 0,
          balance: responseData.data.balance || 0,
          lastUpdated: responseData.data.lastUpdated || new Date().toISOString(),
        },
        message: "Wallet balance fetched successfully",
      };
    }

    return {
      success: false,
      message: responseData.message || "Failed to fetch wallet",
      error: "API returned unsuccessful response",
      data: { coins: 0, balance: 0, lastUpdated: new Date().toISOString() },
    };
  } catch (error: any) {
    console.error("[paymentIntegrationService] GET user/wallet error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to fetch wallet balance",
      error: error.message,
      data: { coins: 0, balance: 0, lastUpdated: new Date().toISOString() },
    };
  }
}

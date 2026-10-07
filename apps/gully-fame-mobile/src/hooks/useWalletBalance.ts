import { useState, useCallback } from "react";
import { userService } from "@/api/services/userService";

export interface WalletBalanceState {
  balance: number;
  loading: boolean;
  error: string | null;
}

export const useWalletBalance = () => {
  const [state, setState] = useState<WalletBalanceState>({
    balance: 0,
    loading: false,
    error: null,
  });

  const fetchBalance = useCallback(async () => {
    try {
      setState({ balance: 0, loading: true, error: null });
      const result = await userService.getWalletBalance();

      if (result.success && result.data) {
        setState({
          balance: result.data.balance || 0,
          loading: false,
          error: null,
        });
        return result.data.balance || 0;
      } else {
        const errorMsg = result.message || "Failed to fetch wallet balance";
        setState({
          balance: 0,
          loading: false,
          error: errorMsg,
        });
        return 0;
      }
    } catch (error: any) {
      const errorMsg = error.message || "Error fetching wallet balance";
      console.error("[useWalletBalance] Error:", errorMsg);
      setState({
        balance: 0,
        loading: false,
        error: errorMsg,
      });
      return 0;
    }
  }, []);

  return {
    ...state,
    fetchBalance,
  };
};

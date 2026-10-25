import { useState, useCallback } from "react";
import { getWallet } from "@/api/services/walletService";
import { getErrorMessage } from "@/api/client";

export interface WalletBalanceState {
  balance: number;
  loading: boolean;
  error: string | null;
}

/** Wallet balance from GET /user/wallet. */
export const useWalletBalance = () => {
  const [state, setState] = useState<WalletBalanceState>({
    balance: 0,
    loading: false,
    error: null,
  });

  const fetchBalance = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const wallet = await getWallet(1, 1);
      setState({ balance: wallet.balance, loading: false, error: null });
      return wallet.balance;
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: getErrorMessage(error) }));
      return null;
    }
  }, []);

  return {
    ...state,
    fetchBalance,
  };
};

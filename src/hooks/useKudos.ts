import { useAPXToken } from './useAPXToken'

/**
 * Legacy hook for backwards compatibility
 * Now uses the real APX token contract
 */
export function useKudos() {
  const apxData = useAPXToken()

  return {
    balance: apxData.balance,
    pendingRewards: 0n, // APX token doesn't have pending rewards concept
    isLoading: apxData.isLoading,
    // Additional APX-specific data
    formattedBalance: apxData.formattedBalance,
    isAdmin: apxData.isAdmin,
    isPaused: apxData.isPaused,
    tokenAddress: apxData.tokenAddress,
    tokenSymbol: apxData.tokenSymbol,
    tokenName: apxData.tokenName,
  }
}
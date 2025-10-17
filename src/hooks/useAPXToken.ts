import { useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { type Address } from 'viem'
import { APX_TOKEN_CONFIG, APX_TOKEN_ABI, isAPXAdmin, formatAPXAmount } from '@/config/apxToken'
import { useAppStore } from '@/store/useAppStore'

/**
 * Main hook for reading APX token data including balance, admin status, and token info
 */
export function useAPXToken() {
  const { address, isConnected } = useAccount()
  const { setKudosBalance, setWalletConnection, user } = useAppStore()

  console.log('[useAPXToken] Hook called:', { address, isConnected })

  // Read user balance
  const { data: balance, isLoading: isBalanceLoading, error: balanceError } = useReadContract({
    address: APX_TOKEN_CONFIG.address,
    abi: APX_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && Boolean(address),
      refetchInterval: 10000,
    },
  })

  // Read contract owner
  const { data: contractOwner, isLoading: isOwnerLoading, error: ownerError } = useReadContract({
    address: APX_TOKEN_CONFIG.address,
    abi: APX_TOKEN_ABI,
    functionName: 'owner',
    query: {
      refetchInterval: 30000, // Less frequent updates for owner
    },
  })

  // Read paused status
  const { data: isPaused, isLoading: isPausedLoading, error: pausedError } = useReadContract({
    address: APX_TOKEN_CONFIG.address,
    abi: APX_TOKEN_ABI,
    functionName: 'paused',
    query: {
      refetchInterval: 15000,
    },
  })

  // Read total supply
  const { data: totalSupply, isLoading: isTotalSupplyLoading, error: totalSupplyError } = useReadContract({
    address: APX_TOKEN_CONFIG.address,
    abi: APX_TOKEN_ABI,
    functionName: 'totalSupply',
    query: {
      refetchInterval: 30000,
    },
  })

  // Read decimals (this rarely changes)
  const { data: decimals, error: decimalsError } = useReadContract({
    address: APX_TOKEN_CONFIG.address,
    abi: APX_TOKEN_ABI,
    functionName: 'decimals',
  })

  const isLoading = isBalanceLoading || isOwnerLoading || isPausedLoading || isTotalSupplyLoading

  // Log any errors that occur
  const errors = [
    balanceError && { type: 'balance', error: balanceError },
    ownerError && { type: 'owner', error: ownerError },
    pausedError && { type: 'paused', error: pausedError },
    totalSupplyError && { type: 'totalSupply', error: totalSupplyError },
    decimalsError && { type: 'decimals', error: decimalsError },
  ].filter(Boolean)

  if (errors.length > 0) {
    console.error('[useAPXToken] Contract read errors:', errors)
    errors.forEach(({ type, error }) => {
      console.error(`[useAPXToken] ${type} error:`, error)
    })
  }

  // Check if current user is admin
  const isAdmin = address && contractOwner ?
    address.toLowerCase() === contractOwner.toLowerCase() :
    false

  console.log('[useAPXToken] Contract data:', {
    balance: balance?.toString(),
    contractOwner,
    isPaused,
    totalSupply: totalSupply?.toString(),
    decimals,
    isAdmin,
    isLoading,
    hasErrors: errors.length > 0
  })

  // Format balance for display
  const formattedBalance = balance && decimals ?
    formatAPXAmount(balance, decimals) :
    '0'

  // Format total supply for display
  const formattedTotalSupply = totalSupply && decimals ?
    formatAPXAmount(totalSupply, decimals) :
    '0'

  // Update store when data changes
  useEffect(() => {
    console.log('[useAPXToken] useEffect triggered:', {
      balance: balance?.toString(),
      decimals,
      formattedBalance,
      address,
      isConnected,
      isAdmin,
      userExists: !!user
    })

    try {
      if (balance && decimals) {
        console.log('[useAPXToken] Setting kudos balance:', formattedBalance)
        setKudosBalance(formattedBalance)
      }
      
      if (address && isConnected) {
        console.log('[useAPXToken] Setting wallet connection:', { address, isConnected, isAdmin })
        setWalletConnection(address, true)
        
        // Update admin status in user object
        if (user && user.isAdmin !== isAdmin) {
          console.log('[useAPXToken] Updating admin status:', { currentAdmin: user.isAdmin, newAdmin: isAdmin })
          setWalletConnection(address, true) // This will update the user object
        }
      }
    } catch (error) {
      console.error('[useAPXToken] Error in useEffect:', error)
    }
  }, [balance, decimals, formattedBalance, address, isConnected, isAdmin, setKudosBalance, setWalletConnection, user])

  return {
    // Token data
    balance: balance || 0n,
    formattedBalance,
    totalSupply: totalSupply || 0n,
    formattedTotalSupply,
    decimals: decimals || APX_TOKEN_CONFIG.decimals,
    
    // Contract state
    isPaused: isPaused || false,
    contractOwner,
    
    // User status
    isAdmin,
    isAPXAdmin: isAPXAdmin(address),
    
    // Query state
    isLoading,
    
    // Contract config
    tokenAddress: APX_TOKEN_CONFIG.address,
    tokenSymbol: APX_TOKEN_CONFIG.symbol,
    tokenName: APX_TOKEN_CONFIG.name,
  }
}

/**
 * Hook for reading specific user's APX balance (useful for admin operations)
 */
export function useAPXBalance(userAddress: Address | undefined) {
  const { data: balance, isLoading, error } = useReadContract({
    address: APX_TOKEN_CONFIG.address,
    abi: APX_TOKEN_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(userAddress),
    },
  })

  const { data: decimals } = useReadContract({
    address: APX_TOKEN_CONFIG.address,
    abi: APX_TOKEN_ABI,
    functionName: 'decimals',
  })

  const formattedBalance = balance && decimals ? 
    formatAPXAmount(balance, decimals) : 
    '0'

  return {
    balance: balance || 0n,
    formattedBalance,
    isLoading,
    error,
  }
}

/**
 * Hook for checking if a specific address is the contract owner
 */
export function useAPXOwnership(checkAddress: Address | undefined) {
  const { data: owner, isLoading, error } = useReadContract({
    address: APX_TOKEN_CONFIG.address,
    abi: APX_TOKEN_ABI,
    functionName: 'owner',
    query: {
      enabled: Boolean(checkAddress),
    },
  })

  const isOwner = checkAddress && owner ? 
    checkAddress.toLowerCase() === owner.toLowerCase() : 
    false

  return {
    owner,
    isOwner,
    isLoading,
    error,
  }
}

/**
 * Hook for reading token allowance
 */
export function useAPXAllowance(owner: Address | undefined, spender: Address | undefined) {
  const { data: allowance, isLoading, error } = useReadContract({
    address: APX_TOKEN_CONFIG.address,
    abi: APX_TOKEN_ABI,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: Boolean(owner && spender),
    },
  })

  const { data: decimals } = useReadContract({
    address: APX_TOKEN_CONFIG.address,
    abi: APX_TOKEN_ABI,
    functionName: 'decimals',
  })

  const formattedAllowance = allowance && decimals ? 
    formatAPXAmount(allowance, decimals) : 
    '0'

  return {
    allowance: allowance || 0n,
    formattedAllowance,
    isLoading,
    error,
  }
}
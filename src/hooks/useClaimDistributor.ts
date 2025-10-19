import { useState, useEffect, useCallback } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { toast } from 'sonner'
import {
  CLAIM_DISTRIBUTOR_CONFIG,
  ClaimDistributorUtils,
  CLAIM_DISTRIBUTOR_CONSTANTS,
  type UserClaimData,
  type ClaimAvailability,
  type ClaimConfig
} from '@/config/claimDistributor'
import { usePaymaster } from './usePaymaster'
import { base } from 'viem/chains'

/**
 * Hook principal pour interagir avec le Smart Contract ClaimDistributor
 * Remplace l'ancien useClaimSystem en utilisant directement le Smart Contract
 */
export function useClaimDistributor() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, data: txHash, isPending, isSuccess, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Intégration Paymaster
  const { 
    isPaymasterEnabled, 
    sponsoredClaimDaily, 
    sponsoredClaimWeekly,
    isSponsoring 
  } = usePaymaster()

  // États locaux
  const [isLoading, setIsLoading] = useState(false)
  const [lastActivity, setLastActivity] = useState<string | null>(null)

  // ===== LECTURE DES DONNÉES DU CONTRACT =====

  // Configuration du contract
  const { data: rawClaimConfig, refetch: refetchConfig } = useReadContract({
    address: CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
    abi: CLAIM_DISTRIBUTOR_CONFIG.abi,
    functionName: 'claimConfig',
    query: { enabled: isConnected }
  })

  // Données utilisateur
  const { data: rawUserClaims, refetch: refetchUserClaims } = useReadContract({
    address: CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
    abi: CLAIM_DISTRIBUTOR_CONFIG.abi,
    functionName: 'userClaims',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && Boolean(address) }
  })

  // Vérification des cooldowns
  const { data: canClaimDaily, refetch: refetchCanClaimDaily } = useReadContract({
    address: CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
    abi: CLAIM_DISTRIBUTOR_CONFIG.abi,
    functionName: 'canClaimDaily',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && Boolean(address) }
  })

  const { data: canClaimWeekly, refetch: refetchCanClaimWeekly } = useReadContract({
    address: CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
    abi: CLAIM_DISTRIBUTOR_CONFIG.abi,
    functionName: 'canClaimWeekly',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && Boolean(address) }
  })

  // Prochains temps de claim
  const { data: nextClaimTimes, refetch: refetchNextClaimTimes } = useReadContract({
    address: CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
    abi: CLAIM_DISTRIBUTOR_CONFIG.abi,
    functionName: 'getNextClaimTimes',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && Boolean(address) }
  })

  // Montants de rewards
  const { data: rewardAmounts, refetch: refetchRewardAmounts } = useReadContract({
    address: CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
    abi: CLAIM_DISTRIBUTOR_CONFIG.abi,
    functionName: 'getRewardAmounts',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && Boolean(address) }
  })

  // Pourcentages de bonus
  const { data: bonusPercentages, refetch: refetchBonusPercentages } = useReadContract({
    address: CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
    abi: CLAIM_DISTRIBUTOR_CONFIG.abi,
    functionName: 'getBonusPercentages',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && Boolean(address) }
  })

  // Balance du contract
  const { data: contractBalance, refetch: refetchContractBalance } = useReadContract({
    address: CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
    abi: CLAIM_DISTRIBUTOR_CONFIG.abi,
    functionName: 'getContractBalance',
    query: { enabled: isConnected }
  })

  // ===== PARSING DES DONNÉES =====

  const claimConfig: ClaimConfig | null = rawClaimConfig ? {
    dailyAmount: BigInt(rawClaimConfig[0]),
    weeklyAmount: BigInt(rawClaimConfig[1]),
    maxStreakDays: BigInt(rawClaimConfig[2]),
    enabled: Boolean(rawClaimConfig[3])
  } : null

  const userClaimData: UserClaimData | null = rawUserClaims ? {
    lastDailyClaim: BigInt(rawUserClaims[0]),
    lastWeeklyClaim: BigInt(rawUserClaims[1]),
    currentDailyStreak: BigInt(rawUserClaims[2]),
    currentWeeklyStreak: BigInt(rawUserClaims[3]),
    totalDailyClaims: BigInt(rawUserClaims[4]),
    totalWeeklyClaims: BigInt(rawUserClaims[5]),
    lifetimeAPXClaimed: BigInt(rawUserClaims[6])
  } : null

  const availability: ClaimAvailability | null = (
    canClaimDaily !== undefined &&
    canClaimWeekly !== undefined &&
    nextClaimTimes &&
    rewardAmounts &&
    bonusPercentages
  ) ? {
    canClaimDaily: Boolean(canClaimDaily),
    canClaimWeekly: Boolean(canClaimWeekly),
    nextDailyClaimTime: ClaimDistributorUtils.getNextClaimTime(
      BigInt(nextClaimTimes[0]),
      CLAIM_DISTRIBUTOR_CONSTANTS.COOLDOWN_DAILY
    ),
    nextWeeklyClaimTime: ClaimDistributorUtils.getNextClaimTime(
      BigInt(nextClaimTimes[1]),
      CLAIM_DISTRIBUTOR_CONSTANTS.COOLDOWN_WEEKLY
    ),
    dailyRewardAmount: ClaimDistributorUtils.formatTokenAmount(BigInt(rewardAmounts[0])),
    weeklyRewardAmount: ClaimDistributorUtils.formatTokenAmount(BigInt(rewardAmounts[1])),
    dailyBonusPercent: Number(bonusPercentages[0]),
    weeklyBonusPercent: Number(bonusPercentages[1])
  } : null

  // DEBUG: Log des données brutes du Smart Contract
  console.log('🔍 DEBUG useClaimDistributor - Raw Data:', {
    address,
    isConnected,
    contractAddress: CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
    rawClaimConfig,
    rawUserClaims,
    canClaimDaily,
    canClaimWeekly,
    nextClaimTimes,
    rewardAmounts,
    bonusPercentages,
    contractBalance
  })

  // DEBUG: Log des données parsées
  console.log('🔍 DEBUG useClaimDistributor - Parsed Data:', {
    claimConfig,
    userClaimData,
    availability
  })

  // ===== FONCTIONS DE CLAIM =====

  /**
   * Claim daily - utilise Paymaster si disponible, sinon transaction normale
   */
  const claimDaily = useCallback(async (): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!address || !isConnected) {
      toast.error('Wallet not connected')
      return { success: false, error: 'Wallet not connected' }
    }

    if (!claimConfig?.enabled) {
      toast.error('Claims are currently disabled')
      return { success: false, error: 'Claims disabled' }
    }

    if (!canClaimDaily) {
      toast.error('Daily claim not available yet')
      return { success: false, error: 'Cooldown not met' }
    }

    setIsLoading(true)

    try {
      let result

      if (isPaymasterEnabled) {
        // Tentative de transaction gasless via Paymaster
        console.log('🎯 Attempting gas-free daily claim...')
        result = await sponsoredClaimDaily()
        
        if (result.success) {
          toast.success('Daily claim successful! (Gas-free)')
          setLastActivity('daily_claim')
          // Refresh des données après un délai
          setTimeout(() => {
            refetchUserClaims()
            refetchCanClaimDaily()
            refetchNextClaimTimes()
            refetchRewardAmounts()
            refetchBonusPercentages()
          }, 2000)
        } else {
          // Fallback vers transaction normale si Paymaster échoue
          console.log('🎯 Gas-free failed, falling back to normal transaction...')
          toast.warning('Gas-free failed, proceeding with normal transaction')
          
          // Transaction normale avec gas
          writeContract({
            address: CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
            abi: CLAIM_DISTRIBUTOR_CONFIG.abi,
            functionName: 'claimDaily',
            args: [],
            chain: base,
            account: address
          })

          result = { success: true, txHash: 'pending' }
          setLastActivity('daily_claim')
        }
      } else {
        // Transaction normale avec gas
        writeContract({
          address: CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
          abi: CLAIM_DISTRIBUTOR_CONFIG.abi,
          functionName: 'claimDaily',
          args: [],
          chain: base,
          account: address
        })

        // Le succès sera géré par l'effect qui watch isConfirmed
        result = { success: true, txHash: 'pending' }
        setLastActivity('daily_claim')
      }

      return result

    } catch (error) {
      console.error('Daily claim failed:', error)
      toast.error('Daily claim failed')
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [
    address, 
    isConnected, 
    claimConfig, 
    canClaimDaily, 
    isPaymasterEnabled, 
    sponsoredClaimDaily,
    writeContract,
    refetchUserClaims,
    refetchCanClaimDaily,
    refetchNextClaimTimes,
    refetchRewardAmounts,
    refetchBonusPercentages
  ])

  /**
   * Claim weekly - utilise Paymaster si disponible, sinon transaction normale
   */
  const claimWeekly = useCallback(async (): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!address || !isConnected) {
      toast.error('Wallet not connected')
      return { success: false, error: 'Wallet not connected' }
    }

    if (!claimConfig?.enabled) {
      toast.error('Claims are currently disabled')
      return { success: false, error: 'Claims disabled' }
    }

    if (!canClaimWeekly) {
      toast.error('Weekly claim not available yet')
      return { success: false, error: 'Cooldown not met' }
    }

    setIsLoading(true)

    try {
      let result

      if (isPaymasterEnabled) {
        // Tentative de transaction gasless via Paymaster
        console.log('🎯 Attempting gas-free weekly claim...')
        result = await sponsoredClaimWeekly()
        
        if (result.success) {
          toast.success('Weekly claim successful! (Gas-free)')
          setLastActivity('weekly_claim')
          // Refresh des données après un délai
          setTimeout(() => {
            refetchUserClaims()
            refetchCanClaimWeekly()
            refetchNextClaimTimes()
            refetchRewardAmounts()
            refetchBonusPercentages()
          }, 2000)
        } else {
          // Fallback vers transaction normale si Paymaster échoue
          console.log('🎯 Gas-free failed, falling back to normal transaction...')
          toast.warning('Gas-free failed, proceeding with normal transaction')
          
          // Transaction normale avec gas
          writeContract({
            address: CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
            abi: CLAIM_DISTRIBUTOR_CONFIG.abi,
            functionName: 'claimWeekly',
            args: [],
            chain: base,
            account: address
          })

          result = { success: true, txHash: 'pending' }
          setLastActivity('weekly_claim')
        }
      } else {
        // Transaction normale avec gas
        writeContract({
          address: CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
          abi: CLAIM_DISTRIBUTOR_CONFIG.abi,
          functionName: 'claimWeekly',
          args: [],
          chain: base,
          account: address
        })

        result = { success: true, txHash: 'pending' }
        setLastActivity('weekly_claim')
      }

      return result

    } catch (error) {
      console.error('Weekly claim failed:', error)
      toast.error('Weekly claim failed')
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [
    address, 
    isConnected, 
    claimConfig, 
    canClaimWeekly, 
    isPaymasterEnabled, 
    sponsoredClaimWeekly,
    writeContract,
    refetchUserClaims,
    refetchCanClaimWeekly,
    refetchNextClaimTimes,
    refetchRewardAmounts,
    refetchBonusPercentages
  ])

  /**
   * Force le rechargement de toutes les données
   */
  const refresh = useCallback(() => {
    refetchConfig()
    refetchUserClaims()
    refetchCanClaimDaily()
    refetchCanClaimWeekly()
    refetchNextClaimTimes()
    refetchRewardAmounts()
    refetchBonusPercentages()
    refetchContractBalance()
  }, [
    refetchConfig,
    refetchUserClaims,
    refetchCanClaimDaily,
    refetchCanClaimWeekly,
    refetchNextClaimTimes,
    refetchRewardAmounts,
    refetchBonusPercentages,
    refetchContractBalance
  ])

  // ===== EFFECTS =====

  // Gestion du succès des transactions normales (non-gasless)
  useEffect(() => {
    if (isConfirmed && lastActivity) {
      if (lastActivity === 'daily_claim') {
        toast.success('Daily claim confirmed!')
      } else if (lastActivity === 'weekly_claim') {
        toast.success('Weekly claim confirmed!')
      }
      
      // Refresh des données
      refresh()
      setLastActivity(null)
    }
  }, [isConfirmed, lastActivity, refresh])

  // Gestion des erreurs de transaction
  useEffect(() => {
    if (error) {
      console.error('Transaction error:', error)
      toast.error('Transaction failed')
      setLastActivity(null)
    }
  }, [error])

  // Auto-refresh toutes les minutes pour mettre à jour les timers
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected && address) {
        refetchCanClaimDaily()
        refetchCanClaimWeekly()
        refetchNextClaimTimes()
      }
    }, 60000) // 1 minute

    return () => clearInterval(interval)
  }, [isConnected, address, refetchCanClaimDaily, refetchCanClaimWeekly, refetchNextClaimTimes])

  return {
    // ===== DONNÉES =====
    claimConfig,
    userClaimData,
    availability,
    contractBalance: contractBalance ? ClaimDistributorUtils.formatTokenAmount(BigInt(contractBalance)) : '0',
    isConnected,
    
    // ===== ÉTATS =====
    isLoading: isLoading || isPending || isConfirming || isSponsoring,
    isPending,
    isConfirming,
    isSuccess,
    isConfirmed,
    error,
    txHash,
    
    // ===== FEATURES =====
    isPaymasterEnabled,
    
    // ===== ACTIONS =====
    claimDaily,
    claimWeekly,
    refresh,
    
    // ===== UTILITAIRES =====
    formatTokenAmount: ClaimDistributorUtils.formatTokenAmount,
    parseTokenAmount: ClaimDistributorUtils.parseTokenAmount,
    isClaimAvailable: ClaimDistributorUtils.isClaimAvailable,
    getNextClaimTime: ClaimDistributorUtils.getNextClaimTime
  }
}

/**
 * Hook simplifié pour les composants qui ont juste besoin des données 
 * sans les fonctions de claim
 */
export function useClaimData() {
  const { 
    claimConfig,
    userClaimData,
    availability,
    contractBalance,
    isConnected,
    isLoading,
    isPaymasterEnabled,
    refresh
  } = useClaimDistributor()
  
  return {
    claimConfig,
    userClaimData,
    availability,
    contractBalance,
    isConnected,
    isLoading,
    isPaymasterEnabled,
    refresh
  }
}
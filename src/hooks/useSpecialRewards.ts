import { useState, useEffect, useCallback } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { toast } from 'sonner'
import {
  SPECIAL_REWARDS_DISTRIBUTOR_CONFIG,
  SpecialRewardsUtils,
  PREDEFINED_SPECIAL_REWARDS,
  type SpecialReward,
  type UserProgressData
} from '@/config/specialRewardsDistributor'
import { base } from 'viem/chains'

/**
 * Hook principal pour interagir avec le Smart Contract SpecialRewardsDistributor
 */
export function useSpecialRewards() {
  const { address, isConnected } = useAccount()
  const { writeContract, data: txHash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // États locaux
  const [isLoading, setIsLoading] = useState(false)
  const [lastActivity, setLastActivity] = useState<string | null>(null)

  // ===== LECTURE DES DONNÉES DU CONTRACT =====

  // IDs des rewards actifs
  const { data: activeRewardIds, refetch: refetchActiveRewards } = useReadContract({
    address: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.contractAddress,
    abi: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.abi,
    functionName: 'getAllActiveRewardIds',
    query: { enabled: isConnected }
  })

  // Vérification si un reward est claimé par l'utilisateur
  const getIsRewardClaimed = useCallback(async (rewardId: string): Promise<boolean> => {
    if (!address || !isConnected) return false
    
    try {
      // TODO: Implémenter la lecture du contract
      // Pour l'instant, fallback localStorage
      const localStorageKey = `special_reward_${rewardId}_${address}`
      return localStorage.getItem(localStorageKey) === 'true'
    } catch (error) {
      console.error('Error checking reward claim status:', error)
      return false
    }
  }, [address, isConnected])

  // Progress utilisateur global
  const { data: rawUserProgress, refetch: refetchUserProgress } = useReadContract({
    address: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.contractAddress,
    abi: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.abi,
    functionName: 'userProgress',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && Boolean(address) }
  })

  // Balance du contract
  const { data: contractBalance, refetch: refetchContractBalance } = useReadContract({
    address: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.contractAddress,
    abi: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.abi,
    functionName: 'getContractBalance',
    query: { enabled: isConnected }
  })

  // ===== PARSING DES DONNÉES =====

  const userProgress: UserProgressData | null = rawUserProgress ? {
    totalSpecialClaimed: BigInt(rawUserProgress[0]),
    completedRewardsCount: BigInt(rawUserProgress[1])
  } : null

  // ===== FONCTIONS UTILITAIRES =====

  /**
   * Récupère les détails d'un reward spécifique
   */
  const getRewardDetails = useCallback(async (rewardId: string) => {
    if (!isConnected) return null

    try {
      // TODO: Utiliser useReadContract pour chaque reward
      // Pour l'instant on utilise les rewards prédéfinis
      const predefined = Object.values(PREDEFINED_SPECIAL_REWARDS).find(r => r.id === rewardId)
      if (predefined) {
        return {
          ...predefined,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2025-12-31'),
          isActive: true,
          totalClaimed: 0,
          maxClaims: 0,
          canClaim: true,
          isClaimed: false
        } as SpecialReward
      }
      return null
    } catch (error) {
      console.error('Error fetching reward details:', error)
      return null
    }
  }, [isConnected])

  /**
   * Vérifie si un reward est visible selon la configuration admin
   */
  const isRewardVisible = useCallback((rewardKey: string): boolean => {
    // Utiliser directement la configuration - PAS de localStorage
    const reward = PREDEFINED_SPECIAL_REWARDS[rewardKey as keyof typeof PREDEFINED_SPECIAL_REWARDS]
    return reward?.visible ?? true
  }, [])

  /**
   * Récupère TOUS les rewards avec leurs détails (claimed, non-claimed, expired)
   * Respecte les contrôles admin de visibilité
   */
  const getAvailableRewards = useCallback(async (): Promise<SpecialReward[]> => {
    if (!isConnected || !address) return []

    try {
      console.log('🔍 Fetching ALL special rewards...')
      
      const allRewards: SpecialReward[] = []
      
      // Charger les rewards prédéfinis selon leur visibilité
      for (const [key, predefined] of Object.entries(PREDEFINED_SPECIAL_REWARDS)) {
        // Vérifier la visibilité selon les contrôles admin
        const visible = isRewardVisible(key)
        
        if (!visible) {
          console.log(`⏭️ Skipping ${key} (hidden by admin)`)
          continue
        }

        const isClaimed = await getIsRewardClaimed(predefined.id)
        const endDate = new Date(predefined.endDate)
        const isExpired = new Date() > endDate
        
        const reward: SpecialReward = {
          ...predefined,
          startDate: new Date('2024-01-01'),
          endDate,
          isActive: true,
          totalClaimed: 0,
          maxClaims: 0,
          canClaim: !isClaimed && !isExpired,
          isClaimed
        }
        
        allRewards.push(reward)
        console.log(`✅ Reward loaded: ${reward.name} - visible: ${visible}, claimed: ${isClaimed}, expired: ${isExpired}, canClaim: ${reward.canClaim}`)
      }

      console.log('🎯 ALL visible rewards:', allRewards)
      
      // Retourner TOUS les rewards visibles, même claimed/expired
      return allRewards
      
    } catch (error) {
      console.error('❌ Error fetching rewards:', error)
      return []
    }
  }, [isConnected, address, getIsRewardClaimed, isRewardVisible])

  // ===== FONCTIONS DE CLAIM =====

  /**
   * Claim un special reward
   */
  const claimSpecialReward = useCallback(async (rewardId: string): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!address || !isConnected) {
      toast.error('Wallet not connected')
      return { success: false, error: 'Wallet not connected' }
    }

    setIsLoading(true)

    try {
      // Vérifier si déjà claimé (localStorage comme fallback)
      const localStorageKey = `special_reward_${rewardId}_${address}`
      if (localStorage.getItem(localStorageKey) === 'true') {
        toast.error('Reward already claimed')
        return { success: false, error: 'Already claimed' }
      }

      // Trouver le reward
      const predefined = Object.values(PREDEFINED_SPECIAL_REWARDS).find(r => r.id === rewardId)
      if (!predefined) {
        toast.error('Reward not found')
        return { success: false, error: 'Reward not found' }
      }

      // Appel réel au smart contract
      writeContract({
        address: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.contractAddress,
        abi: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.abi,
        functionName: 'claimSpecialReward',
        args: [rewardId as `0x${string}`],
        chain: base,
        account: address
      })

      // Marquer comme claimé localement (pour éviter double claim et mise à jour immédiate UI)
      localStorage.setItem(localStorageKey, 'true')
      
      // Toast de succès immédiat pour UX
      const predefinedReward = Object.values(PREDEFINED_SPECIAL_REWARDS).find(r => r.id === rewardId)
      if (predefinedReward) {
        toast.success(`Successfully claimed ${predefinedReward.amount} APX!`, {
          description: predefinedReward.name
        })
      }
      
      setLastActivity(`claim_${rewardId}`)
      return { success: true, txHash: 'pending' }

    } catch (error) {
      console.error('Special reward claim failed:', error)
      toast.error('Failed to claim special reward')
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected, writeContract])

  /**
   * Valide une action sociale (ex: like Devfolio)
   */
  const validateSocialAction = useCallback(async (rewardId: string, action: string): Promise<boolean> => {
    if (!address) return false

    try {
      // Pour l'instant, on accepte toujours (self-declared)
      // TODO: Intégrer avec des APIs pour vérification réelle
      
      if (action === 'like_devfolio') {
        // Simuler une vérification
        toast.success('Thank you for supporting us on Devfolio!', {
          description: 'You can now claim your reward'
        })
        return true
      }

      return false
    } catch (error) {
      console.error('Social action validation failed:', error)
      return false
    }
  }, [address])

  /**
   * Force le rechargement de toutes les données
   */
  const refresh = useCallback(() => {
    refetchActiveRewards()
    refetchUserProgress()
    refetchContractBalance()
  }, [refetchActiveRewards, refetchUserProgress, refetchContractBalance])

  // ===== EFFECTS =====

  // Gestion du succès des transactions
  useEffect(() => {
    if (isConfirmed && lastActivity) {
      if (lastActivity.startsWith('claim_')) {
        toast.success('Special reward claim confirmed!')
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

  return {
    // ===== DONNÉES =====
    userProgress,
    contractBalance: contractBalance ? SpecialRewardsUtils.formatTokenAmount(BigInt(contractBalance)) : '0',
    isConnected,
    
    // ===== ÉTATS =====
    isLoading: isLoading || isPending || isConfirming,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    txHash,
    
    // ===== ACTIONS =====
    getAvailableRewards,
    getRewardDetails,
    claimSpecialReward,
    validateSocialAction,
    refresh,
    
    // ===== UTILITAIRES =====
    formatTokenAmount: SpecialRewardsUtils.formatTokenAmount,
    parseTokenAmount: SpecialRewardsUtils.parseTokenAmount
  }
}

/**
 * Hook simplifié pour les composants qui ont juste besoin des données 
 * sans les fonctions de claim
 */
export function useSpecialRewardsData() {
  const { 
    userProgress,
    contractBalance,
    isConnected,
    isLoading,
    getAvailableRewards,
    refresh
  } = useSpecialRewards()
  
  return {
    userProgress,
    contractBalance,
    isConnected,
    isLoading,
    getAvailableRewards,
    refresh
  }
}
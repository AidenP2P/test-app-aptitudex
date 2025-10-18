import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { toast } from 'sonner'
import { 
  type UserClaimData,
  type ClaimAvailability,
  type ClaimResult,
  CLAIM_CONFIG,
  ClaimCalculator,
  CLAIM_ERRORS,
  CLAIM_MESSAGES
} from '@/config/claimSystem'
import { ClaimStorageService } from '@/services/claimStorage'
import { useAPXMint } from '@/hooks/useAPXMint'
import { useAppStore } from '@/store/useAppStore'
import { isAPXAdmin } from '@/config/apxToken'

/**
 * Hook principal pour gérer le système de claims APX
 */
export function useClaimSystem() {
  const { address, isConnected } = useAccount()
  const { mintTokens, isPending: isMinting, hash: mintHash } = useAPXMint()
  const { addClaimActivity, updateClaimData } = useAppStore()

  // États locaux
  const [userData, setUserData] = useState<UserClaimData | null>(null)
  const [availability, setAvailability] = useState<ClaimAvailability | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  /**
   * Charge les données utilisateur depuis le storage
   */
  const loadUserData = useCallback(() => {
    if (!address || !isConnected) {
      setUserData(null)
      setAvailability(null)
      return
    }

    try {
      // Reset les streaks si nécessaire
      ClaimStorageService.resetStreakIfNeeded(address, 'daily')
      ClaimStorageService.resetStreakIfNeeded(address, 'weekly')
      
      // Charge les données mises à jour
      const data = ClaimStorageService.getUserClaimData(address)
      setUserData(data)
      
      // Met à jour le store global
      updateClaimData({
        lastDailyClaim: data.lastDailyClaim,
        lastWeeklyClaim: data.lastWeeklyClaim,
        currentDailyStreak: data.currentDailyStreak,
        currentWeeklyStreak: data.currentWeeklyStreak,
        totalDailyClaims: data.totalDailyClaims,
        totalWeeklyClaims: data.totalWeeklyClaims,
        canClaimDaily: ClaimCalculator.isClaimAvailable(
          data.lastDailyClaim,
          CLAIM_CONFIG.cooldowns.daily
        ),
        canClaimWeekly: ClaimCalculator.isClaimAvailable(
          data.lastWeeklyClaim,
          CLAIM_CONFIG.cooldowns.weekly
        ),
        nextDailyClaimTime: ClaimCalculator.getNextClaimTime(
          data.lastDailyClaim,
          CLAIM_CONFIG.cooldowns.daily
        )?.toISOString() || null,
        nextWeeklyClaimTime: ClaimCalculator.getNextClaimTime(
          data.lastWeeklyClaim,
          CLAIM_CONFIG.cooldowns.weekly
        )?.toISOString() || null,
      })
      
      setLastUpdate(Date.now())
    } catch (error) {
      console.error('Error loading user data:', error)
      toast.error('Failed to load claim data')
    }
  }, [address, isConnected, updateClaimData])

  /**
   * Calcule la disponibilité des claims
   */
  const calculateAvailability = useCallback((): ClaimAvailability | null => {
    if (!userData) return null

    const canClaimDaily = ClaimCalculator.isClaimAvailable(
      userData.lastDailyClaim,
      CLAIM_CONFIG.cooldowns.daily
    )

    const canClaimWeekly = ClaimCalculator.isClaimAvailable(
      userData.lastWeeklyClaim,
      CLAIM_CONFIG.cooldowns.weekly
    )

    const dailyRewardAmount = ClaimCalculator.calculateRewardAmount(
      CLAIM_CONFIG.dailyReward.baseAmount,
      userData.currentDailyStreak + 1, // +1 car on calcule pour le prochain claim
      CLAIM_CONFIG.dailyReward.streakMultipliers
    )

    const weeklyRewardAmount = ClaimCalculator.calculateRewardAmount(
      CLAIM_CONFIG.weeklyReward.baseAmount,
      userData.currentWeeklyStreak + 1,
      CLAIM_CONFIG.weeklyReward.streakMultipliers
    )

    const dailyStreakBonus = ClaimCalculator.calculateStreakBonus(
      userData.currentDailyStreak + 1,
      CLAIM_CONFIG.dailyReward.streakMultipliers
    )

    const weeklyStreakBonus = ClaimCalculator.calculateStreakBonus(
      userData.currentWeeklyStreak + 1,
      CLAIM_CONFIG.weeklyReward.streakMultipliers
    )

    return {
      canClaimDaily,
      canClaimWeekly,
      nextDailyClaimTime: ClaimCalculator.getNextClaimTime(
        userData.lastDailyClaim,
        CLAIM_CONFIG.cooldowns.daily
      ),
      nextWeeklyClaimTime: ClaimCalculator.getNextClaimTime(
        userData.lastWeeklyClaim,
        CLAIM_CONFIG.cooldowns.weekly
      ),
      dailyRewardAmount,
      weeklyRewardAmount,
      dailyStreakBonus,
      weeklyStreakBonus,
    }
  }, [userData])

  /**
   * Effectue un claim daily
   */
  const claimDaily = useCallback(async (): Promise<ClaimResult> => {
    if (!address || !isConnected) {
      const error = CLAIM_ERRORS.WALLET_NOT_CONNECTED
      toast.error(error)
      return { success: false, amount: '0', newStreak: 0, bonusApplied: 0, nextClaimTime: new Date(), error }
    }

    if (!userData) {
      const error = 'User data not loaded'
      toast.error(error)
      return { success: false, amount: '0', newStreak: 0, bonusApplied: 0, nextClaimTime: new Date(), error }
    }

    if (!ClaimCalculator.isClaimAvailable(userData.lastDailyClaim, CLAIM_CONFIG.cooldowns.daily)) {
      const error = CLAIM_ERRORS.CLAIM_NOT_AVAILABLE
      toast.error(error)
      return { success: false, amount: '0', newStreak: 0, bonusApplied: 0, nextClaimTime: new Date(), error }
    }

    if (!isAPXAdmin(address)) {
      const error = CLAIM_ERRORS.INSUFFICIENT_PERMISSIONS
      toast.error(error)
      return { success: false, amount: '0', newStreak: 0, bonusApplied: 0, nextClaimTime: new Date(), error }
    }

    setIsLoading(true)

    try {
      // Calcule le nouveau streak et reward
      const newStreak = ClaimCalculator.updateStreak(
        userData.currentDailyStreak,
        userData.lastDailyClaim,
        CLAIM_CONFIG.cooldowns.daily
      )

      const rewardAmount = ClaimCalculator.calculateRewardAmount(
        CLAIM_CONFIG.dailyReward.baseAmount,
        newStreak,
        CLAIM_CONFIG.dailyReward.streakMultipliers
      )

      const bonusApplied = ClaimCalculator.calculateStreakBonus(
        newStreak,
        CLAIM_CONFIG.dailyReward.streakMultipliers
      )

      // Mint les tokens APX
      await mintTokens(address, rewardAmount)

      // Met à jour les données utilisateur
      const updatedData = ClaimStorageService.updateDailyClaim(
        address,
        rewardAmount,
        newStreak
      )

      setUserData(updatedData)

      // Ajoute l'activité au store
      addClaimActivity('daily_claim', rewardAmount, newStreak)

      // Messages de succès
      let message: string = CLAIM_MESSAGES.DAILY_CLAIMED
      if (newStreak === 1 && userData.totalDailyClaims === 0) {
        message = CLAIM_MESSAGES.FIRST_CLAIM
      } else if (bonusApplied > 0) {
        message += ` ${CLAIM_MESSAGES.STREAK_BONUS} (+${bonusApplied}%)`
      }

      toast.success(message)

      const nextClaimTime = new Date(Date.now() + CLAIM_CONFIG.cooldowns.daily)

      return {
        success: true,
        amount: rewardAmount,
        newStreak,
        bonusApplied,
        nextClaimTime,
        transactionHash: mintHash,
      }
    } catch (error) {
      console.error('Daily claim failed:', error)
      const errorMessage = CLAIM_ERRORS.MINTING_FAILED
      toast.error(errorMessage)
      return { 
        success: false, 
        amount: '0', 
        newStreak: 0, 
        bonusApplied: 0, 
        nextClaimTime: new Date(), 
        error: errorMessage 
      }
    } finally {
      setIsLoading(false)
      // Recharge les données après le claim
      setTimeout(loadUserData, 1000)
    }
  }, [address, isConnected, userData, mintTokens, addClaimActivity, loadUserData])

  /**
   * Effectue un claim weekly
   */
  const claimWeekly = useCallback(async (): Promise<ClaimResult> => {
    if (!address || !isConnected) {
      const error = CLAIM_ERRORS.WALLET_NOT_CONNECTED
      toast.error(error)
      return { success: false, amount: '0', newStreak: 0, bonusApplied: 0, nextClaimTime: new Date(), error }
    }

    if (!userData) {
      const error = 'User data not loaded'
      toast.error(error)
      return { success: false, amount: '0', newStreak: 0, bonusApplied: 0, nextClaimTime: new Date(), error }
    }

    if (!ClaimCalculator.isClaimAvailable(userData.lastWeeklyClaim, CLAIM_CONFIG.cooldowns.weekly)) {
      const error = CLAIM_ERRORS.CLAIM_NOT_AVAILABLE
      toast.error(error)
      return { success: false, amount: '0', newStreak: 0, bonusApplied: 0, nextClaimTime: new Date(), error }
    }

    if (!isAPXAdmin(address)) {
      const error = CLAIM_ERRORS.INSUFFICIENT_PERMISSIONS
      toast.error(error)
      return { success: false, amount: '0', newStreak: 0, bonusApplied: 0, nextClaimTime: new Date(), error }
    }

    setIsLoading(true)

    try {
      // Calcule le nouveau streak et reward
      const newStreak = ClaimCalculator.updateStreak(
        userData.currentWeeklyStreak,
        userData.lastWeeklyClaim,
        CLAIM_CONFIG.cooldowns.weekly
      )

      const rewardAmount = ClaimCalculator.calculateRewardAmount(
        CLAIM_CONFIG.weeklyReward.baseAmount,
        newStreak,
        CLAIM_CONFIG.weeklyReward.streakMultipliers
      )

      const bonusApplied = ClaimCalculator.calculateStreakBonus(
        newStreak,
        CLAIM_CONFIG.weeklyReward.streakMultipliers
      )

      // Mint les tokens APX
      await mintTokens(address, rewardAmount)

      // Met à jour les données utilisateur
      const updatedData = ClaimStorageService.updateWeeklyClaim(
        address,
        rewardAmount,
        newStreak
      )

      setUserData(updatedData)

      // Ajoute l'activité au store
      addClaimActivity('weekly_claim', rewardAmount, newStreak)

      // Messages de succès
      let message: string = CLAIM_MESSAGES.WEEKLY_CLAIMED
      if (bonusApplied > 0) {
        message += ` ${CLAIM_MESSAGES.STREAK_BONUS} (+${bonusApplied}%)`
      }

      toast.success(message)

      const nextClaimTime = new Date(Date.now() + CLAIM_CONFIG.cooldowns.weekly)

      return {
        success: true,
        amount: rewardAmount,
        newStreak,
        bonusApplied,
        nextClaimTime,
        transactionHash: mintHash,
      }
    } catch (error) {
      console.error('Weekly claim failed:', error)
      const errorMessage = CLAIM_ERRORS.MINTING_FAILED
      toast.error(errorMessage)
      return { 
        success: false, 
        amount: '0', 
        newStreak: 0, 
        bonusApplied: 0, 
        nextClaimTime: new Date(), 
        error: errorMessage 
      }
    } finally {
      setIsLoading(false)
      // Recharge les données après le claim
      setTimeout(loadUserData, 1000)
    }
  }, [address, isConnected, userData, mintTokens, addClaimActivity, loadUserData])

  /**
   * Force le rechargement des données
   */
  const refresh = useCallback(() => {
    loadUserData()
  }, [loadUserData])

  // Charge les données au montage et quand l'adresse change
  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  // Met à jour la disponibilité quand les données changent
  useEffect(() => {
    const newAvailability = calculateAvailability()
    setAvailability(newAvailability)
  }, [calculateAvailability])

  // Auto-refresh toutes les minutes pour mettre à jour les timers
  useEffect(() => {
    const interval = setInterval(() => {
      if (userData) {
        const newAvailability = calculateAvailability()
        setAvailability(newAvailability)
      }
    }, 60000) // 1 minute

    return () => clearInterval(interval)
  }, [userData, calculateAvailability])

  return {
    // Données
    userData,
    availability,
    isConnected,
    isAdmin: address ? isAPXAdmin(address) : false,
    
    // États
    isLoading: isLoading || isMinting,
    lastUpdate,
    
    // Actions
    claimDaily,
    claimWeekly,
    refresh,
    
    // Utilitaires
    exportData: address ? () => ClaimStorageService.exportUserData(address) : null,
    importData: address ? (data: string) => ClaimStorageService.importUserData(address, data) : null,
  }
}

/**
 * Hook pour obtenir uniquement les données sans actions (optimisé pour l'affichage)
 */
export function useClaimData() {
  const { userData, availability, isConnected, isAdmin, lastUpdate } = useClaimSystem()
  
  return {
    userData,
    availability,
    isConnected,
    isAdmin,
    lastUpdate,
  }
}
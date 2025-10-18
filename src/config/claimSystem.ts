import { type Address } from 'viem'

// Types pour le système de claims
export interface StreakMultipliers {
  [days: number]: number
}

export interface RewardConfig {
  baseAmount: string
  streakMultipliers: StreakMultipliers
}

export interface ClaimSystemConfig {
  dailyReward: RewardConfig
  weeklyReward: RewardConfig
  cooldowns: {
    daily: number
    weekly: number
  }
  maxStreakDays: number
  bonusThresholds: number[]
}

// Configuration centralisée des rewards
export const CLAIM_CONFIG: ClaimSystemConfig = {
  dailyReward: {
    baseAmount: '10', // 10 APX par jour
    streakMultipliers: {
      7: 1.2,   // 20% bonus après 7 jours consécutifs
      30: 1.5,  // 50% bonus après 30 jours consécutifs
      100: 2.0, // 100% bonus après 100 jours consécutifs
    }
  },
  weeklyReward: {
    baseAmount: '100', // 100 APX par semaine
    streakMultipliers: {
      4: 1.25,   // 25% bonus après 4 semaines consécutives
      12: 1.5,   // 50% bonus après 12 semaines consécutives
      52: 2.0,   // 100% bonus après 52 semaines consécutives
    }
  },
  cooldowns: {
    daily: 24 * 60 * 60 * 1000,      // 24 heures en milliseconds
    weekly: 7 * 24 * 60 * 60 * 1000, // 7 jours en milliseconds
  },
  maxStreakDays: 365, // Maximum 365 jours de streak
  bonusThresholds: [7, 30, 100] // Seuils pour les bonus de streak
}

// Types pour les données de claim utilisateur
export interface UserClaimData {
  lastDailyClaim: string | null     // ISO timestamp
  lastWeeklyClaim: string | null    // ISO timestamp
  currentDailyStreak: number
  currentWeeklyStreak: number
  totalDailyClaims: number
  totalWeeklyClaims: number
  lifetimeAPXClaimed: string
  streakRecord: {
    longestDailyStreak: number
    longestWeeklyStreak: number
  }
}

// État des claims disponibles
export interface ClaimAvailability {
  canClaimDaily: boolean
  canClaimWeekly: boolean
  nextDailyClaimTime: Date | null
  nextWeeklyClaimTime: Date | null
  dailyRewardAmount: string
  weeklyRewardAmount: string
  dailyStreakBonus: number
  weeklyStreakBonus: number
}

// Résultat d'un claim
export interface ClaimResult {
  success: boolean
  amount: string
  newStreak: number
  bonusApplied: number
  nextClaimTime: Date
  transactionHash?: string
  error?: string
}

// Utilitaires pour le calcul des rewards
export class ClaimCalculator {
  /**
   * Calcule le montant de reward avec bonus de streak
   */
  static calculateRewardAmount(
    baseAmount: string,
    currentStreak: number,
    streakMultipliers: StreakMultipliers
  ): string {
    const base = parseFloat(baseAmount)
    let multiplier = 1

    // Trouve le plus grand multiplicateur applicable
    const applicableThresholds = Object.keys(streakMultipliers)
      .map(Number)
      .filter(threshold => currentStreak >= threshold)
      .sort((a, b) => b - a)

    if (applicableThresholds.length > 0) {
      multiplier = streakMultipliers[applicableThresholds[0]]
    }

    const finalAmount = base * multiplier
    return finalAmount.toFixed(6)
  }

  /**
   * Calcule le bonus de streak en pourcentage
   */
  static calculateStreakBonus(
    currentStreak: number,
    streakMultipliers: StreakMultipliers
  ): number {
    const applicableThresholds = Object.keys(streakMultipliers)
      .map(Number)
      .filter(threshold => currentStreak >= threshold)
      .sort((a, b) => b - a)

    if (applicableThresholds.length > 0) {
      const multiplier = streakMultipliers[applicableThresholds[0]]
      return Math.round((multiplier - 1) * 100) // Convertit en pourcentage
    }

    return 0
  }

  /**
   * Vérifie si un claim est disponible
   */
  static isClaimAvailable(
    lastClaimTime: string | null,
    cooldownMs: number
  ): boolean {
    if (!lastClaimTime) return true

    const lastClaim = new Date(lastClaimTime)
    const now = new Date()
    const timeSinceLastClaim = now.getTime() - lastClaim.getTime()

    return timeSinceLastClaim >= cooldownMs
  }

  /**
   * Calcule le temps jusqu'au prochain claim
   */
  static getNextClaimTime(
    lastClaimTime: string | null,
    cooldownMs: number
  ): Date | null {
    if (!lastClaimTime) return null

    const lastClaim = new Date(lastClaimTime)
    return new Date(lastClaim.getTime() + cooldownMs)
  }

  /**
   * Vérifie si un streak est maintenu
   */
  static isStreakMaintained(
    lastClaimTime: string | null,
    cooldownMs: number,
    gracePeriodMs: number = 2 * 60 * 60 * 1000 // 2 heures de grâce
  ): boolean {
    if (!lastClaimTime) return false

    const lastClaim = new Date(lastClaimTime)
    const now = new Date()
    const timeSinceLastClaim = now.getTime() - lastClaim.getTime()
    const maxAllowedGap = cooldownMs + gracePeriodMs

    return timeSinceLastClaim <= maxAllowedGap
  }

  /**
   * Met à jour le streak après un claim
   */
  static updateStreak(
    currentStreak: number,
    lastClaimTime: string | null,
    cooldownMs: number
  ): number {
    if (this.isStreakMaintained(lastClaimTime, cooldownMs)) {
      return currentStreak + 1
    } else {
      return 1 // Reset du streak
    }
  }
}

// Constantes pour le localStorage
export const CLAIM_STORAGE_KEYS = {
  USER_CLAIM_DATA: 'aptitudex_claim_data',
  BACKUP_TIMESTAMP: 'aptitudex_claim_backup',
} as const

// Messages d'erreur standardisés
export const CLAIM_ERRORS = {
  WALLET_NOT_CONNECTED: 'Wallet not connected',
  CLAIM_NOT_AVAILABLE: 'Claim not available yet',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for minting',
  MINTING_FAILED: 'Failed to mint APX tokens',
  STORAGE_ERROR: 'Failed to save claim data',
  INVALID_AMOUNT: 'Invalid reward amount',
} as const

// Messages de succès
export const CLAIM_MESSAGES = {
  DAILY_CLAIMED: 'Daily reward claimed successfully!',
  WEEKLY_CLAIMED: 'Weekly reward claimed successfully!',
  STREAK_BONUS: 'Streak bonus applied!',
  FIRST_CLAIM: 'Welcome! First claim completed!',
} as const
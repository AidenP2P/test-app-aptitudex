import { 
  type UserClaimData, 
  CLAIM_STORAGE_KEYS,
  CLAIM_CONFIG 
} from '@/config/claimSystem'

/**
 * Service pour gérer la persistance des données de claim dans localStorage
 */
export class ClaimStorageService {
  /**
   * Données par défaut pour un nouvel utilisateur
   */
  private static getDefaultUserData(): UserClaimData {
    return {
      lastDailyClaim: null,
      lastWeeklyClaim: null,
      currentDailyStreak: 0,
      currentWeeklyStreak: 0,
      totalDailyClaims: 0,
      totalWeeklyClaims: 0,
      lifetimeAPXClaimed: '0',
      streakRecord: {
        longestDailyStreak: 0,
        longestWeeklyStreak: 0,
      },
    }
  }

  /**
   * Génère la clé de stockage unique pour un utilisateur
   */
  private static getUserStorageKey(userAddress: string): string {
    return `${CLAIM_STORAGE_KEYS.USER_CLAIM_DATA}_${userAddress.toLowerCase()}`
  }

  /**
   * Récupère les données de claim pour un utilisateur
   */
  static getUserClaimData(userAddress: string): UserClaimData {
    try {
      const key = this.getUserStorageKey(userAddress)
      const stored = localStorage.getItem(key)
      
      if (!stored) {
        return this.getDefaultUserData()
      }

      const parsed = JSON.parse(stored) as UserClaimData
      
      // Validation et migration des données si nécessaire
      return this.validateAndMigrateData(parsed)
    } catch (error) {
      console.error('Error reading claim data from storage:', error)
      return this.getDefaultUserData()
    }
  }

  /**
   * Sauvegarde les données de claim pour un utilisateur
   */
  static saveUserClaimData(userAddress: string, data: UserClaimData): boolean {
    try {
      const key = this.getUserStorageKey(userAddress)
      const dataToStore = {
        ...data,
        // Ajouter timestamp pour backup
        lastUpdated: new Date().toISOString(),
      }
      
      localStorage.setItem(key, JSON.stringify(dataToStore))
      
      // Backup timestamp pour nettoyage
      localStorage.setItem(
        CLAIM_STORAGE_KEYS.BACKUP_TIMESTAMP, 
        Date.now().toString()
      )
      
      return true
    } catch (error) {
      console.error('Error saving claim data to storage:', error)
      return false
    }
  }

  /**
   * Met à jour les données après un claim daily
   */
  static updateDailyClaim(
    userAddress: string,
    rewardAmount: string,
    newStreak: number
  ): UserClaimData {
    const currentData = this.getUserClaimData(userAddress)
    const now = new Date().toISOString()
    
    const updatedData: UserClaimData = {
      ...currentData,
      lastDailyClaim: now,
      currentDailyStreak: newStreak,
      totalDailyClaims: currentData.totalDailyClaims + 1,
      lifetimeAPXClaimed: (
        parseFloat(currentData.lifetimeAPXClaimed) + parseFloat(rewardAmount)
      ).toString(),
      streakRecord: {
        ...currentData.streakRecord,
        longestDailyStreak: Math.max(
          currentData.streakRecord.longestDailyStreak,
          newStreak
        ),
      },
    }

    this.saveUserClaimData(userAddress, updatedData)
    return updatedData
  }

  /**
   * Met à jour les données après un claim weekly
   */
  static updateWeeklyClaim(
    userAddress: string,
    rewardAmount: string,
    newStreak: number
  ): UserClaimData {
    const currentData = this.getUserClaimData(userAddress)
    const now = new Date().toISOString()
    
    const updatedData: UserClaimData = {
      ...currentData,
      lastWeeklyClaim: now,
      currentWeeklyStreak: newStreak,
      totalWeeklyClaims: currentData.totalWeeklyClaims + 1,
      lifetimeAPXClaimed: (
        parseFloat(currentData.lifetimeAPXClaimed) + parseFloat(rewardAmount)
      ).toString(),
      streakRecord: {
        ...currentData.streakRecord,
        longestWeeklyStreak: Math.max(
          currentData.streakRecord.longestWeeklyStreak,
          newStreak
        ),
      },
    }

    this.saveUserClaimData(userAddress, updatedData)
    return updatedData
  }

  /**
   * Reset le streak si nécessaire (après une période manquée)
   */
  static resetStreakIfNeeded(
    userAddress: string,
    type: 'daily' | 'weekly'
  ): UserClaimData {
    const currentData = this.getUserClaimData(userAddress)
    const cooldown = type === 'daily' 
      ? CLAIM_CONFIG.cooldowns.daily 
      : CLAIM_CONFIG.cooldowns.weekly
    
    const lastClaimTime = type === 'daily' 
      ? currentData.lastDailyClaim 
      : currentData.lastWeeklyClaim
    
    if (!lastClaimTime) return currentData

    const lastClaim = new Date(lastClaimTime)
    const now = new Date()
    const timeSinceLastClaim = now.getTime() - lastClaim.getTime()
    const gracePeriod = 2 * 60 * 60 * 1000 // 2 heures de grâce
    const maxAllowedGap = cooldown + gracePeriod

    // Si trop de temps s'est écoulé, reset le streak
    if (timeSinceLastClaim > maxAllowedGap) {
      const updatedData: UserClaimData = {
        ...currentData,
        [type === 'daily' ? 'currentDailyStreak' : 'currentWeeklyStreak']: 0,
      }
      
      this.saveUserClaimData(userAddress, updatedData)
      return updatedData
    }

    return currentData
  }

  /**
   * Valide et migre les données anciennes si nécessaire
   */
  private static validateAndMigrateData(data: any): UserClaimData {
    const defaultData = this.getDefaultUserData()
    
    // Migration et validation des champs
    return {
      lastDailyClaim: data.lastDailyClaim || defaultData.lastDailyClaim,
      lastWeeklyClaim: data.lastWeeklyClaim || defaultData.lastWeeklyClaim,
      currentDailyStreak: Math.max(0, data.currentDailyStreak || 0),
      currentWeeklyStreak: Math.max(0, data.currentWeeklyStreak || 0),
      totalDailyClaims: Math.max(0, data.totalDailyClaims || 0),
      totalWeeklyClaims: Math.max(0, data.totalWeeklyClaims || 0),
      lifetimeAPXClaimed: data.lifetimeAPXClaimed || defaultData.lifetimeAPXClaimed,
      streakRecord: {
        longestDailyStreak: Math.max(0, data.streakRecord?.longestDailyStreak || 0),
        longestWeeklyStreak: Math.max(0, data.streakRecord?.longestWeeklyStreak || 0),
      },
    }
  }

  /**
   * Exporte les données utilisateur pour backup
   */
  static exportUserData(userAddress: string): string {
    const data = this.getUserClaimData(userAddress)
    return JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      userAddress: userAddress.toLowerCase(),
      claimData: data,
    }, null, 2)
  }

  /**
   * Importe les données utilisateur depuis un backup
   */
  static importUserData(userAddress: string, backupData: string): boolean {
    try {
      const parsed = JSON.parse(backupData)
      
      if (parsed.userAddress !== userAddress.toLowerCase()) {
        throw new Error('Backup data is for a different user address')
      }
      
      const validatedData = this.validateAndMigrateData(parsed.claimData)
      return this.saveUserClaimData(userAddress, validatedData)
    } catch (error) {
      console.error('Error importing backup data:', error)
      return false
    }
  }

  /**
   * Nettoie les données anciennes (optionnel, pour l'optimisation)
   */
  static cleanupOldData(maxAgeMs: number = 365 * 24 * 60 * 60 * 1000): number {
    let cleanedCount = 0
    
    try {
      const keys = Object.keys(localStorage)
      const claimDataKeys = keys.filter(key => 
        key.startsWith(CLAIM_STORAGE_KEYS.USER_CLAIM_DATA)
      )
      
      claimDataKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          const lastUpdated = data.lastUpdated
          
          if (lastUpdated) {
            const age = Date.now() - new Date(lastUpdated).getTime()
            if (age > maxAgeMs) {
              localStorage.removeItem(key)
              cleanedCount++
            }
          }
        } catch (error) {
          // Si on ne peut pas parser, supprimer la clé corrompue
          localStorage.removeItem(key)
          cleanedCount++
        }
      })
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
    
    return cleanedCount
  }

  /**
   * Obtient des statistiques sur l'utilisation du storage
   */
  static getStorageStats(): {
    totalUsers: number
    totalStorage: number
    oldestEntry: string | null
    newestEntry: string | null
  } {
    try {
      const keys = Object.keys(localStorage)
      const claimDataKeys = keys.filter(key => 
        key.startsWith(CLAIM_STORAGE_KEYS.USER_CLAIM_DATA)
      )
      
      let totalStorage = 0
      let oldestEntry: string | null = null
      let newestEntry: string | null = null
      
      claimDataKeys.forEach(key => {
        const data = localStorage.getItem(key)
        if (data) {
          totalStorage += data.length
          
          try {
            const parsed = JSON.parse(data)
            const lastUpdated = parsed.lastUpdated
            
            if (lastUpdated) {
              if (!oldestEntry || lastUpdated < oldestEntry) {
                oldestEntry = lastUpdated
              }
              if (!newestEntry || lastUpdated > newestEntry) {
                newestEntry = lastUpdated
              }
            }
          } catch (error) {
            // Ignorer les entrées corrompues
          }
        }
      })
      
      return {
        totalUsers: claimDataKeys.length,
        totalStorage,
        oldestEntry,
        newestEntry,
      }
    } catch (error) {
      console.error('Error getting storage stats:', error)
      return {
        totalUsers: 0,
        totalStorage: 0,
        oldestEntry: null,
        newestEntry: null,
      }
    }
  }
}
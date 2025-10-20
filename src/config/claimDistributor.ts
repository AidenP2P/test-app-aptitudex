import { type Address } from 'viem'

// Configuration du Smart Contract ClaimDistributor
export const CLAIM_DISTRIBUTOR_CONFIG = {
  // Adresse du contract (à déployer)
  contractAddress: '0x9Af5dFD8903968D6d0e20e741fB0737E6de67a97' as Address, 
  
  // ABI du contrat ClaimDistributor
  abi: [
    // ===== FUNCTIONS =====
    {
      "type": "function",
      "name": "claimDaily",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "claimWeekly", 
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "provision",
      "inputs": [{"name": "amount", "type": "uint256"}],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "updateConfig",
      "inputs": [
        {"name": "_dailyAmount", "type": "uint256"},
        {"name": "_weeklyAmount", "type": "uint256"},
        {"name": "_enabled", "type": "bool"}
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "toggleClaims",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "emergencyWithdraw",
      "inputs": [{"name": "amount", "type": "uint256"}],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "updateStreakMultipliers",
      "inputs": [
        {"name": "isDaily", "type": "bool"},
        {"name": "thresholds", "type": "uint256[]"},
        {"name": "multipliers", "type": "uint256[]"}
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    
    // ===== VIEW FUNCTIONS =====
    {
      "type": "function",
      "name": "canClaimDaily",
      "inputs": [{"name": "user", "type": "address"}],
      "outputs": [{"name": "", "type": "bool"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "canClaimWeekly",
      "inputs": [{"name": "user", "type": "address"}],
      "outputs": [{"name": "", "type": "bool"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getNextClaimTimes",
      "inputs": [{"name": "user", "type": "address"}],
      "outputs": [
        {"name": "nextDaily", "type": "uint256"},
        {"name": "nextWeekly", "type": "uint256"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getRewardAmounts",
      "inputs": [{"name": "user", "type": "address"}],
      "outputs": [
        {"name": "dailyReward", "type": "uint256"},
        {"name": "weeklyReward", "type": "uint256"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getBonusPercentages",
      "inputs": [{"name": "user", "type": "address"}],
      "outputs": [
        {"name": "dailyBonus", "type": "uint256"},
        {"name": "weeklyBonus", "type": "uint256"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getContractBalance",
      "inputs": [],
      "outputs": [{"name": "", "type": "uint256"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getStreakMultipliers",
      "inputs": [{"name": "isDaily", "type": "bool"}],
      "outputs": [
        {
          "name": "",
          "type": "tuple[]",
          "components": [
            {"name": "threshold", "type": "uint256"},
            {"name": "multiplier", "type": "uint256"}
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "userClaims",
      "inputs": [{"name": "user", "type": "address"}],
      "outputs": [
        {"name": "lastDailyClaim", "type": "uint256"},
        {"name": "lastWeeklyClaim", "type": "uint256"},
        {"name": "currentDailyStreak", "type": "uint256"},
        {"name": "currentWeeklyStreak", "type": "uint256"},
        {"name": "totalDailyClaims", "type": "uint256"},
        {"name": "totalWeeklyClaims", "type": "uint256"},
        {"name": "lifetimeAPXClaimed", "type": "uint256"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "claimConfig",
      "inputs": [],
      "outputs": [
        {"name": "dailyAmount", "type": "uint256"},
        {"name": "weeklyAmount", "type": "uint256"},
        {"name": "maxStreakDays", "type": "uint256"},
        {"name": "enabled", "type": "bool"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "apxToken",
      "inputs": [],
      "outputs": [{"name": "", "type": "address"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "owner",
      "inputs": [],
      "outputs": [{"name": "", "type": "address"}],
      "stateMutability": "view"
    },
    
    // ===== EVENTS =====
    {
      "type": "event",
      "name": "DailyClaimed",
      "inputs": [
        {"name": "user", "type": "address", "indexed": true},
        {"name": "amount", "type": "uint256", "indexed": false},
        {"name": "streak", "type": "uint256", "indexed": false},
        {"name": "bonusPercent", "type": "uint256", "indexed": false}
      ]
    },
    {
      "type": "event",
      "name": "WeeklyClaimed",
      "inputs": [
        {"name": "user", "type": "address", "indexed": true},
        {"name": "amount", "type": "uint256", "indexed": false},
        {"name": "streak", "type": "uint256", "indexed": false},
        {"name": "bonusPercent", "type": "uint256", "indexed": false}
      ]
    },
    {
      "type": "event",
      "name": "ConfigUpdated",
      "inputs": [
        {"name": "dailyAmount", "type": "uint256", "indexed": false},
        {"name": "weeklyAmount", "type": "uint256", "indexed": false},
        {"name": "enabled", "type": "bool", "indexed": false}
      ]
    },
    {
      "type": "event",
      "name": "Provisioned",
      "inputs": [
        {"name": "admin", "type": "address", "indexed": true},
        {"name": "amount", "type": "uint256", "indexed": false},
        {"name": "newBalance", "type": "uint256", "indexed": false}
      ]
    },
    {
      "type": "event",
      "name": "StreakMultiplierUpdated",
      "inputs": [
        {"name": "isDaily", "type": "bool", "indexed": false},
        {"name": "threshold", "type": "uint256", "indexed": false},
        {"name": "multiplier", "type": "uint256", "indexed": false}
      ]
    },
    {
      "type": "event",
      "name": "EmergencyWithdraw",
      "inputs": [
        {"name": "admin", "type": "address", "indexed": true},
        {"name": "amount", "type": "uint256", "indexed": false}
      ]
    }
  ] as const
} as const

// Types TypeScript pour les structures du contract
export interface UserClaimData {
  lastDailyClaim: bigint
  lastWeeklyClaim: bigint
  currentDailyStreak: bigint
  currentWeeklyStreak: bigint
  totalDailyClaims: bigint
  totalWeeklyClaims: bigint
  lifetimeAPXClaimed: bigint
}

export interface ClaimConfig {
  dailyAmount: bigint
  weeklyAmount: bigint
  maxStreakDays: bigint
  enabled: boolean
}

export interface StreakMultiplier {
  threshold: bigint
  multiplier: bigint
}

export interface ClaimAvailability {
  canClaimDaily: boolean
  canClaimWeekly: boolean
  nextDailyClaimTime: Date | null
  nextWeeklyClaimTime: Date | null
  dailyRewardAmount: string
  weeklyRewardAmount: string
  dailyBonusPercent: number
  weeklyBonusPercent: number
}

// Constantes
export const CLAIM_DISTRIBUTOR_CONSTANTS = {
  COOLDOWN_DAILY: 24 * 60 * 60, // 24 heures en secondes
  COOLDOWN_WEEKLY: 7 * 24 * 60 * 60, // 7 jours en secondes
  GRACE_PERIOD: 2 * 60 * 60, // 2 heures en secondes
  BASIS_POINTS: 10000
} as const

// Utilitaires pour convertir les données du contract
export class ClaimDistributorUtils {
  /**
   * Convertit les données utilisateur du contract en format utilisable
   */
  static parseUserClaimData(rawData: any[]): UserClaimData {
    return {
      lastDailyClaim: BigInt(rawData[0] || 0),
      lastWeeklyClaim: BigInt(rawData[1] || 0),
      currentDailyStreak: BigInt(rawData[2] || 0),
      currentWeeklyStreak: BigInt(rawData[3] || 0),
      totalDailyClaims: BigInt(rawData[4] || 0),
      totalWeeklyClaims: BigInt(rawData[5] || 0),
      lifetimeAPXClaimed: BigInt(rawData[6] || 0)
    }
  }

  /**
   * Convertit la configuration du contract
   */
  static parseClaimConfig(rawData: any[]): ClaimConfig {
    return {
      dailyAmount: BigInt(rawData[0] || 0),
      weeklyAmount: BigInt(rawData[1] || 0),
      maxStreakDays: BigInt(rawData[2] || 0),
      enabled: Boolean(rawData[3])
    }
  }

  /**
   * Convertit un timestamp de prochain claim en Date
   * Le contrat renvoie déjà le timestamp exact du prochain claim disponible
   */
  static getNextClaimTime(nextClaimTimestamp: bigint, cooldownSeconds?: number): Date | null {
    if (nextClaimTimestamp === 0n) return null
    
    // Le timestamp est déjà le moment exact où le claim sera disponible
    const nextClaimMs = Number(nextClaimTimestamp) * 1000
    
    // Vérifier que ce n'est pas dans le passé
    const now = Date.now()
    if (nextClaimMs <= now) return null
    
    return new Date(nextClaimMs)
  }

  /**
   * Vérifie si un claim est disponible basé sur le timestamp de prochain claim
   */
  static isClaimAvailable(nextClaimTimestamp: bigint): boolean {
    if (nextClaimTimestamp === 0n) return true
    
    const now = Date.now()
    const nextClaimMs = Number(nextClaimTimestamp) * 1000
    
    return now >= nextClaimMs
  }

  /**
   * Formate un montant en wei vers une chaîne lisible
   */
  static formatTokenAmount(amountWei: bigint, decimals: number = 18): string {
    const divisor = BigInt(10 ** decimals)
    const wholePart = amountWei / divisor
    const fractionalPart = amountWei % divisor
    
    if (fractionalPart === 0n) {
      return wholePart.toString()
    }
    
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
    const trimmedFractional = fractionalStr.replace(/0+$/, '')
    
    if (trimmedFractional === '') {
      return wholePart.toString()
    }
    
    return `${wholePart}.${trimmedFractional}`
  }

  /**
   * Parse un montant de token vers wei
   */
  static parseTokenAmount(amount: string, decimals: number = 18): bigint {
    const [wholePart, fractionalPart = ''] = amount.split('.')
    const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals)
    
    return BigInt(wholePart + paddedFractional)
  }
}
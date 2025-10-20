import { type Address } from 'viem'

// Configuration du Smart Contract SpecialRewardsDistributor
export const SPECIAL_REWARDS_DISTRIBUTOR_CONFIG = {
  // Adresse du contract déployé sur Base
  contractAddress: '0xb2a507877F5F3c593ee3BeaAc0ff92161D28775C' as Address,
  
  // ABI du contrat SpecialRewardsDistributor
  abi: [
    // ===== FUNCTIONS =====
    {
      "type": "function",
      "name": "createSpecialReward",
      "inputs": [
        {"name": "rewardId", "type": "bytes32"},
        {"name": "amount", "type": "uint256"},
        {"name": "startTime", "type": "uint256"},
        {"name": "endTime", "type": "uint256"},
        {"name": "rewardType", "type": "string"},
        {"name": "requirements", "type": "string"},
        {"name": "maxClaims", "type": "uint256"}
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "claimSpecialReward",
      "inputs": [{"name": "rewardId", "type": "bytes32"}],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "updateUserProgress",
      "inputs": [
        {"name": "user", "type": "address"},
        {"name": "rewardId", "type": "bytes32"},
        {"name": "progressValue", "type": "uint256"}
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "toggleRewardStatus",
      "inputs": [{"name": "rewardId", "type": "bytes32"}],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "updateRewardDetails",
      "inputs": [
        {"name": "rewardId", "type": "bytes32"},
        {"name": "newAmount", "type": "uint256"},
        {"name": "newEndTime", "type": "uint256"},
        {"name": "newRequirements", "type": "string"}
      ],
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
      "name": "emergencyWithdraw",
      "inputs": [{"name": "amount", "type": "uint256"}],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    
    // ===== VIEW FUNCTIONS =====
    {
      "type": "function",
      "name": "getAvailableRewards",
      "inputs": [{"name": "user", "type": "address"}],
      "outputs": [{"name": "", "type": "bytes32[]"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "canClaimReward",
      "inputs": [
        {"name": "user", "type": "address"},
        {"name": "rewardId", "type": "bytes32"}
      ],
      "outputs": [{"name": "", "type": "bool"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getRewardDetails",
      "inputs": [{"name": "rewardId", "type": "bytes32"}],
      "outputs": [
        {"name": "amount", "type": "uint256"},
        {"name": "startTime", "type": "uint256"},
        {"name": "endTime", "type": "uint256"},
        {"name": "isActive", "type": "bool"},
        {"name": "rewardType", "type": "string"},
        {"name": "requirements", "type": "string"},
        {"name": "totalClaimed", "type": "uint256"},
        {"name": "maxClaims", "type": "uint256"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getUserProgressData",
      "inputs": [
        {"name": "user", "type": "address"},
        {"name": "rewardId", "type": "bytes32"}
      ],
      "outputs": [{"name": "", "type": "uint256"}],
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
      "name": "getActiveRewardsCount",
      "inputs": [],
      "outputs": [{"name": "", "type": "uint256"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getAllActiveRewardIds",
      "inputs": [],
      "outputs": [{"name": "", "type": "bytes32[]"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "specialRewards",
      "inputs": [{"name": "rewardId", "type": "bytes32"}],
      "outputs": [
        {"name": "amount", "type": "uint256"},
        {"name": "startTime", "type": "uint256"},
        {"name": "endTime", "type": "uint256"},
        {"name": "isActive", "type": "bool"},
        {"name": "rewardType", "type": "string"},
        {"name": "requirements", "type": "string"},
        {"name": "totalClaimed", "type": "uint256"},
        {"name": "maxClaims", "type": "uint256"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "userClaimedReward",
      "inputs": [
        {"name": "user", "type": "address"},
        {"name": "rewardId", "type": "bytes32"}
      ],
      "outputs": [{"name": "", "type": "bool"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "userProgress",
      "inputs": [{"name": "user", "type": "address"}],
      "outputs": [
        {"name": "totalSpecialClaimed", "type": "uint256"},
        {"name": "completedRewardsCount", "type": "uint256"}
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
      "name": "SpecialRewardCreated",
      "inputs": [
        {"name": "rewardId", "type": "bytes32", "indexed": true},
        {"name": "amount", "type": "uint256", "indexed": false},
        {"name": "rewardType", "type": "string", "indexed": false}
      ]
    },
    {
      "type": "event",
      "name": "SpecialRewardClaimed",
      "inputs": [
        {"name": "user", "type": "address", "indexed": true},
        {"name": "rewardId", "type": "bytes32", "indexed": true},
        {"name": "amount", "type": "uint256", "indexed": false}
      ]
    },
    {
      "type": "event",
      "name": "SpecialRewardUpdated",
      "inputs": [
        {"name": "rewardId", "type": "bytes32", "indexed": true},
        {"name": "isActive", "type": "bool", "indexed": false}
      ]
    },
    {
      "type": "event",
      "name": "ProgressUpdated",
      "inputs": [
        {"name": "user", "type": "address", "indexed": true},
        {"name": "rewardId", "type": "bytes32", "indexed": true},
        {"name": "progress", "type": "uint256", "indexed": false}
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
      "name": "EmergencyWithdraw",
      "inputs": [
        {"name": "admin", "type": "address", "indexed": true},
        {"name": "amount", "type": "uint256", "indexed": false}
      ]
    }
  ] as const
} as const

// Types TypeScript pour les structures du contract
export interface SpecialRewardData {
  amount: bigint
  startTime: bigint
  endTime: bigint
  isActive: boolean
  rewardType: string
  requirements: string
  totalClaimed: bigint
  maxClaims: bigint
}

export interface UserProgressData {
  totalSpecialClaimed: bigint
  completedRewardsCount: bigint
}

export interface SpecialReward {
  id: string // bytes32 converti en string
  name: string
  amount: string // Formaté pour l'affichage
  description: string
  startDate: Date
  endDate: Date
  isActive: boolean
  rewardType: 'base_batches' | 'quiz' | 'social' | 'contest'
  requirements: any // JSON parsé
  totalClaimed: number
  maxClaims: number
  canClaim: boolean
  isClaimed: boolean
}

// Utilitaires pour convertir les données du contract
export class SpecialRewardsUtils {
  /**
   * Convertit bytes32 en string hex
   */
  static bytes32ToString(bytes32: string): string {
    return bytes32
  }

  /**
   * Convertit string en bytes32
   */
  static stringToBytes32(str: string): string {
    // Pour l'instant, on utilise keccak256 côté frontend ou un hash simple
    return str.padEnd(66, '0') // Simple padding pour les tests
  }

  /**
   * Parse les requirements JSON
   */
  static parseRequirements(requirementsJson: string): any {
    try {
      return JSON.parse(requirementsJson)
    } catch {
      return {}
    }
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

  /**
   * Convertit les données brutes du contract en SpecialReward
   */
  static parseSpecialReward(
    rewardId: string, 
    rawData: any[], 
    canClaim: boolean, 
    isClaimed: boolean
  ): SpecialReward {
    const requirements = this.parseRequirements(rawData[5] || '{}')
    
    return {
      id: rewardId,
      name: requirements.name || 'Special Reward',
      amount: this.formatTokenAmount(BigInt(rawData[0] || 0)),
      description: requirements.description || '',
      startDate: new Date(Number(rawData[1] || 0) * 1000),
      endDate: new Date(Number(rawData[2] || 0) * 1000),
      isActive: Boolean(rawData[3]),
      rewardType: rawData[4] || 'contest',
      requirements,
      totalClaimed: Number(rawData[6] || 0),
      maxClaims: Number(rawData[7] || 0),
      canClaim,
      isClaimed
    }
  }
}

// Configuration des rewards prédéfinis avec contrôle de visibilité
export const PREDEFINED_SPECIAL_REWARDS = {
  ALPHA_LAUNCH: {
    id: '0x616c7068616c61756e63680000000000000000000000000000000000000000', // "alphalaunch" en bytes32
    name: 'Celebrate Alpha version launch for Base Community',
    amount: '50',
    description: 'Exclusive reward for you as first users of this app!',
    rewardType: 'base_batches' as const,
    endDate: '2025-12-31',
    visible: false, // 🎛️ Admin Control: Set to false to hide this reward globally
    requirements: {
      name: 'Celebrate Alpha version launch for Base Community',
      description: 'Exclusive reward for you as first users of this app!',
      type: 'one_time',
      eligibility: 'alpha_user'
    }
  },
  DEVFOLIO_LIKE: {
    id: '0x6465766f666f6c696f6c696b65000000000000000000000000000000000000', // "devfoliolike" en bytes32
    name: 'Support us on Devfolio',
    amount: '1000',
    description: 'Like our project in the context of Base Batches 002 Builder and get rewarded!',
    rewardType: 'social' as const,
    endDate: '2025-12-31', // Corrigé : date dans le futur
    visible: true, // 🎛️ Admin Control: Set to false to hide this reward globally
    requirements: {
      name: 'Support us on Devfolio',
      description: 'Like our project in the context of Base Batches 002 Builder and get rewarded!',
      type: 'social_action',
      action: 'like_devfolio',
      url: 'https://devfolio.co/projects/kudos-protocol-d7e4',
      verification: 'self_declared'
    }
  }
} as const
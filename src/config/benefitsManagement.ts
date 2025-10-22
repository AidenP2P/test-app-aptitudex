import { type Address } from 'viem'

// Configuration du Smart Contract BenefitsManagement
export const BENEFITS_MANAGEMENT_CONFIG = {
  // Adresse du contract déployé sur Base (à mettre à jour après déploiement)
  contractAddress: '0x0000000000000000000000000000000000000000' as Address,
  
  // Adresse du token APX
  apxTokenAddress: '0x1A51cC117Ab0f4881Db1260C9344C479D0893dD3' as Address,
  
  // ABI du contrat BenefitsManagement
  abi: [
    // ===== FUNCTIONS =====
    {
      "type": "function",
      "name": "createBenefit",
      "inputs": [
        {"name": "benefitId", "type": "bytes32"},
        {"name": "priceAPX", "type": "uint256"},
        {"name": "title", "type": "string"},
        {"name": "description", "type": "string"},
        {"name": "mechanics", "type": "string"},
        {"name": "guardrails", "type": "string"},
        {"name": "tokenomics", "type": "string"},
        {"name": "iconName", "type": "string"},
        {"name": "colorClass", "type": "string"},
        {"name": "maxRedemptions", "type": "uint256"}
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "redeemBenefit",
      "inputs": [{"name": "benefitId", "type": "bytes32"}],
      "outputs": [{"name": "orderId", "type": "string"}],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "submitContactHash",
      "inputs": [
        {"name": "orderId", "type": "string"},
        {"name": "contactHash", "type": "bytes32"}
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "updateBenefit",
      "inputs": [
        {"name": "benefitId", "type": "bytes32"},
        {"name": "newPriceAPX", "type": "uint256"},
        {"name": "newTitle", "type": "string"},
        {"name": "newDescription", "type": "string"},
        {"name": "isActive", "type": "bool"}
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "markAsProcessed",
      "inputs": [{"name": "orderId", "type": "string"}],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "initializePredefinedBenefits",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    
    // ===== VIEW FUNCTIONS =====
    {
      "type": "function",
      "name": "getBenefitDetails",
      "inputs": [{"name": "benefitId", "type": "bytes32"}],
      "outputs": [
        {"name": "priceAPX", "type": "uint256"},
        {"name": "title", "type": "string"},
        {"name": "description", "type": "string"},
        {"name": "mechanics", "type": "string"},
        {"name": "guardrails", "type": "string"},
        {"name": "tokenomics", "type": "string"},
        {"name": "iconName", "type": "string"},
        {"name": "colorClass", "type": "string"},
        {"name": "isActive", "type": "bool"},
        {"name": "totalRedeemed", "type": "uint256"},
        {"name": "maxRedemptions", "type": "uint256"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "canRedeemBenefit",
      "inputs": [
        {"name": "user", "type": "address"},
        {"name": "benefitId", "type": "bytes32"}
      ],
      "outputs": [{"name": "", "type": "bool"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getActiveBenefits",
      "inputs": [],
      "outputs": [{"name": "", "type": "bytes32[]"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getUserRedemptions",
      "inputs": [{"name": "user", "type": "address"}],
      "outputs": [{"name": "", "type": "string[]"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getRedemptionDetails",
      "inputs": [{"name": "orderId", "type": "string"}],
      "outputs": [
        {"name": "user", "type": "address"},
        {"name": "benefitId", "type": "bytes32"},
        {"name": "apxBurned", "type": "uint256"},
        {"name": "timestamp", "type": "uint256"},
        {"name": "isProcessed", "type": "bool"},
        {"name": "contactSubmitted", "type": "bool"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getGlobalStats",
      "inputs": [],
      "outputs": [
        {"name": "totalBurned", "type": "uint256"},
        {"name": "totalRedemptionsCount", "type": "uint256"},
        {"name": "activeBenefitsCount", "type": "uint256"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "benefits",
      "inputs": [{"name": "benefitId", "type": "bytes32"}],
      "outputs": [
        {"name": "priceAPX", "type": "uint256"},
        {"name": "title", "type": "string"},
        {"name": "description", "type": "string"},
        {"name": "mechanics", "type": "string"},
        {"name": "guardrails", "type": "string"},
        {"name": "tokenomics", "type": "string"},
        {"name": "iconName", "type": "string"},
        {"name": "colorClass", "type": "string"},
        {"name": "isActive", "type": "bool"},
        {"name": "totalRedeemed", "type": "uint256"},
        {"name": "maxRedemptions", "type": "uint256"},
        {"name": "createdAt", "type": "uint256"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "userRedeemed",
      "inputs": [
        {"name": "user", "type": "address"},
        {"name": "benefitId", "type": "bytes32"}
      ],
      "outputs": [{"name": "", "type": "bool"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "redemptions",
      "inputs": [{"name": "orderId", "type": "string"}],
      "outputs": [
        {"name": "user", "type": "address"},
        {"name": "benefitId", "type": "bytes32"},
        {"name": "apxBurned", "type": "uint256"},
        {"name": "timestamp", "type": "uint256"},
        {"name": "orderId", "type": "string"},
        {"name": "contactHash", "type": "bytes32"},
        {"name": "isProcessed", "type": "bool"},
        {"name": "contactSubmitted", "type": "bool"}
      ],
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
      "name": "BenefitCreated",
      "inputs": [
        {"name": "benefitId", "type": "bytes32", "indexed": true},
        {"name": "priceAPX", "type": "uint256", "indexed": false},
        {"name": "title", "type": "string", "indexed": false},
        {"name": "creator", "type": "address", "indexed": true}
      ]
    },
    {
      "type": "event",
      "name": "BenefitRedeemed",
      "inputs": [
        {"name": "user", "type": "address", "indexed": true},
        {"name": "benefitId", "type": "bytes32", "indexed": true},
        {"name": "apxBurned", "type": "uint256", "indexed": false},
        {"name": "orderId", "type": "string", "indexed": false},
        {"name": "timestamp", "type": "uint256", "indexed": false}
      ]
    },
    {
      "type": "event",
      "name": "ContactSubmitted",
      "inputs": [
        {"name": "orderId", "type": "string", "indexed": true},
        {"name": "contactHash", "type": "bytes32", "indexed": false},
        {"name": "user", "type": "address", "indexed": true}
      ]
    },
    {
      "type": "event",
      "name": "BenefitProcessed",
      "inputs": [
        {"name": "orderId", "type": "string", "indexed": true},
        {"name": "processor", "type": "address", "indexed": true},
        {"name": "timestamp", "type": "uint256", "indexed": false}
      ]
    },
    {
      "type": "event",
      "name": "APXBurned",
      "inputs": [
        {"name": "user", "type": "address", "indexed": true},
        {"name": "amount", "type": "uint256", "indexed": false},
        {"name": "reason", "type": "string", "indexed": false}
      ]
    }
  ] as const
} as const

// Configuration des bénéfices prédéfinis (triés par prix croissant)
export const PREDEFINED_BENEFITS = {
  BETA_ACCESS: {
    id: '0x6265746161636365737300000000000000000000000000000000000000000000',
    title: 'Early Access to the Beta',
    description: 'Priority access to the next product release.',
    mechanics: 'Redeem with APX → allowlist your wallet for Beta features.',
    guardrails: 'Limit: 1 per wallet, permanent access',
    tokenomics: '',
    priceAPX: '500',
    iconName: 'Zap',
    colorClass: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    maxRedemptions: 100,
    category: 'access' as const
  },
  
  USDC_VOUCHER: {
    id: '0x757364637663686572000000000000000000000000000000000000000000000',
    title: '10 USDC Voucher',
    description: 'A 10 USDC credit delivered to your wallet.',
    mechanics: 'Redeem with APX → on-chain event → USDC payout (server-fulfilled) within 24–48h.',
    guardrails: 'Limit: 1 per wallet, payout within 48h',
    tokenomics: '',
    priceAPX: '1000',
    iconName: 'DollarSign',
    colorClass: 'bg-gradient-to-r from-green-500 to-emerald-500',
    maxRedemptions: 10,
    category: 'reward' as const
  },
  
  CREATOR_1ON1: {
    id: '0x316f6e31000000000000000000000000000000000000000000000000000000',
    title: '1:1 with the Creator (Aiden P2P)',
    description: 'A 30–45 min private session to discuss product, token design, Base integration, or GTM.',
    mechanics: 'Redeem with APX → on-chain receipt → booking link sent.',
    guardrails: 'Limit: 1 per wallet, expires in 30 days',
    tokenomics: '',
    priceAPX: '1500',
    iconName: 'UserCheck',
    colorClass: 'bg-gradient-to-r from-purple-500 to-pink-500',
    maxRedemptions: 10,
    category: 'premium' as const
  },
  
  LUCKY_DRAW: {
    id: '0x6c75636b796472617700000000000000000000000000000000000000000000',
    title: 'Lucky Draw — Win 100 USDC',
    description: 'Entry into a raffle for 100 USDC.',
    mechanics: 'Redeem with APX → on-chain entry logged; transparent draw (tx hash / VRF if added).',
    guardrails: 'Limit: 1 per wallet, draw monthly',
    tokenomics: '',
    priceAPX: '2000',
    iconName: 'Gift',
    colorClass: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    maxRedemptions: 500,
    category: 'contest' as const
  }
} as const

// Utilitaires pour convertir les données du contract
export class BenefitsUtils {
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
   * Convertit les données brutes du contract en Benefit
   */
  static parseBenefitFromContract(
    benefitId: string, 
    rawData: any[]
  ): any {
    return {
      id: benefitId,
      priceAPX: this.formatTokenAmount(BigInt(rawData[0] || 0)),
      title: rawData[1] || '',
      description: rawData[2] || '',
      mechanics: rawData[3] || '',
      guardrails: rawData[4] || '',
      tokenomics: rawData[5] || '',
      iconName: rawData[6] || 'Gift',
      colorClass: rawData[7] || 'bg-gray-500',
      isActive: Boolean(rawData[8]),
      totalRedeemed: Number(rawData[9] || 0),
      maxRedemptions: Number(rawData[10] || 0),
      createdAt: new Date(Number(rawData[11] || 0) * 1000)
    }
  }

  /**
   * Convertit les données de rachat du contract
   */
  static parseRedemptionFromContract(
    orderId: string,
    rawData: any[]
  ): any {
    return {
      orderId,
      user: rawData[0],
      benefitId: rawData[1],
      apxBurned: this.formatTokenAmount(BigInt(rawData[2] || 0)),
      timestamp: new Date(Number(rawData[3] || 0) * 1000),
      isProcessed: Boolean(rawData[4]),
      contactSubmitted: Boolean(rawData[5])
    }
  }

  /**
   * Parse les statistiques du contract
   */
  static parseStatsFromContract(rawData: any[]): any {
    return {
      totalAPXBurned: this.formatTokenAmount(BigInt(rawData[0] || 0)),
      totalRedemptions: Number(rawData[1] || 0),
      activeBenefits: Number(rawData[2] || 0)
    }
  }

  /**
   * Génère un hash de contact simple
   */
  static generateContactHash(email: string, orderId: string): string {
    // Simple hash pour lier email et orderId
    const data = `${email}${orderId}BENEFIT_CONTACT`
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`
  }

  /**
   * Calcule le temps écoulé depuis une date
   */
  static getTimeAgo(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }
}

export type PredefinedBenefitKey = keyof typeof PREDEFINED_BENEFITS
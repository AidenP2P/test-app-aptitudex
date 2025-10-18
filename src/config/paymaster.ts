import { createPublicClient, http, type Address } from 'viem'
import { base } from 'viem/chains'

// Configuration du Paymaster Coinbase
export interface PaymasterConfig {
  rpcUrl: string
  policyId: string
  sponsorshipMode: 'FULL' | 'PARTIAL'
  maxGasLimit: bigint
  supportedMethods: string[]
  apiKey?: string
  projectId?: string
}

export const PAYMASTER_CONFIG: PaymasterConfig = {
  // URLs et identifiants Paymaster (à configurer avec les vraies valeurs)
  rpcUrl: import.meta.env.VITE_COINBASE_PAYMASTER_RPC || 'https://api.developer.coinbase.com/rpc/v1/base',
  policyId: import.meta.env.VITE_COINBASE_POLICY_ID || '',
  apiKey: import.meta.env.VITE_COINBASE_API_KEY || '',
  projectId: import.meta.env.VITE_COINBASE_PROJECT_ID || '',
  
  // Configuration de sponsoring
  sponsorshipMode: 'FULL',
  maxGasLimit: BigInt(500000), // 500k gas max
  
  // Méthodes supportées par le paymaster
  supportedMethods: [
    'claimDaily',
    'claimWeekly'
  ]
}

// Client public pour les interactions avec Base via Paymaster
export const paymasterClient = createPublicClient({
  chain: base,
  transport: http(PAYMASTER_CONFIG.rpcUrl)
})

// Types pour les requêtes Paymaster
export interface PaymasterSponsorRequest {
  to: Address
  data: `0x${string}`
  from: Address
  gasLimit: string
  policyId: string
  value?: string
}

export interface PaymasterSponsorResponse {
  success: boolean
  sponsorshipData?: {
    paymasterAddress: Address
    paymasterData: `0x${string}`
    preVerificationGas: string
    verificationGasLimit: string
    callGasLimit: string
  }
  error?: string
  errorCode?: string
}

export interface UserOperationRequest {
  sender: Address
  nonce: string
  initCode: `0x${string}`
  callData: `0x${string}`
  callGasLimit: string
  verificationGasLimit: string
  preVerificationGas: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  paymasterAndData: `0x${string}`
  signature: `0x${string}`
}

// Configuration des endpoints Coinbase Developer Platform
export const COINBASE_CDP_ENDPOINTS = {
  // Base Mainnet
  mainnet: {
    bundler: 'https://api.developer.coinbase.com/rpc/v1/base',
    paymaster: 'https://api.developer.coinbase.com/rpc/v1/base',
    webhook: 'https://api.developer.coinbase.com/webhook/v1'
  },
  
  // Base Sepolia (testnet)
  sepolia: {
    bundler: 'https://api.developer.coinbase.com/rpc/v1/base-sepolia',
    paymaster: 'https://api.developer.coinbase.com/rpc/v1/base-sepolia',
    webhook: 'https://api.developer.coinbase.com/webhook/v1'
  }
} as const

// Politiques de sponsoring Paymaster
export interface PaymasterPolicy {
  id: string
  name: string
  description: string
  sponsorshipType: 'FULL' | 'PARTIAL' | 'CONDITIONAL'
  conditions: {
    maxGasPerTransaction?: bigint
    maxTransactionsPerDay?: number
    maxTransactionsPerUser?: number
    allowedMethods?: string[]
    allowedContracts?: Address[]
    userWhitelist?: Address[]
  }
  active: boolean
}

// Politiques de base pour les claims APX
export const CLAIM_PAYMASTER_POLICIES: PaymasterPolicy[] = [
  {
    id: 'aptitudex-daily-claims',
    name: 'AptitudeX Daily Claims',
    description: 'Sponsoring des claims daily APX pour tous les utilisateurs',
    sponsorshipType: 'FULL',
    conditions: {
      maxGasPerTransaction: BigInt(300000),
      maxTransactionsPerDay: 1,
      allowedMethods: ['claimDaily'],
      allowedContracts: [] // À remplir avec l'adresse du ClaimDistributor
    },
    active: true
  },
  {
    id: 'aptitudex-weekly-claims',
    name: 'AptitudeX Weekly Claims',
    description: 'Sponsoring des claims weekly APX pour tous les utilisateurs',
    sponsorshipType: 'FULL',
    conditions: {
      maxGasPerTransaction: BigInt(350000),
      maxTransactionsPerDay: 1, // 1 par semaine en réalité
      allowedMethods: ['claimWeekly'],
      allowedContracts: [] // À remplir avec l'adresse du ClaimDistributor
    },
    active: true
  }
]

// Utilitaires Paymaster
export class PaymasterUtils {
  /**
   * Vérifie si une méthode est éligible au sponsoring
   */
  static isMethodSponsored(methodName: string): boolean {
    return PAYMASTER_CONFIG.supportedMethods.includes(methodName)
  }

  /**
   * Vérifie si le Paymaster est configuré
   */
  static isPaymasterConfigured(): boolean {
    return Boolean(
      PAYMASTER_CONFIG.rpcUrl &&
      PAYMASTER_CONFIG.policyId &&
      PAYMASTER_CONFIG.apiKey &&
      PAYMASTER_CONFIG.projectId
    )
  }

  /**
   * Construit les headers pour les requêtes API Coinbase
   */
  static getAPIHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (PAYMASTER_CONFIG.apiKey) {
      headers['Authorization'] = `Bearer ${PAYMASTER_CONFIG.apiKey}`
    }

    if (PAYMASTER_CONFIG.projectId) {
      headers['X-Project-ID'] = PAYMASTER_CONFIG.projectId
    }

    return headers
  }

  /**
   * Estime le gas pour une transaction
   */
  static estimateGasForMethod(methodName: string): bigint {
    const gasEstimates: Record<string, bigint> = {
      'claimDaily': BigInt(250000),
      'claimWeekly': BigInt(280000),
      'provision': BigInt(100000),
      'updateConfig': BigInt(80000)
    }

    return gasEstimates[methodName] || BigInt(200000)
  }

  /**
   * Valide si une transaction respecte les limites du Paymaster
   */
  static validateTransaction(
    methodName: string,
    gasEstimate: bigint,
    userAddress: Address
  ): { valid: boolean; reason?: string } {
    if (!this.isMethodSponsored(methodName)) {
      return { valid: false, reason: 'Method not sponsored' }
    }

    if (gasEstimate > PAYMASTER_CONFIG.maxGasLimit) {
      return { valid: false, reason: 'Gas limit exceeded' }
    }

    // Autres validations peuvent être ajoutées ici
    return { valid: true }
  }

  /**
   * Formate une requête de sponsoring pour l'API Coinbase
   */
  static formatSponsorRequest(
    contractAddress: Address,
    callData: `0x${string}`,
    from: Address,
    gasEstimate: bigint
  ): PaymasterSponsorRequest {
    return {
      to: contractAddress,
      data: callData,
      from,
      gasLimit: gasEstimate.toString(),
      policyId: PAYMASTER_CONFIG.policyId,
      value: '0'
    }
  }

  /**
   * Parse la réponse du Paymaster
   */
  static parseSponsorResponse(response: any): PaymasterSponsorResponse {
    if (response.error) {
      return {
        success: false,
        error: response.error.message || 'Unknown paymaster error',
        errorCode: response.error.code?.toString()
      }
    }

    if (response.result) {
      return {
        success: true,
        sponsorshipData: {
          paymasterAddress: response.result.paymasterAddress,
          paymasterData: response.result.paymasterData,
          preVerificationGas: response.result.preVerificationGas,
          verificationGasLimit: response.result.verificationGasLimit,
          callGasLimit: response.result.callGasLimit
        }
      }
    }

    return {
      success: false,
      error: 'Invalid paymaster response format'
    }
  }
}

// Messages d'erreur Paymaster
export const PAYMASTER_ERRORS = {
  NOT_CONFIGURED: 'Paymaster not configured',
  METHOD_NOT_SUPPORTED: 'Method not supported by paymaster',
  GAS_LIMIT_EXCEEDED: 'Transaction exceeds gas limit',
  SPONSORSHIP_FAILED: 'Failed to get transaction sponsorship',
  INVALID_RESPONSE: 'Invalid paymaster response',
  NETWORK_ERROR: 'Network error while contacting paymaster',
  QUOTA_EXCEEDED: 'Paymaster quota exceeded',
  POLICY_VIOLATION: 'Transaction violates paymaster policy'
} as const

// Messages de succès
export const PAYMASTER_MESSAGES = {
  SPONSORED: 'Transaction sponsored successfully',
  GASLESS_CLAIM: 'Claim completed gas-free!',
  SPONSORSHIP_ACTIVE: 'Gas sponsorship is active'
} as const

// Configuration pour les variables d'environnement
export const PAYMASTER_ENV_VARS = {
  VITE_COINBASE_PAYMASTER_RPC: 'URL RPC du Paymaster Coinbase',
  VITE_COINBASE_POLICY_ID: 'ID de la politique de sponsoring',
  VITE_COINBASE_API_KEY: 'Clé API Coinbase Developer Platform',
  VITE_COINBASE_PROJECT_ID: 'ID du projet Coinbase CDP'
} as const
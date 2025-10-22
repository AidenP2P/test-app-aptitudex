# ⛽ Paymaster Integration Specification - Benefits System

## Overview

Cette spécification définit l'intégration du système Benefits avec le Paymaster Coinbase pour permettre des transactions gasless. L'objectif est d'offrir une expérience utilisateur fluide où les utilisateurs n'ont pas besoin de payer de gas pour racheter leurs bénéfices.

## 🏗️ Architecture Paymaster

### Configuration Coinbase Smart Wallet

Le projet utilise déjà OnchainKit et Coinbase Smart Wallet. Nous devons étendre cette intégration pour supporter les transactions gasless pour les Benefits.

```typescript
// src/config/paymaster.ts - Extension de la configuration existante
import { type Address } from 'viem'
import { base } from 'viem/chains'

export const PAYMASTER_CONFIG = {
  // Coinbase Paymaster pour Base
  paymasterUrl: 'https://paymaster.base.org/v1',
  
  // Politique de sponsoring pour Benefits
  sponsoringPolicy: {
    // Transactions éligibles pour sponsoring
    eligibleContracts: [
      '0x...', // BenefitsManagement contract address
    ],
    
    // Fonctions éligibles pour sponsoring
    eligibleFunctions: [
      'redeemBenefit',
      'submitContactHash'
    ],
    
    // Limites de sponsoring
    maxGasLimit: 500000, // 500k gas max par transaction
    dailyLimitPerUser: 3, // 3 transactions sponsorisées par jour par utilisateur
    
    // Conditions d'éligibilité
    minimumAPXBalance: '100', // Utilisateur doit avoir au moins 100 APX
    whitelistedBenefits: [], // Liste des bénéfices éligibles (vide = tous)
  },
  
  // Configuration de fallback
  fallbackToUserPaysGas: true, // Si le sponsoring échoue, l'utilisateur paie
  
  // Monitoring et analytics
  enableAnalytics: true,
  analyticsEndpoint: '/api/paymaster/analytics'
} as const

// Types pour la configuration Paymaster
export interface PaymasterSponsoringRequest {
  to: Address
  data: `0x${string}`
  value?: bigint
  gasLimit?: bigint
  userAddress: Address
  contractFunction: string
}

export interface PaymasterSponsoringResponse {
  sponsored: boolean
  paymasterAndData?: `0x${string}`
  preVerificationGas?: bigint
  verificationGasLimit?: bigint
  callGasLimit?: bigint
  reason?: string
}

// Utilitaires pour vérifier l'éligibilité
export class PaymasterUtils {
  /**
   * Vérifier si une transaction est éligible pour le sponsoring
   */
  static isEligibleForSponsoring(
    contractAddress: Address,
    functionName: string,
    userAddress: Address,
    userAPXBalance: string
  ): boolean {
    // Vérifier le contrat
    if (!PAYMASTER_CONFIG.sponsoringPolicy.eligibleContracts.includes(contractAddress)) {
      return false
    }
    
    // Vérifier la fonction
    if (!PAYMASTER_CONFIG.sponsoringPolicy.eligibleFunctions.includes(functionName)) {
      return false
    }
    
    // Vérifier le balance minimum
    const balanceNum = parseFloat(userAPXBalance)
    const minBalance = parseFloat(PAYMASTER_CONFIG.sponsoringPolicy.minimumAPXBalance)
    if (balanceNum < minBalance) {
      return false
    }
    
    return true
  }
  
  /**
   * Construire la requête de sponsoring
   */
  static buildSponsoringRequest(
    to: Address,
    data: `0x${string}`,
    userAddress: Address,
    functionName: string,
    gasLimit?: bigint
  ): PaymasterSponsoringRequest {
    return {
      to,
      data,
      value: 0n,
      gasLimit: gasLimit || BigInt(PAYMASTER_CONFIG.sponsoringPolicy.maxGasLimit),
      userAddress,
      contractFunction: functionName
    }
  }
}
```

### Service Paymaster

```typescript
// src/services/paymasterService.ts
import { type PublicClient, type WalletClient, type Address } from 'viem'
import { base } from 'viem/chains'
import { 
  PAYMASTER_CONFIG, 
  PaymasterUtils,
  type PaymasterSponsoringRequest,
  type PaymasterSponsoringResponse 
} from '@/config/paymaster'

/**
 * Service pour gérer les interactions avec le Paymaster Coinbase
 */
export class PaymasterService {
  private static instance: PaymasterService
  private publicClient: PublicClient
  private analyticsData: Map<string, any> = new Map()

  constructor(publicClient: PublicClient) {
    this.publicClient = publicClient
  }

  static getInstance(publicClient: PublicClient): PaymasterService {
    if (!PaymasterService.instance) {
      PaymasterService.instance = new PaymasterService(publicClient)
    }
    return PaymasterService.instance
  }

  /**
   * Demander le sponsoring d'une transaction
   */
  async requestSponsoring(request: PaymasterSponsoringRequest): Promise<PaymasterSponsoringResponse> {
    try {
      console.log('🎫 Requesting transaction sponsoring:', request)
      
      // Vérifier l'éligibilité
      const isEligible = PaymasterUtils.isEligibleForSponsoring(
        request.to,
        request.contractFunction,
        request.userAddress,
        '0' // TODO: Récupérer le vrai balance
      )
      
      if (!isEligible) {
        return {
          sponsored: false,
          reason: 'Transaction not eligible for sponsoring'
        }
      }
      
      // Vérifier les limites quotidiennes
      const dailyCount = await this.getDailyTransactionCount(request.userAddress)
      if (dailyCount >= PAYMASTER_CONFIG.sponsoringPolicy.dailyLimitPerUser) {
        return {
          sponsored: false,
          reason: 'Daily sponsoring limit reached'
        }
      }
      
      // Appel à l'API Coinbase Paymaster
      const response = await this.callCoinbasePaymaster(request)
      
      // Enregistrer l'analytics
      if (PAYMASTER_CONFIG.enableAnalytics) {
        await this.recordAnalytics(request, response)
      }
      
      return response
      
    } catch (error) {
      console.error('❌ Paymaster sponsoring failed:', error)
      
      if (PAYMASTER_CONFIG.fallbackToUserPaysGas) {
        return {
          sponsored: false,
          reason: 'Paymaster error, fallback to user gas payment'
        }
      }
      
      throw error
    }
  }

  /**
   * Appel à l'API Coinbase Paymaster
   */
  private async callCoinbasePaymaster(request: PaymasterSponsoringRequest): Promise<PaymasterSponsoringResponse> {
    const response = await fetch(PAYMASTER_CONFIG.paymasterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        method: 'pm_sponsorUserOperation',
        params: [{
          sender: request.userAddress,
          nonce: '0x0', // Sera calculé dynamiquement
          initCode: '0x',
          callData: request.data,
          callGasLimit: `0x${request.gasLimit?.toString(16)}`,
          verificationGasLimit: '0x186a0', // 100k
          preVerificationGas: '0xb71b', // ~47k
          maxFeePerGas: '0x59682f00', // 1.5 gwei
          maxPriorityFeePerGas: '0x59682f00', // 1.5 gwei
          paymasterAndData: '0x',
          signature: '0x'
        }],
        id: 1,
        jsonrpc: '2.0'
      })
    })

    if (!response.ok) {
      throw new Error(`Paymaster API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Paymaster error: ${data.error.message}`)
    }

    return {
      sponsored: true,
      paymasterAndData: data.result?.paymasterAndData,
      preVerificationGas: data.result?.preVerificationGas ? BigInt(data.result.preVerificationGas) : undefined,
      verificationGasLimit: data.result?.verificationGasLimit ? BigInt(data.result.verificationGasLimit) : undefined,
      callGasLimit: data.result?.callGasLimit ? BigInt(data.result.callGasLimit) : undefined
    }
  }

  /**
   * Récupérer le nombre de transactions sponsorisées aujourd'hui pour un utilisateur
   */
  private async getDailyTransactionCount(userAddress: Address): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    const key = `${userAddress}_${today}`
    return this.analyticsData.get(key) || 0
  }

  /**
   * Enregistrer les analytics de sponsoring
   */
  private async recordAnalytics(
    request: PaymasterSponsoringRequest, 
    response: PaymasterSponsoringResponse
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    const key = `${request.userAddress}_${today}`
    
    // Incrémenter le compteur quotidien
    const currentCount = this.analyticsData.get(key) || 0
    this.analyticsData.set(key, currentCount + 1)
    
    // Envoyer à l'endpoint analytics si configuré
    if (PAYMASTER_CONFIG.analyticsEndpoint) {
      try {
        await fetch(PAYMASTER_CONFIG.analyticsEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: request.userAddress,
            contractFunction: request.contractFunction,
            sponsored: response.sponsored,
            reason: response.reason,
            timestamp: new Date().toISOString(),
            gasLimit: request.gasLimit?.toString(),
            date: today
          })
        })
      } catch (error) {
        console.warn('Analytics recording failed:', error)
      }
    }
  }

  /**
   * Estimer le gas pour une transaction Benefits
   */
  async estimateGasForBenefit(
    contractAddress: Address,
    functionName: string,
    args: readonly unknown[],
    userAddress: Address
  ): Promise<bigint> {
    try {
      const gasEstimate = await this.publicClient.estimateContractGas({
        address: contractAddress,
        abi: [], // TODO: Ajouter l'ABI appropriée
        functionName,
        args,
        account: userAddress
      })
      
      // Ajouter 20% de marge de sécurité
      return gasEstimate + (gasEstimate * 20n / 100n)
      
    } catch (error) {
      console.error('Gas estimation failed:', error)
      // Fallback vers une estimation conservatrice
      return BigInt(PAYMASTER_CONFIG.sponsoringPolicy.maxGasLimit)
    }
  }
}
```

### Hook usePaymaster

```typescript
// src/hooks/usePaymaster.ts
import { useState, useCallback } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { toast } from 'sonner'
import { type Address } from 'viem'
import { base } from 'viem/chains'
import { PaymasterService, PAYMASTER_CONFIG, PaymasterUtils } from '@/services/paymasterService'
import { useAPXToken } from './useAPXToken'

/**
 * Hook pour gérer les transactions gasless avec Paymaster
 */
export function usePaymaster() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { formattedBalance } = useAPXToken()
  
  const [isSponsoring, setIsSponsoring] = useState(false)
  const [sponsoringError, setSponsoringError] = useState<string | null>(null)

  const paymasterService = publicClient ? PaymasterService.getInstance(publicClient) : null

  /**
   * Vérifier si une transaction peut être sponsorisée
   */
  const canSponsorTransaction = useCallback((
    contractAddress: Address,
    functionName: string
  ): boolean => {
    if (!address || !isConnected) return false
    
    return PaymasterUtils.isEligibleForSponsoring(
      contractAddress,
      functionName,
      address,
      formattedBalance
    )
  }, [address, isConnected, formattedBalance])

  /**
   * Exécuter une transaction avec sponsoring Paymaster
   */
  const executeWithSponsoring = useCallback(async (
    contractAddress: Address,
    functionName: string,
    args: readonly unknown[],
    abi: readonly unknown[]
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!address || !walletClient || !paymasterService) {
      return { success: false, error: 'Wallet not connected or service unavailable' }
    }

    setIsSponsoring(true)
    setSponsoringError(null)

    try {
      // Vérifier l'éligibilité
      const canSponsor = canSponsorTransaction(contractAddress, functionName)
      
      if (!canSponsor) {
        toast.info('Transaction will use your wallet gas', {
          description: 'This transaction is not eligible for gasless execution'
        })
        
        // Fallback vers transaction normale
        return await executeRegularTransaction(contractAddress, functionName, args, abi)
      }

      // Estimer le gas
      const gasEstimate = await paymasterService.estimateGasForBenefit(
        contractAddress,
        functionName,
        args,
        address
      )

      // Encoder les données de transaction
      const data = encodeFunctionData({
        abi,
        functionName,
        args
      })

      // Demander le sponsoring
      const sponsoringRequest = PaymasterUtils.buildSponsoringRequest(
        contractAddress,
        data,
        address,
        functionName,
        gasEstimate
      )

      const sponsoringResponse = await paymasterService.requestSponsoring(sponsoringRequest)

      if (!sponsoringResponse.sponsored) {
        console.log('Sponsoring denied:', sponsoringResponse.reason)
        
        if (PAYMASTER_CONFIG.fallbackToUserPaysGas) {
          toast.info('Gasless transaction unavailable', {
            description: 'Falling back to regular transaction'
          })
          return await executeRegularTransaction(contractAddress, functionName, args, abi)
        } else {
          throw new Error(sponsoringResponse.reason || 'Sponsoring denied')
        }
      }

      // Exécuter la transaction sponsorisée
      toast.success('Transaction sponsored!', {
        description: 'This transaction is gasless for you'
      })

      const txHash = await executeUserOperation({
        sender: address,
        callData: data,
        callGasLimit: sponsoringResponse.callGasLimit,
        verificationGasLimit: sponsoringResponse.verificationGasLimit,
        preVerificationGas: sponsoringResponse.preVerificationGas,
        paymasterAndData: sponsoringResponse.paymasterAndData,
        maxFeePerGas: parseEther('0.000000001'), // 1 gwei
        maxPriorityFeePerGas: parseEther('0.000000001')
      })

      return { success: true, txHash }

    } catch (error) {
      console.error('Sponsored transaction failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setSponsoringError(errorMessage)
      
      if (PAYMASTER_CONFIG.fallbackToUserPaysGas) {
        toast.warning('Gasless transaction failed', {
          description: 'Falling back to regular transaction'
        })
        return await executeRegularTransaction(contractAddress, functionName, args, abi)
      }
      
      return { success: false, error: errorMessage }
    } finally {
      setIsSponsoring(false)
    }
  }, [address, walletClient, paymasterService, canSponsorTransaction])

  /**
   * Exécuter une transaction normale (avec gas payé par l'utilisateur)
   */
  const executeRegularTransaction = useCallback(async (
    contractAddress: Address,
    functionName: string,
    args: readonly unknown[],
    abi: readonly unknown[]
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!walletClient) {
      return { success: false, error: 'Wallet not connected' }
    }

    try {
      const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi,
        functionName,
        args,
        chain: base,
        account: address
      })

      return { success: true, txHash }
    } catch (error) {
      console.error('Regular transaction failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Transaction failed' 
      }
    }
  }, [walletClient, address])

  /**
   * Exécuter une User Operation (ERC-4337)
   */
  const executeUserOperation = useCallback(async (userOp: any): Promise<string> => {
    // Cette fonction dépend de l'implémentation ERC-4337 de Coinbase
    // Pour l'instant, on utilise un placeholder
    
    // TODO: Implémenter avec la SDK Coinbase Smart Wallet
    throw new Error('User Operation execution not yet implemented')
  }, [])

  /**
   * Obtenir les statistiques de sponsoring pour l'utilisateur
   */
  const getSponsoringStats = useCallback(async () => {
    if (!address) return null

    try {
      // TODO: Récupérer depuis l'API analytics
      return {
        dailyTransactions: 0,
        dailyLimit: PAYMASTER_CONFIG.sponsoringPolicy.dailyLimitPerUser,
        totalSponsored: 0,
        totalSaved: '0 ETH'
      }
    } catch (error) {
      console.error('Error fetching sponsoring stats:', error)
      return null
    }
  }, [address])

  return {
    // ===== ÉTATS =====
    isSponsoring,
    sponsoringError,
    isConnected,
    
    // ===== FONCTIONS =====
    canSponsorTransaction,
    executeWithSponsoring,
    executeRegularTransaction,
    getSponsoringStats,
    
    // ===== CONFIGURATION =====
    sponsoringPolicy: PAYMASTER_CONFIG.sponsoringPolicy,
    fallbackEnabled: PAYMASTER_CONFIG.fallbackToUserPaysGas,
    
    // ===== UTILITAIRES =====
    clearError: () => setSponsoringError(null)
  }
}
```

### Intégration avec les Benefits

```typescript
// src/hooks/useBenefitsWithPaymaster.ts
import { useCallback } from 'react'
import { toast } from 'sonner'
import { BENEFITS_MANAGEMENT_CONFIG } from '@/config/benefitsManagement'
import { useBenefitsManagement } from './useBenefitsManagement'
import { usePaymaster } from './usePaymaster'

/**
 * Hook combiné Benefits + Paymaster pour transactions gasless
 */
export function useBenefitsWithPaymaster() {
  const {
    getAvailableBenefits,
    getUserRedemptions,
    submitContactInfo,
    // ... autres fonctions du hook Benefits
  } = useBenefitsManagement()
  
  const {
    executeWithSponsoring,
    canSponsorTransaction,
    isSponsoring
  } = usePaymaster()

  /**
   * Racheter un bénéfice avec tentative de sponsoring gasless
   */
  const redeemBenefitGasless = useCallback(async (benefitId: string) => {
    try {
      // Vérifier si le sponsoring est possible
      const canSponsor = canSponsorTransaction(
        BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        'redeemBenefit'
      )

      if (canSponsor) {
        toast.info('Preparing gasless transaction...', {
          description: 'This redemption will be sponsored for you!'
        })
      }

      // Exécuter avec sponsoring
      const result = await executeWithSponsoring(
        BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        'redeemBenefit',
        [benefitId as `0x${string}`],
        BENEFITS_MANAGEMENT_CONFIG.abi
      )

      if (result.success) {
        toast.success('Benefit redeemed successfully!', {
          description: canSponsor ? 'Transaction was gasless!' : 'Transaction confirmed'
        })
        return { success: true, txHash: result.txHash, orderId: 'TBD' } // orderId sera extrait des events
      } else {
        throw new Error(result.error || 'Redemption failed')
      }

    } catch (error) {
      console.error('Gasless redemption failed:', error)
      toast.error('Failed to redeem benefit')
      throw error
    }
  }, [executeWithSponsoring, canSponsorTransaction])

  /**
   * Soumettre contact avec sponsoring gasless
   */
  const submitContactGasless = useCallback(async (orderId: string, email: string) => {
    try {
      // Générer le hash de contact
      const contactHash = generateContactHash(email, orderId)

      // Tenter le sponsoring
      const result = await executeWithSponsoring(
        BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        'submitContactHash',
        [orderId, contactHash],
        BENEFITS_MANAGEMENT_CONFIG.abi
      )

      if (result.success) {
        // Stocker aussi localement
        await submitContactInfo(orderId, email)
        
        toast.success('Contact submitted successfully!')
        return { success: true }
      } else {
        throw new Error(result.error || 'Contact submission failed')
      }

    } catch (error) {
      console.error('Gasless contact submission failed:', error)
      
      // Fallback vers stockage local uniquement
      try {
        await submitContactInfo(orderId, email)
        toast.success('Contact saved locally', {
          description: 'On-chain submission failed but contact was saved'
        })
        return { success: true }
      } catch (localError) {
        toast.error('Failed to submit contact')
        throw error
      }
    }
  }, [executeWithSponsoring, submitContactInfo])

  return {
    // ===== FONCTIONS BENEFITS AVEC PAYMASTER =====
    redeemBenefitGasless,
    submitContactGasless,
    
    // ===== FONCTIONS BENEFITS ORIGINALES =====
    getAvailableBenefits,
    getUserRedemptions,
    
    // ===== ÉTATS PAYMASTER =====
    isSponsoring,
    canSponsorTransaction,
    
    // ===== UTILITAIRES =====
    isGaslessAvailable: (functionName: string) => 
      canSponsorTransaction(BENEFITS_MANAGEMENT_CONFIG.contractAddress, functionName)
  }
}
```

## 🔧 Configuration Frontend

### Variables d'environnement

```env
# Paymaster Configuration
VITE_PAYMASTER_URL=https://paymaster.base.org/v1
VITE_PAYMASTER_ANALYTICS_ENDPOINT=/api/paymaster/analytics
VITE_PAYMASTER_FALLBACK_ENABLED=true

# Sponsoring Policy
VITE_PAYMASTER_MAX_GAS_LIMIT=500000
VITE_PAYMASTER_DAILY_LIMIT=3
VITE_PAYMASTER_MIN_APX_BALANCE=100

# Debug
VITE_PAYMASTER_DEBUG=true
```

### Intégration OnchainKit

```typescript
// src/providers/Web3Provider.tsx - Extension
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PAYMASTER_CONFIG } from '@/config/paymaster'

// Configuration étendue pour supporter Paymaster
const onchainKitConfig = {
  apiKey: process.env.VITE_ONCHAINKIT_API_KEY,
  chain: base,
  
  // Configuration Paymaster
  paymaster: {
    url: PAYMASTER_CONFIG.paymasterUrl,
    sponsoringEnabled: true,
    policies: PAYMASTER_CONFIG.sponsoringPolicy
  }
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider 
          apiKey={onchainKitConfig.apiKey}
          chain={onchainKitConfig.chain}
          config={onchainKitConfig}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

## 📊 Monitoring et Analytics

### Dashboard Paymaster

```typescript
// src/components/PaymasterStats.tsx
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, TrendingUp, Users, DollarSign } from 'lucide-react'
import { usePaymaster } from '@/hooks/usePaymaster'

export function PaymasterStats() {
  const { getSponsoringStats } = usePaymaster()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getSponsoringStats().then(setStats)
  }, [getSponsoringStats])

  if (!stats) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Gasless</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.dailyTransactions}</div>
          <p className="text-xs text-muted-foreground">
            of {stats.dailyLimit} limit
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sponsored</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSponsored}</div>
          <p className="text-xs text-muted-foreground">
            transactions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gas Saved</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSaved}</div>
          <p className="text-xs text-muted-foreground">
            in transaction fees
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge variant="default" className="bg-green-500">
            <Zap className="w-3 h-3 mr-1" />
            Active
          </Badge>
          <p className="text-xs text-muted-foreground mt-1">
            Gasless enabled
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

## 🚀 Implementation Strategy

### Phase 1: Configuration de base
1. Configurer le Paymaster Coinbase
2. Implémenter le service de base
3. Tester avec des transactions simples

### Phase 2: Intégration Benefits
1. Modifier les hooks Benefits pour supporter Paymaster
2. Implémenter les fallbacks
3. Tester le flow complet de redemption

### Phase 3: Optimisation
1. Implémenter les analytics
2. Optimiser les conditions d'éligibilité
3. Monitoring et alertes

### Phase 4: Production
1. Configuration production
2. Monitoring avancé
3. Documentation utilisateur

Cette architecture permet une intégration progressive du Paymaster tout en maintenant la compatibilité avec les transactions normales, offrant une expérience utilisateur optimale pour le système de Benefits.

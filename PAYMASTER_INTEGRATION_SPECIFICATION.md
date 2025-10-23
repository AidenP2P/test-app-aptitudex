# ⛽ Paymaster Integration Specification - Benefits System

## Overview

This specification defines the integration of the Benefits system with the Coinbase Paymaster to enable gasless transactions. The goal is to provide a seamless user experience where users do not need to pay gas to redeem their benefits.

## 🏗️ Paymaster Architecture

### Coinbase Smart Wallet Configuration

The project already uses OnchainKit and Coinbase Smart Wallet. We need to extend this integration to support gasless transactions for Benefits.

```typescript
// src/config/paymaster.ts - Extension of existing configuration
import { type Address } from 'viem'
import { base } from 'viem/chains'

export const PAYMASTER_CONFIG = {
  // Coinbase Paymaster for Base
  paymasterUrl: 'https://paymaster.base.org/v1',
  
  // Sponsoring policy for Benefits
  sponsoringPolicy: {
    // Transactions eligible for sponsoring
    eligibleContracts: [
      '0x...', // BenefitsManagement contract address
    ],
    
    // Functions eligible for sponsoring
    eligibleFunctions: [
      'redeemBenefit',
      'submitContactHash'
    ],
    
    // Sponsoring limits
    maxGasLimit: 500000, // 500k gas max per transaction
    dailyLimitPerUser: 3, // 3 sponsored transactions per user per day
    
    // Eligibility conditions
    minimumAPXBalance: '100', // User must have at least 100 APX
    whitelistedBenefits: [], // List of eligible benefits (empty = all)
  },
  
  // Fallback configuration
  fallbackToUserPaysGas: true, // If sponsoring fails, the user pays gas
  
  // Monitoring and analytics
  enableAnalytics: true,
  analyticsEndpoint: '/api/paymaster/analytics'
} as const

// Types for Paymaster configuration
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

// Utilities for checking eligibility
export class PaymasterUtils {
  /**
   * Check if a transaction is eligible for sponsoring
   */
  static isEligibleForSponsoring(
    contractAddress: Address,
    functionName: string,
    userAddress: Address,
    userAPXBalance: string
  ): boolean {
    // Check contract
    if (!PAYMASTER_CONFIG.sponsoringPolicy.eligibleContracts.includes(contractAddress)) {
      return false
    }
    
    // Check function
    if (!PAYMASTER_CONFIG.sponsoringPolicy.eligibleFunctions.includes(functionName)) {
      return false
    }
    
    // Check minimum balance
    const balanceNum = parseFloat(userAPXBalance)
    const minBalance = parseFloat(PAYMASTER_CONFIG.sponsoringPolicy.minimumAPXBalance)
    if (balanceNum < minBalance) {
      return false
    }
    
    return true
  }
  
  /**
   * Build the sponsoring request
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

### Paymaster Service

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
 * Service to manage interactions with the Coinbase Paymaster
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
   * Request sponsoring for a transaction
   */
  async requestSponsoring(request: PaymasterSponsoringRequest): Promise<PaymasterSponsoringResponse> {
    try {
      console.log('🎫 Requesting transaction sponsoring:', request)
      
      // Check eligibility
      const isEligible = PaymasterUtils.isEligibleForSponsoring(
        request.to,
        request.contractFunction,
        request.userAddress,
        '0' // TODO: Fetch real balance
      )
      
      if (!isEligible) {
        return {
          sponsored: false,
          reason: 'Transaction not eligible for sponsoring'
        }
      }
      
      // Check daily limits
      const dailyCount = await this.getDailyTransactionCount(request.userAddress)
      if (dailyCount >= PAYMASTER_CONFIG.sponsoringPolicy.dailyLimitPerUser) {
        return {
          sponsored: false,
          reason: 'Daily sponsoring limit reached'
        }
      }
      
      // Call Coinbase Paymaster API
      const response = await this.callCoinbasePaymaster(request)
      
      // Record analytics
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
   * Call the Coinbase Paymaster API
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
          nonce: '0x0', // Will be calculated dynamically
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
   * Get the number of sponsored transactions today for a user
   */
  private async getDailyTransactionCount(userAddress: Address): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    const key = `${userAddress}_${today}`
    return this.analyticsData.get(key) || 0
  }

  /**
   * Record sponsoring analytics
   */
  private async recordAnalytics(
    request: PaymasterSponsoringRequest, 
    response: PaymasterSponsoringResponse
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    const key = `${request.userAddress}_${today}`
    
    // Increment daily counter
    const currentCount = this.analyticsData.get(key) || 0
    this.analyticsData.set(key, currentCount + 1)
    
    // Send to analytics endpoint if configured
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
   * Estimate gas for a Benefits transaction
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
        abi: [], // TODO: Add appropriate ABI
        functionName,
        args,
        account: userAddress
      })
      
      // Add 20% safety margin
      return gasEstimate + (gasEstimate * 20n / 100n)
      
    } catch (error) {
      console.error('Gas estimation failed:', error)
      // Fallback to a conservative estimate
      return BigInt(PAYMASTER_CONFIG.sponsoringPolicy.maxGasLimit)
    }
  }
}
```

### usePaymaster Hook

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
 * Hook to manage gasless transactions with Paymaster
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
   * Check if a transaction can be sponsored
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
   * Execute a transaction with Paymaster sponsoring
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
      // Check eligibility
      const canSponsor = canSponsorTransaction(contractAddress, functionName)
      
      if (!canSponsor) {
        toast.info('Transaction will use your wallet gas', {
          description: 'This transaction is not eligible for gasless execution'
        })
        
        // Fallback to regular transaction
        return await executeRegularTransaction(contractAddress, functionName, args, abi)
      }

      // Estimate gas
      const gasEstimate = await paymasterService.estimateGasForBenefit(
        contractAddress,
        functionName,
        args,
        address
      )

      // Encode transaction data
      const data = encodeFunctionData({
        abi,
        functionName,
        args
      })

      // Request sponsoring
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

      // Execute sponsored transaction
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
   * Execute a regular transaction (gas paid by user)
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
   * Execute a User Operation (ERC-4337)
   */
  const executeUserOperation = useCallback(async (userOp: any): Promise<string> => {
    // This function depends on the Coinbase Smart Wallet ERC-4337 implementation
    // For now, using a placeholder
    
    // TODO: Implement with Coinbase Smart Wallet SDK
    throw new Error('User Operation execution not yet implemented')
  }, [])

  /**
   * Get sponsoring stats for the user
   */
  const getSponsoringStats = useCallback(async () => {
    if (!address) return null

    try {
      // TODO: Fetch from analytics API
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
    // ===== STATES =====
    isSponsoring,
    sponsoringError,
    isConnected,
    
    // ===== FUNCTIONS =====
    canSponsorTransaction,
    executeWithSponsoring,
    executeRegularTransaction,
    getSponsoringStats,
    
    // ===== CONFIGURATION =====
    sponsoringPolicy: PAYMASTER_CONFIG.sponsoringPolicy,
    fallbackEnabled: PAYMASTER_CONFIG.fallbackToUserPaysGas,
    
    // ===== UTILITIES =====
    clearError: () => setSponsoringError(null)
  }
}
```

### Integration with Benefits

```typescript
// src/hooks/useBenefitsWithPaymaster.ts
import { useCallback } from 'react'
import { toast } from 'sonner'
import { BENEFITS_MANAGEMENT_CONFIG } from '@/config/benefitsManagement'
import { useBenefitsManagement } from './useBenefitsManagement'
import { usePaymaster } from './usePaymaster'

/**
 * Combined Benefits + Paymaster hook for gasless transactions
 */
export function useBenefitsWithPaymaster() {
  const {
    getAvailableBenefits,
    getUserRedemptions,
    submitContactInfo,
    // ... other functions from useBenefitsManagement
  } = useBenefitsManagement()
  
  const {
    executeWithSponsoring,
    canSponsorTransaction,
    isSponsoring
  } = usePaymaster()

  /**
   * Redeem a benefit with attempted gasless sponsoring
   */
  const redeemBenefitGasless = useCallback(async (benefitId: string) => {
    try {
      // Check if sponsoring is possible
      const canSponsor = canSponsorTransaction(
        BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        'redeemBenefit'
      )

      if (canSponsor) {
        toast.info('Preparing gasless transaction...', {
          description: 'This redemption will be sponsored for you!'
        })
      }

      // Execute with sponsoring
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
        return { success: true, txHash: result.txHash, orderId: 'TBD' } // orderId will be extracted from events
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
   * Submit contact with gasless sponsoring
   */
  const submitContactGasless = useCallback(async (orderId: string, email: string) => {
    try {
      // Generate contact hash
      const contactHash = generateContactHash(email, orderId)

      // Attempt sponsoring
      const result = await executeWithSponsoring(
        BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        'submitContactHash',
        [orderId, contactHash],
        BENEFITS_MANAGEMENT_CONFIG.abi
      )

      if (result.success) {
        // Also store locally
        await submitContactInfo(orderId, email)
        
        toast.success('Contact submitted successfully!')
        return { success: true }
      } else {
        throw new Error(result.error || 'Contact submission failed')
      }

    } catch (error) {
      console.error('Gasless contact submission failed:', error)
      
      // Fallback to local storage only
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
    // ===== BENEFITS FUNCTIONS WITH PAYMASTER =====
    redeemBenefitGasless,
    submitContactGasless,
    
    // ===== ORIGINAL BENEFITS FUNCTIONS =====
    getAvailableBenefits,
    getUserRedemptions,
    
    // ===== PAYMASTER STATES =====
    isSponsoring,
    canSponsorTransaction,
    
    // ===== UTILITIES =====
    isGaslessAvailable: (functionName: string) => 
      canSponsorTransaction(BENEFITS_MANAGEMENT_CONFIG.contractAddress, functionName)
  }
}
```

## 🔧 Frontend Configuration

### Environment Variables

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

### OnchainKit Integration

```typescript
// src/providers/Web3Provider.tsx - Extension
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PAYMASTER_CONFIG } from '@/config/paymaster'

// Extended configuration to support Paymaster
const onchainKitConfig = {
  apiKey: process.env.VITE_ONCHAINKIT_API_KEY,
  chain: base,
  
  // Paymaster Configuration
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

## 📊 Monitoring and Analytics

### Paymaster Dashboard

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

### Phase 1: Basic Configuration
1. Configure Coinbase Paymaster
2. Implement base service
3. Test with simple transactions

### Phase 2: Benefits Integration
1. Modify Benefits hooks to support Paymaster
2. Implement fallbacks
3. Test complete redemption flow

### Phase 3: Optimization
1. Implement analytics
2. Optimize eligibility conditions
3. Monitoring and alerts

### Phase 4: Production
1. Production configuration
2. Advanced monitoring
3. User documentation

This architecture allows for progressive integration of the Paymaster while maintaining compatibility with regular transactions, offering an optimal user experience for the Benefits system.

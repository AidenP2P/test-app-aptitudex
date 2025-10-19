import { useState, useCallback } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { encodeFunctionData, type Address } from 'viem'
import { toast } from 'sonner'
import { 
  PAYMASTER_CONFIG, 
  PaymasterUtils,
  PAYMASTER_ERRORS,
  PAYMASTER_MESSAGES,
  type PaymasterSponsorRequest,
  type PaymasterSponsorResponse 
} from '@/config/paymaster'
import { CLAIM_DISTRIBUTOR_CONFIG } from '@/config/claimDistributor'

/**
 * Hook pour gérer les transactions gasless via le Paymaster Coinbase
 */
export function usePaymaster() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  
  // États locaux
  const [isSponsoring, setIsSponsoring] = useState(false)
  const [lastSponsorshipData, setLastSponsorshipData] = useState<any>(null)

  /**
   * Demande de sponsoring pour une transaction
   */
  const sponsorTransaction = useCallback(async (
    contractAddress: Address,
    functionName: string,
    args: any[] = []
  ): Promise<{ success: boolean; sponsorshipData?: any; error?: string; gasEstimate?: bigint }> => {
    if (!address || !publicClient) {
      return { success: false, error: PAYMASTER_ERRORS.NOT_CONFIGURED }
    }

    // Vérification de la configuration Paymaster
    if (!PaymasterUtils.isPaymasterConfigured()) {
      return { success: false, error: PAYMASTER_ERRORS.NOT_CONFIGURED }
    }

    // Vérification si la méthode est supportée
    if (!PaymasterUtils.isMethodSponsored(functionName)) {
      return { success: false, error: PAYMASTER_ERRORS.METHOD_NOT_SUPPORTED }
    }

    setIsSponsoring(true)

    try {
      // Encodage de la transaction
      const data = encodeFunctionData({
        abi: CLAIM_DISTRIBUTOR_CONFIG.abi,
        functionName: functionName as any,
        args: args as any // Type assertion pour contourner les contraintes strictes d'ABI
      })

      // Estimation du gas
      let gasEstimate: bigint
      try {
        gasEstimate = await publicClient.estimateGas({
          account: address,
          to: contractAddress,
          data
        })
      } catch (estimateError) {
        console.warn('Gas estimation failed, using fallback:', estimateError)
        gasEstimate = PaymasterUtils.estimateGasForMethod(functionName)
      }

      // Validation de la transaction
      const validation = PaymasterUtils.validateTransaction(functionName, gasEstimate, address)
      if (!validation.valid) {
        return { success: false, error: validation.reason }
      }

      // Formatage de la requête de sponsoring
      const sponsorRequest = PaymasterUtils.formatSponsorRequest(
        contractAddress,
        data,
        address,
        gasEstimate
      )

      // Demande de sponsoring via l'API Coinbase
      const sponsorResponse = await requestSponsorship(sponsorRequest)

      if (sponsorResponse.success && sponsorResponse.sponsorshipData) {
        setLastSponsorshipData(sponsorResponse.sponsorshipData)
        return {
          success: true,
          sponsorshipData: sponsorResponse.sponsorshipData,
          gasEstimate
        }
      } else {
        return {
          success: false,
          error: sponsorResponse.error || PAYMASTER_ERRORS.SPONSORSHIP_FAILED,
          gasEstimate
        }
      }

    } catch (error) {
      console.error('Paymaster sponsorship failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : PAYMASTER_ERRORS.NETWORK_ERROR
      }
    } finally {
      setIsSponsoring(false)
    }
  }, [address, publicClient])

  /**
   * Exécute une transaction sponsorisée
   */
  const executeSponsoredTransaction = useCallback(async (
    contractAddress: Address,
    functionName: string,
    args: any[] = []
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    try {
      // Obtenir le sponsoring
      const sponsorResult = await sponsorTransaction(contractAddress, functionName, args)
      
      if (!sponsorResult.success) {
        return { success: false, error: sponsorResult.error }
      }

      // Important : MetaMask ne supporte pas nativement ERC-4337
      // Pour de vraies transactions gasless, il faut un wallet Account Abstraction
      // En attendant, on retourne false pour déclencher le fallback vers transaction normale
      
      console.log('🔧 Paymaster: Sponsoring obtained, but MetaMask cannot execute UserOperations')
      console.log('🔧 Paymaster: Falling back to normal transaction for actual execution')
      
      return {
        success: false,
        error: 'Sponsoring available but requires Account Abstraction wallet for gas-free execution. Using normal transaction.'
      }

    } catch (error) {
      console.error('Sponsored transaction execution failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed'
      }
    }
  }, [sponsorTransaction])

  /**
   * Claim daily avec sponsoring gasless
   */
  const sponsoredClaimDaily = useCallback(async (): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    return executeSponsoredTransaction(
      CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
      'claimDaily',
      []
    )
  }, [executeSponsoredTransaction])

  /**
   * Claim weekly avec sponsoring gasless
   */
  const sponsoredClaimWeekly = useCallback(async (): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    return executeSponsoredTransaction(
      CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
      'claimWeekly',
      []
    )
  }, [executeSponsoredTransaction])

  /**
   * Vérifie le statut du Paymaster Coinbase
   */
  const checkPaymasterStatus = useCallback(async (): Promise<{ available: boolean; policies?: any[] }> => {
    try {
      // Vérifie simplement si les clés API sont configurées
      const isConfigured = PaymasterUtils.isPaymasterConfigured()
      
      if (!isConfigured) {
        console.log('🔧 Paymaster: Non configuré (clés API manquantes)')
        return { available: false }
      }

      console.log('🔧 Paymaster: Configuré et disponible')
      return {
        available: true,
        policies: ['direct-sponsoring'] // Mode direct sans Policy ID spécifique
      }

    } catch (error) {
      console.error('🔧 Paymaster: Status check failed:', error)
      return { available: false }
    }
  }, [])

  return {
    // État
    isSponsoring,
    isPaymasterEnabled: PaymasterUtils.isPaymasterConfigured(),
    lastSponsorshipData,
    
    // Actions génériques
    sponsorTransaction,
    executeSponsoredTransaction,
    
    // Actions spécifiques aux claims
    sponsoredClaimDaily,
    sponsoredClaimWeekly,
    
    // Utilitaires
    checkPaymasterStatus,
    isMethodSponsored: PaymasterUtils.isMethodSponsored
  }
}

/**
 * Fonction auxiliaire pour effectuer la requête de sponsoring via l'API Coinbase
 */
async function requestSponsorship(
  sponsorRequest: PaymasterSponsorRequest
): Promise<PaymasterSponsorResponse> {
  try {
    console.log('🔧 Paymaster: Tentative de sponsoring transaction...', sponsorRequest)
    
    // URL directe avec clé API intégrée
    const coinbaseUrl = PAYMASTER_CONFIG.rpcUrl
    console.log('🔧 Paymaster: Using Coinbase endpoint:', coinbaseUrl)
    
    // Construction de la requête ERC-4337 pour le Paymaster
    const userOp = {
      sender: sponsorRequest.from,
      nonce: '0x0', // Sera calculé par le bundler
      initCode: '0x',
      callData: sponsorRequest.data,
      callGasLimit: `0x${parseInt(sponsorRequest.gasLimit).toString(16)}`,
      verificationGasLimit: '0x7530', // 30k gas
      preVerificationGas: '0x4e20', // 20k gas
      maxFeePerGas: '0x59682f00', // 1.5 gwei
      maxPriorityFeePerGas: '0x3b9aca00', // 1 gwei
      paymasterAndData: '0x',
      signature: '0x'
    }

    console.log('🔧 Paymaster: UserOperation construite:', userOp)

    // Headers simples - la clé API est intégrée dans l'URL
    const headers = {
      'Content-Type': 'application/json'
    }

    const requestBody = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'pm_sponsorUserOperation',
      params: [
        userOp,
        '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' // EntryPoint v0.6 address
      ]
    }

    console.log('🔧 Paymaster: Request URL:', coinbaseUrl)
    console.log('🔧 Paymaster: Request headers:', headers)
    console.log('🔧 Paymaster: Request body:', JSON.stringify(requestBody, null, 2))

    // Requête directe vers l'endpoint Coinbase
    console.log('🔧 Paymaster: Attempting direct Coinbase API call...')
    const response = await fetch(coinbaseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    })

    console.log('🔧 Paymaster: Response status:', response.status)
    console.log('🔧 Paymaster: Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('🔧 Paymaster: HTTP Error Details:')
      console.error('  - Status:', response.status)
      console.error('  - Status Text:', response.statusText)
      console.error('  - Error Body:', errorText)
      
      try {
        const errorJson = JSON.parse(errorText)
        console.error('  - Parsed Error:', errorJson)
      } catch (e) {
        console.error('  - Raw Error Text:', errorText)
      }
      
      // Fallback : Si l'API échoue (CORS, authentification, etc.), on continue sans sponsoring
      console.log('🔧 Paymaster: API failed, falling back to normal transaction')
      return {
        success: false,
        error: `Coinbase API Error ${response.status}: ${errorText}. Fallback to normal transaction.`
      }
    }

    const data = await response.json()
    console.log('🔧 Paymaster: Success Response data:', JSON.stringify(data, null, 2))

    // Parse la réponse Coinbase
    if (data.error) {
      let errorMessage = data.error.message || 'Coinbase Paymaster error'
      
      // Détection spécifique de l'erreur Account Abstraction
      if (data.error.code === -32004 && data.error.message?.includes('AA20 account not deployed')) {
        errorMessage = 'Gasless transactions require a Smart Contract Wallet. Using normal transaction with MetaMask.'
        console.log('🔧 Paymaster: MetaMask detected - Smart Wallet required for gasless transactions')
      }
      
      return {
        success: false,
        error: errorMessage,
        errorCode: data.error.code?.toString()
      }
    }

    if (data.result) {
      return {
        success: true,
        sponsorshipData: {
          paymasterAddress: data.result.paymasterAndData?.slice(0, 42) || '0x',
          paymasterData: data.result.paymasterAndData || '0x',
          preVerificationGas: data.result.preVerificationGas || '0x4e20',
          verificationGasLimit: data.result.verificationGasLimit || '0x7530',
          callGasLimit: data.result.callGasLimit || userOp.callGasLimit
        }
      }
    }

    return {
      success: false,
      error: 'Invalid Coinbase Paymaster response format'
    }

  } catch (error) {
    console.error('🔧 Paymaster: Sponsorship request failed:', error)
    
    // Diagnostic de l'erreur spécifique
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.log('🔧 Paymaster: CORS error detected - falling back to normal transaction')
      
      return {
        success: false,
        error: 'CORS error - Paymaster unavailable. Using normal transaction.'
      }
    }
    
    // Autres erreurs
    console.log('🔧 Paymaster: Other error, falling back to normal transaction')
    return {
      success: false,
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}. Using normal transaction.`
    }
  }
}

/**
 * Hook simplifié pour les composants qui ont juste besoin de savoir 
 * si les transactions gasless sont disponibles
 */
export function usePaymasterStatus() {
  const isEnabled = PaymasterUtils.isPaymasterConfigured()
  
  return {
    isPaymasterEnabled: isEnabled,
    canSponsorClaims: isEnabled && PaymasterUtils.isMethodSponsored('claimDaily'),
    sponsorshipMessage: isEnabled ? PAYMASTER_MESSAGES.SPONSORSHIP_ACTIVE : null
  }
}
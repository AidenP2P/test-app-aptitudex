import React, { useState, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, type Address } from 'viem'
import { base } from 'viem/chains'
import { toast } from 'sonner'
import { CLAIM_DISTRIBUTOR_CONFIG } from '@/config/claimDistributor'
import { APX_TOKEN_CONFIG } from '@/config/apxToken'

/**
 * Hook pour les fonctions admin du ClaimDistributor
 */
export function useClaimDistributorAdmin() {
  const { address, isConnected } = useAccount()
  const { writeContract, data: txHash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [lastOperation, setLastOperation] = useState<string | null>(null)

  /**
   * Provisionner le ClaimDistributor avec des tokens APX
   */
  const provisionContract = useCallback(async (amount: string): Promise<{ success: boolean; error?: string }> => {
    if (!address || !isConnected) {
      toast.error('Wallet not connected')
      return { success: false, error: 'Wallet not connected' }
    }

    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return { success: false, error: 'Invalid amount' }
    }

    setIsLoading(true)
    setLastOperation('provision')

    try {
      const amountWei = parseEther(amount)

      // Étape 1: Approve le ClaimDistributor à dépenser les tokens APX
      writeContract({
        address: APX_TOKEN_CONFIG.address,
        abi: [
          {
            type: 'function',
            name: 'approve',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'nonpayable'
          }
        ] as const,
        functionName: 'approve',
        args: [CLAIM_DISTRIBUTOR_CONFIG.contractAddress, amountWei],
        account: address,
        chain: base,
      })

      return { success: true }
    } catch (error) {
      console.error('Provision failed:', error)
      toast.error('Provision failed')
      setIsLoading(false)
      setLastOperation(null)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }, [address, isConnected, writeContract])

  /**
   * Effectuer le provisioning après l'approbation
   */
  const executeProvision = useCallback(async (amount: string): Promise<{ success: boolean; error?: string }> => {
    if (!address || !isConnected) {
      return { success: false, error: 'Wallet not connected' }
    }

    try {
      const amountWei = parseEther(amount)

      // Étape 2: Provisionner le contract
      writeContract({
        address: CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
        abi: CLAIM_DISTRIBUTOR_CONFIG.abi,
        functionName: 'provision',
        args: [amountWei],
        account: address,
        chain: base,
      })

      return { success: true }
    } catch (error) {
      console.error('Execute provision failed:', error)
      toast.error('Execute provision failed')
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }, [address, isConnected, writeContract])

  /**
   * Mettre à jour la configuration des rewards
   */
  const updateClaimConfig = useCallback(async (
    dailyAmount: string,
    weeklyAmount: string,
    enabled: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    if (!address || !isConnected) {
      toast.error('Wallet not connected')
      return { success: false, error: 'Wallet not connected' }
    }

    setIsLoading(true)
    setLastOperation('updateConfig')

    try {
      const dailyAmountWei = parseEther(dailyAmount)
      const weeklyAmountWei = parseEther(weeklyAmount)

      writeContract({
        address: CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
        abi: CLAIM_DISTRIBUTOR_CONFIG.abi,
        functionName: 'updateConfig',
        args: [dailyAmountWei, weeklyAmountWei, enabled],
        account: address,
        chain: base,
      })

      return { success: true }
    } catch (error) {
      console.error('Update config failed:', error)
      toast.error('Update configuration failed')
      setIsLoading(false)
      setLastOperation(null)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }, [address, isConnected, writeContract])

  /**
   * Toggle l'état des claims
   */
  const toggleClaims = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!address || !isConnected) {
      toast.error('Wallet not connected')
      return { success: false, error: 'Wallet not connected' }
    }

    setIsLoading(true)
    setLastOperation('toggleClaims')

    try {
      writeContract({
        address: CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
        abi: CLAIM_DISTRIBUTOR_CONFIG.abi,
        functionName: 'toggleClaims',
        account: address,
        chain: base,
      })

      return { success: true }
    } catch (error) {
      console.error('Toggle claims failed:', error)
      toast.error('Toggle claims failed')
      setIsLoading(false)
      setLastOperation(null)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }, [address, isConnected, writeContract])

  /**
   * Retrait d'urgence
   */
  const emergencyWithdraw = useCallback(async (amount: string): Promise<{ success: boolean; error?: string }> => {
    if (!address || !isConnected) {
      toast.error('Wallet not connected')
      return { success: false, error: 'Wallet not connected' }
    }

    setIsLoading(true)
    setLastOperation('emergencyWithdraw')

    try {
      const amountWei = parseEther(amount)

      writeContract({
        address: CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
        abi: CLAIM_DISTRIBUTOR_CONFIG.abi,
        functionName: 'emergencyWithdraw',
        args: [amountWei],
        account: address,
        chain: base,
      })

      return { success: true }
    } catch (error) {
      console.error('Emergency withdraw failed:', error)
      toast.error('Emergency withdraw failed')
      setIsLoading(false)
      setLastOperation(null)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }, [address, isConnected, writeContract])

  // Gestion du succès des transactions
  const handleTransactionSuccess = useCallback(() => {
    if (isConfirmed && lastOperation) {
      switch (lastOperation) {
        case 'provision':
          toast.success('Contract provisioned successfully!')
          break
        case 'updateConfig':
          toast.success('Configuration updated successfully!')
          break
        case 'toggleClaims':
          toast.success('Claims status toggled!')
          break
        case 'emergencyWithdraw':
          toast.success('Emergency withdrawal completed!')
          break
      }
      setLastOperation(null)
    }
    setIsLoading(false)
  }, [isConfirmed, lastOperation])

  // Effect pour gérer le succès des transactions
  React.useEffect(() => {
    handleTransactionSuccess()
  }, [handleTransactionSuccess])

  // Gestion des erreurs
  React.useEffect(() => {
    if (error) {
      console.error('Transaction error:', error)
      toast.error('Transaction failed')
      setIsLoading(false)
      setLastOperation(null)
    }
  }, [error])

  return {
    // États
    isLoading: isLoading || isPending || isConfirming,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    txHash,
    lastOperation,

    // Actions
    provisionContract,
    executeProvision,
    updateClaimConfig,
    toggleClaims,
    emergencyWithdraw
  }
}
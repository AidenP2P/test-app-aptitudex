import { useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { parseEther } from 'viem'
import { toast } from 'sonner'
import { useAPXMint } from './useAPXMint'

/**
 * Hook simplifié pour provisionner le ClaimDistributor
 * Utilise l'approche de mint direct pour le moment
 */
export function useProvisionDistributor() {
  const { address, isConnected } = useAccount()
  const { mintTokens, isPending: isMinting } = useAPXMint()
  
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Provisionner le ClaimDistributor en mintant directement vers le contract
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

    try {
      // Pour le moment, on mint directement vers le contract ClaimDistributor
      // Adresse du ClaimDistributor déployé
      const distributorAddress = '0x9Af5dFD8903968D6d0e20e741fB0737E6de67a97'
      
      await mintTokens(distributorAddress as `0x${string}`, amount)
      
      toast.success(`Provisioned ${amount} APX to ClaimDistributor successfully!`)
      
      return { success: true }
    } catch (error) {
      console.error('Provision failed:', error)
      toast.error('Provision failed')
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected, mintTokens])

  return {
    // États
    isLoading: isLoading || isMinting,
    
    // Actions
    provisionContract
  }
}
import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther, keccak256, toBytes } from 'viem'
import { toast } from 'sonner'
import { SPECIAL_REWARDS_DISTRIBUTOR_CONFIG } from '@/config/specialRewardsDistributor'
import { APX_TOKEN_CONFIG, APX_TOKEN_ABI } from '@/config/apxToken'
import { base } from 'viem/chains'

export interface CreateRewardForm {
  name: string
  description: string
  amount: string
  rewardType: 'base_batches' | 'social' | 'quiz' | 'contest'
  startDate: string
  endDate: string
  maxClaims: string
  requirements: {
    type: string
    action?: string
    url?: string
    verification?: string
    eligibility?: string
  }
}

/**
 * Hook pour la gestion admin des Special Rewards
 */
export function useSpecialRewardsAdmin() {
  const { address, isConnected } = useAccount()
  const { writeContract, data: txHash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [lastActivity, setLastActivity] = useState<string | null>(null)

  // Balance du contract special rewards
  const { data: contractBalance, refetch: refetchBalance } = useReadContract({
    address: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.contractAddress,
    abi: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.abi,
    functionName: 'getContractBalance',
    query: { enabled: isConnected }
  })

  // Nombre de rewards actifs
  const { data: activeRewardsCount, refetch: refetchCount } = useReadContract({
    address: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.contractAddress,
    abi: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.abi,
    functionName: 'getActiveRewardsCount',
    query: { enabled: isConnected }
  })

  // IDs des rewards actifs
  const { data: activeRewardIds, refetch: refetchIds } = useReadContract({
    address: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.contractAddress,
    abi: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.abi,
    functionName: 'getAllActiveRewardIds',
    query: { enabled: isConnected }
  })

  /**
   * Crée un reward ID à partir du nom
   */
  const generateRewardId = useCallback((name: string): `0x${string}` => {
    // Générer un ID unique basé sur le nom et timestamp
    const timestamp = Math.floor(Date.now() / 1000)
    const input = `${name.toLowerCase().replace(/\s+/g, '')}_${timestamp}`
    return keccak256(toBytes(input))
  }, [])

  /**
   * Crée un nouveau special reward
   */
  const createSpecialReward = useCallback(async (form: CreateRewardForm): Promise<{ success: boolean; error?: string }> => {
    if (!address || !isConnected) {
      toast.error('Wallet not connected')
      return { success: false, error: 'Wallet not connected' }
    }

    setIsLoading(true)

    try {
      // Validation des données
      if (!form.name || !form.description || !form.amount) {
        toast.error('Please fill all required fields')
        return { success: false, error: 'Missing required fields' }
      }

      const amount = parseEther(form.amount)
      const startTime = Math.floor(new Date(form.startDate).getTime() / 1000)
      const endTime = Math.floor(new Date(form.endDate).getTime() / 1000)
      const maxClaims = form.maxClaims ? parseInt(form.maxClaims) : 0

      if (endTime <= startTime) {
        toast.error('End date must be after start date')
        return { success: false, error: 'Invalid date range' }
      }

      // Générer l'ID du reward
      const rewardId = generateRewardId(form.name)

      // Préparer les requirements JSON
      const requirements = JSON.stringify({
        name: form.name,
        description: form.description,
        ...form.requirements
      })

      // Appel au smart contract
      writeContract({
        address: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.contractAddress,
        abi: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.abi,
        functionName: 'createSpecialReward',
        args: [
          rewardId,
          amount,
          BigInt(startTime),
          BigInt(endTime),
          form.rewardType,
          requirements,
          BigInt(maxClaims)
        ],
        chain: base,
        account: address
      })

      setLastActivity('create_reward')
      
      toast.success('Creating special reward...', {
        description: 'Transaction sent to blockchain'
      })

      return { success: true }

    } catch (error) {
      console.error('Create special reward failed:', error)
      toast.error('Failed to create special reward')
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected, writeContract, generateRewardId])

  /**
   * Provisionne le contract avec des tokens APX
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
      const amountWei = parseEther(amount)

      // D'abord approve le contract à dépenser les tokens
      writeContract({
        address: APX_TOKEN_CONFIG.address,
        abi: APX_TOKEN_ABI,
        functionName: 'approve',
        args: [SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.contractAddress, amountWei],
        chain: base,
        account: address
      })

      // Note: Dans un vrai workflow, il faudrait attendre la confirmation de l'approve
      // puis faire un deuxième appel pour provision. Pour simplifier ici, on fait juste l'approve.
      setLastActivity('provision_approve')
      
      toast.success('Approval sent...', {
        description: 'Next: call provision() manually'
      })

      return { success: true }

    } catch (error) {
      console.error('Provision failed:', error)
      toast.error('Failed to provision contract')
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected, writeContract])

  /**
   * Toggle le statut d'un reward
   */
  const toggleRewardStatus = useCallback(async (rewardId: string): Promise<{ success: boolean; error?: string }> => {
    if (!address || !isConnected) {
      toast.error('Wallet not connected')
      return { success: false, error: 'Wallet not connected' }
    }

    setIsLoading(true)

    try {
      writeContract({
        address: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.contractAddress,
        abi: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.abi,
        functionName: 'toggleRewardStatus',
        args: [rewardId as `0x${string}`],
        chain: base,
        account: address
      })

      setLastActivity('toggle_reward')
      toast.success('Toggling reward status...')

      return { success: true }

    } catch (error) {
      console.error('Toggle reward status failed:', error)
      toast.error('Failed to toggle reward status')
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected, writeContract])

  /**
   * Retrait d'urgence des fonds
   */
  const emergencyWithdraw = useCallback(async (amount: string): Promise<{ success: boolean; error?: string }> => {
    if (!address || !isConnected) {
      toast.error('Wallet not connected')
      return { success: false, error: 'Wallet not connected' }
    }

    setIsLoading(true)

    try {
      const amountWei = parseEther(amount)

      writeContract({
        address: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.contractAddress,
        abi: SPECIAL_REWARDS_DISTRIBUTOR_CONFIG.abi,
        functionName: 'emergencyWithdraw',
        args: [amountWei],
        chain: base,
        account: address
      })

      setLastActivity('emergency_withdraw')
      toast.success('Emergency withdrawal initiated...')

      return { success: true }

    } catch (error) {
      console.error('Emergency withdraw failed:', error)
      toast.error('Failed to withdraw funds')
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected, writeContract])

  /**
   * Refresh toutes les données
   */
  const refresh = useCallback(() => {
    refetchBalance()
    refetchCount()
    refetchIds()
  }, [refetchBalance, refetchCount, refetchIds])

  return {
    // ===== DONNÉES =====
    contractBalance: contractBalance ? (Number(contractBalance) / 1e18).toFixed(2) : '0',
    activeRewardsCount: activeRewardsCount ? Number(activeRewardsCount) : 0,
    activeRewardIds: activeRewardIds || [],
    isConnected,
    
    // ===== ÉTATS =====
    isLoading: isLoading || isPending || isConfirming,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    txHash,
    
    // ===== ACTIONS =====
    createSpecialReward,
    provisionContract,
    toggleRewardStatus,
    emergencyWithdraw,
    refresh,
    generateRewardId,
    
    // ===== UTILITAIRES =====
    formatTokenAmount: (amount: bigint) => (Number(amount) / 1e18).toFixed(2)
  }
}
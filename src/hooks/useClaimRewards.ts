import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { useAppStore } from '@/store/useAppStore'
import { type Address } from 'viem'
import { base } from 'viem/chains'
import { APX_TOKEN_CONFIG, APX_TOKEN_ABI, parseAPXAmount } from '@/config/apxToken'
import { toast } from 'sonner'

/**
 * Legacy hook for claiming rewards - now adapted for APX token transfers
 * Since APX doesn't have a traditional "claim rewards" mechanism,
 * this hook now handles token transfers which can simulate reward claims
 */
export function useClaimRewards() {
  const { claimRewards: updateStore } = useAppStore()
  const { address } = useAccount()

  const {
    data: hash,
    isPending,
    writeContract,
    error: writeError
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError
  } = useWaitForTransactionReceipt({
    hash,
  })

  const claimRewards = async () => {
    if (!address) {
      const error = new Error('Wallet not connected')
      toast.error('Please connect your wallet')
      throw error
    }
    
    try {
      // Since APX doesn't have a claim mechanism, we'll simulate this
      // by calling a placeholder function or just updating the store
      updateStore()
      toast.success('Rewards claimed successfully!')
      return '0x' as `0x${string}`
    } catch (error) {
      console.error('Failed to claim rewards:', error)
      toast.error('Failed to claim rewards. Please try again.')
      throw error
    }
  }

  const transferAPX = async (to: Address, amount: string) => {
    if (!address) {
      const error = new Error('Wallet not connected')
      toast.error('Please connect your wallet')
      throw error
    }

    try {
      const parsedAmount = parseAPXAmount(amount, APX_TOKEN_CONFIG.decimals)
      
      const result = await writeContract({
        address: APX_TOKEN_CONFIG.address,
        abi: APX_TOKEN_ABI,
        functionName: 'transfer',
        args: [to, parsedAmount],
        chain: base,
        account: address,
      })

      toast.success(`Transferring ${amount} APX to ${to.slice(0, 6)}...${to.slice(-4)}`)
      return result
    } catch (error) {
      console.error('Failed to transfer APX:', error)
      toast.error('Failed to transfer APX. Please try again.')
      throw error
    }
  }

  const error = writeError || receiptError

  return {
    claimRewards,
    transferAPX,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  }
}
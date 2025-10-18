import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { type Address } from 'viem'
import { base } from 'viem/chains'
import { APX_TOKEN_CONFIG, APX_TOKEN_ABI, parseAPXAmount } from '@/config/apxToken'
import { useAPXToken } from './useAPXToken'
import { toast } from 'sonner'

/**
 * Hook for admin minting of APX tokens
 * Only works if the connected wallet is the contract owner
 */
export function useAPXMint() {
  const { address } = useAccount()
  const { isAdmin, isLoading: isTokenLoading } = useAPXToken()

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

  const mintTokens = async (toAddress: Address, amount: string) => {
    if (!isAdmin) {
      const error = new Error('Only the contract owner can mint tokens')
      toast.error('Access denied: Only admin can mint tokens')
      throw error
    }

    try {
      // Parse the amount to the correct format (with decimals)
      const parsedAmount = parseAPXAmount(amount, APX_TOKEN_CONFIG.decimals)
      
      const result = await writeContract({
        address: APX_TOKEN_CONFIG.address,
        abi: APX_TOKEN_ABI,
        functionName: 'mint',
        args: [toAddress, parsedAmount],
      })

      toast.success(`Minting ${amount} APX tokens to ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}`)
      return result
    } catch (error) {
      console.error('Failed to mint tokens:', error)
      toast.error('Failed to mint tokens. Please try again.')
      throw error
    }
  }

  const error = writeError || receiptError

  return {
    mintTokens,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
    isAdmin,
    canMint: isAdmin && !isTokenLoading,
  }
}

/**
 * Hook for admin pausing/unpausing the contract
 */
export function useAPXPause() {
  const { address } = useAccount()
  const { isAdmin, isPaused } = useAPXToken()

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

  const pauseContract = async () => {
    if (!isAdmin) {
      const error = new Error('Only the contract owner can pause the contract')
      toast.error('Access denied: Only admin can pause contract')
      throw error
    }

    try {
      const result = await writeContract({
        address: APX_TOKEN_CONFIG.address,
        abi: APX_TOKEN_ABI,
        functionName: 'pause',
      })

      toast.success('Pausing contract...')
      return result
    } catch (error) {
      console.error('Failed to pause contract:', error)
      toast.error('Failed to pause contract. Please try again.')
      throw error
    }
  }

  const unpauseContract = async () => {
    if (!isAdmin) {
      const error = new Error('Only the contract owner can unpause the contract')
      toast.error('Access denied: Only admin can unpause contract')
      throw error
    }

    try {
      const result = await writeContract({
        address: APX_TOKEN_CONFIG.address,
        abi: APX_TOKEN_ABI,
        functionName: 'unpause',
      })

      toast.success('Unpausing contract...')
      return result
    } catch (error) {
      console.error('Failed to unpause contract:', error)
      toast.error('Failed to unpause contract. Please try again.')
      throw error
    }
  }

  const togglePause = async () => {
    if (isPaused) {
      return await unpauseContract()
    } else {
      return await pauseContract()
    }
  }

  const error = writeError || receiptError

  return {
    pauseContract,
    unpauseContract,
    togglePause,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
    isAdmin,
    isPaused,
    canPause: isAdmin,
  }
}
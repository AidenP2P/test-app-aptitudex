import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { type Address } from 'viem'
import { base } from 'viem/chains'
import { APX_TOKEN_CONFIG, APX_TOKEN_ABI, parseAPXAmount } from '@/config/apxToken'
import { useAPXToken } from './useAPXToken'
import { toast } from 'sonner'

/**
 * Hook for burning APX tokens from user's own balance
 */
export function useAPXBurn() {
  const { address } = useAccount()
  const { balance, formattedBalance } = useAPXToken()

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

  const burnTokens = async (amount: string) => {
    if (!address) {
      const error = new Error('Wallet not connected')
      toast.error('Please connect your wallet')
      throw error
    }

    try {
      // Parse the amount to the correct format (with decimals)
      const parsedAmount = parseAPXAmount(amount, APX_TOKEN_CONFIG.decimals)
      
      // Check if user has enough balance
      if (parsedAmount > balance) {
        const error = new Error('Insufficient balance')
        toast.error(`Insufficient balance. You have ${formattedBalance} APX`)
        throw error
      }

      const result = await writeContract({
        address: APX_TOKEN_CONFIG.address,
        abi: APX_TOKEN_ABI,
        functionName: 'burn',
        args: [parsedAmount],
        chain: base,
        account: address,
      })

      toast.success(`Burning ${amount} APX tokens...`)
      return result
    } catch (error) {
      console.error('Failed to burn tokens:', error)
      toast.error('Failed to burn tokens. Please try again.')
      throw error
    }
  }

  const error = writeError || receiptError

  return {
    burnTokens,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
    balance,
    formattedBalance,
    canBurn: Boolean(address && balance > 0n),
  }
}

/**
 * Hook for burning APX tokens from another address (requires allowance)
 */
export function useAPXBurnFrom() {
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

  const burnFromAddress = async (fromAddress: Address, amount: string) => {
    if (!address) {
      const error = new Error('Wallet not connected')
      toast.error('Please connect your wallet')
      throw error
    }

    try {
      // Parse the amount to the correct format (with decimals)
      const parsedAmount = parseAPXAmount(amount, APX_TOKEN_CONFIG.decimals)

      const result = await writeContract({
        address: APX_TOKEN_CONFIG.address,
        abi: APX_TOKEN_ABI,
        functionName: 'burnFrom',
        args: [fromAddress, parsedAmount],
        chain: base,
        account: address,
      })

      toast.success(`Burning ${amount} APX tokens from ${fromAddress.slice(0, 6)}...${fromAddress.slice(-4)}`)
      return result
    } catch (error) {
      console.error('Failed to burn tokens from address:', error)
      toast.error('Failed to burn tokens. Check allowance and try again.')
      throw error
    }
  }

  const error = writeError || receiptError

  return {
    burnFromAddress,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
    canBurnFrom: Boolean(address),
  }
}
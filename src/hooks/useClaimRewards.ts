import { useContractWrite, useWaitForTransactionReceipt, useAccount, useChainId } from 'wagmi'
import { useAppStore } from '@/store/useAppStore'
import { type Address } from 'viem'
import { base } from 'viem/chains'

const KUDOS_ADDRESS = '0x0000000000000000000000000000000000000000' as Address // Replace with actual contract address

const KUDOS_ABI = [
  {
    name: 'claimRewards',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  }
] as const

export function useClaimRewards() {
  const { claimRewards: updateStore } = useAppStore()
  const { address } = useAccount()
  const chainId = useChainId()

  const { data: hash, isPending, writeContractAsync } = useContractWrite({
    mutation: {
      onSuccess: () => {
        updateStore()
      },
      onError: (error) => {
        console.error('Failed to claim rewards:', error)
      },
    },
  })

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const claimRewards = async () => {
    if (!address) throw new Error('Wallet not connected')
    
    try {
      const tx = await writeContractAsync({
        address: KUDOS_ADDRESS,
        abi: KUDOS_ABI,
        functionName: 'claimRewards',
        chain: base,
        account: address,
      })
      return tx
    } catch (error) {
      console.error('Failed to claim rewards:', error)
      throw error
    }
  }

  return {
    claimRewards,
    isPending: isPending || isConfirming,
    isSuccess,
  }
}
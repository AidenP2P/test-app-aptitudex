import { useEffect } from 'react'
import { useAccount, useContractRead } from 'wagmi'
import { useAppStore } from '@/store/useAppStore'
import { type Address } from 'viem'

const KUDOS_ADDRESS = '0x0000000000000000000000000000000000000000' as Address // Replace with actual contract address

const KUDOS_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getPendingRewards',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  }
] as const

export function useKudos() {
  const { address } = useAccount()
  const { setKudosBalance, setPendingClaim } = useAppStore()

  // Get kudos balance
  const { data: balance, isLoading: isBalanceLoading } = useContractRead({
    abi: KUDOS_ABI,
    address: KUDOS_ADDRESS,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    }
  })

  // Get pending rewards
  const { data: pendingRewards, isLoading: isPendingLoading } = useContractRead({
    abi: KUDOS_ABI,
    address: KUDOS_ADDRESS,
    functionName: 'getPendingRewards',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    }
  })

  // Update store when data changes
  useEffect(() => {
    if (balance) {
      setKudosBalance(balance.toString())
    }
    if (pendingRewards) {
      setPendingClaim(pendingRewards.toString())
    }
  }, [balance, pendingRewards, setKudosBalance, setPendingClaim])

  return {
    balance,
    pendingRewards,
    isLoading: isBalanceLoading || isPendingLoading
  }
}
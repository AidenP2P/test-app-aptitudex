import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { type Address } from 'viem'
import { mainnet } from 'viem/chains'
import { useReadContract } from 'wagmi'

/**
 * Hook to resolve ENS names for Base addresses
 * Base ENS uses mainnet resolver, so we query mainnet for ENS names
 */
export function useENSName(address: Address | undefined) {
  const [ensName, setEnsName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // ENS Reverse Resolver contract on mainnet
  const ENS_REVERSE_RESOLVER = '0xa2c122be93b0074270ebee7f6b7292c7deb45047' as const
  
  const { data: resolvedName, isLoading: isResolving, error } = useReadContract({
    address: ENS_REVERSE_RESOLVER,
    abi: [
      {
        name: 'getName',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'addr', type: 'address' }],
        outputs: [{ name: '', type: 'string' }],
      },
    ],
    functionName: 'getName',
    args: address ? [address] : undefined,
    chainId: mainnet.id, // ENS is on mainnet
    query: {
      enabled: Boolean(address),
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: 1,
    },
  })

  // Debug logs
  useEffect(() => {
    if (address) {
      console.log('🔍 ENS Debug - Address:', address)
      console.log('🔍 ENS Debug - Resolved Name:', resolvedName)
      console.log('🔍 ENS Debug - Is Loading:', isResolving)
      console.log('🔍 ENS Debug - Error:', error)
    }
  }, [address, resolvedName, isResolving, error])

  useEffect(() => {
    if (resolvedName && resolvedName !== '') {
      // Check if the resolved name ends with .base.eth or .eth
      if (resolvedName.endsWith('.base.eth') || resolvedName.endsWith('.eth')) {
        setEnsName(resolvedName)
      } else {
        setEnsName(null)
      }
    } else {
      setEnsName(null)
    }
  }, [resolvedName])

  return {
    ensName,
    isLoading: isResolving,
    hasENS: Boolean(ensName),
  }
}

/**
 * Hook specifically for the current connected wallet
 */
export function useCurrentUserENS() {
  const { address } = useAccount()
  return useENSName(address)
}

/**
 * Utility function to format address display with ENS fallback
 */
export function formatAddressWithENS(
  address: Address | undefined,
  ensName: string | null | undefined,
  options: {
    truncateLength?: number
    showFull?: boolean
  } = {}
): string {
  const { truncateLength = 6, showFull = false } = options

  if (!address) return ''
  
  // If we have an ENS name, use it
  if (ensName) {
    return ensName
  }
  
  // Fallback to truncated address
  if (showFull) {
    return address
  }
  
  return `${address.slice(0, truncateLength)}...${address.slice(-4)}`
}

/**
 * Component hook that returns a formatted display name
 */
export function useDisplayName(
  address: Address | undefined,
  options: {
    truncateLength?: number
    showFull?: boolean
  } = {}
) {
  const { ensName, isLoading } = useENSName(address)
  
  const displayName = formatAddressWithENS(address, ensName, options)
  
  return {
    displayName,
    ensName,
    isLoading,
    hasENS: Boolean(ensName),
    isAddress: !ensName && Boolean(address),
  }
}
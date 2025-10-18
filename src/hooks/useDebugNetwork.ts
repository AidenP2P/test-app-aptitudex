import { useAccount, useChainId } from 'wagmi'
import { useEffect } from 'react'

export function useDebugNetwork() {
  const { address, isConnected, chain } = useAccount()
  const chainId = useChainId()

  useEffect(() => {
    console.log('🔍 DEBUG NETWORK:', {
      isConnected,
      address,
      currentChain: chain,
      chainId,
      chainName: chain?.name,
      expectedBaseMainnet: 8453,
      isBaseMainnet: chainId === 8453,
      metamaskChainId: typeof window !== 'undefined' && window.ethereum?.chainId
    })
  }, [isConnected, address, chain, chainId])

  const forceBaseMainnet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }] // 8453 en hex
        })
        console.log('✅ Forced switch to Base Mainnet')
      } catch (error) {
        console.error('❌ Failed to switch to Base Mainnet:', error)
      }
    }
  }

  return {
    currentChainId: chainId,
    isBaseMainnet: chainId === 8453,
    forceBaseMainnet
  }
}
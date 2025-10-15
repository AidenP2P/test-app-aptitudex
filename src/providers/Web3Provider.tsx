import * as React from 'react'
import { createConfig, WagmiProvider, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base } from 'viem/chains'
import { getDefaultConfig } from '@/config/chains'
import { injected } from 'wagmi/connectors'

const config = getDefaultConfig()
const queryClient = new QueryClient()

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(config.rpcUrl)
  },
  connectors: [
    injected()
  ]
})

interface Web3ProviderProps {
  children: React.ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps): React.JSX.Element {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// Export useful hooks for the application
export { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
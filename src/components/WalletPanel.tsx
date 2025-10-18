import { useEffect } from 'react'
import { Wallet, Power } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { useCurrentUserENS } from '@/hooks/useENSName'
import baseLogoInline from '@/assets/base-logo-inline.png'

export const WalletPanel = () => {
  const { isConnected: isStoreConnected, setWalletConnection, disconnectWallet } = useAppStore()
  
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { ensName, isLoading: isENSLoading, hasENS } = useCurrentUserENS()

  // Sync wagmi connection state with our store
  useEffect(() => {
    if (isConnected && address) {
      setWalletConnection(address, true)
    } else if (!isConnected && isStoreConnected) {
      disconnectWallet()
    }
  }, [isConnected, address, isStoreConnected, setWalletConnection, disconnectWallet])

  const handleConnect = async () => {
    try {
      await connect({ connector: injected() })
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    disconnectWallet()
  }

  if (!isConnected) {
    return (
      <div className="mx-6 mb-6 p-6 bg-card rounded-xl border border-border">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-5 h-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">Connect Your Wallet</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Secure, one-tap connect</p>
          </div>
        </div>
        <Button 
          onClick={handleConnect} 
          className="w-full h-12"
        >
          Connect Wallet
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-2">
          Built on Base
          <img src={baseLogoInline} alt="Base" className="h-[1em]" />
        </p>
      </div>
    )
  }
  
  return (
    <div className="mx-6 mb-6 p-6 bg-card rounded-xl border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm">
                {hasENS ? ensName : `${address?.slice(0, 6)}...${address?.slice(-4)}`}
              </p>
              {isENSLoading && (
                <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Badge className="text-xs bg-brand text-white">
                Base
              </Badge>
              {hasENS && (
                <Badge variant="outline" className="text-xs">
                  ENS
                </Badge>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="p-2 hover:bg-muted rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Disconnect wallet"
        >
          <Power className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}

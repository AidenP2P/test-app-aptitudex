import { useEffect, useState, useRef } from 'react'
import { Wallet, Power } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { Identity, Name, Avatar } from '@coinbase/onchainkit/identity'
import baseLogoInline from '@/assets/base-logo-inline.png'

// Composant pour la pastille ENS avec détection de statut
const ENSStatusBadge = ({ address }: { address: `0x${string}` | undefined }) => {
  const [hasENS, setHasENS] = useState(false)
  const nameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (nameRef.current && address) {
      // Observer le contenu du composant Name
      const observer = new MutationObserver(() => {
        const textContent = nameRef.current?.textContent || ''
        // Si le texte ne ressemble pas à une adresse (0x...), c'est probablement un ENS
        const isAddress = textContent.startsWith('0x') && textContent.length >= 10
        const ensDetected = !isAddress && textContent.length > 0
        console.log('🔍 ENS Detection - Text:', textContent, 'IsAddress:', isAddress, 'HasENS:', ensDetected)
        setHasENS(ensDetected)
      })

      observer.observe(nameRef.current, {
        childList: true,
        subtree: true,
        characterData: true
      })

      // Vérification initiale après un délai
      setTimeout(() => {
        const textContent = nameRef.current?.textContent || ''
        const isAddress = textContent.startsWith('0x') && textContent.length >= 10
        const ensDetected = !isAddress && textContent.length > 0
        console.log('🔍 ENS Initial Check - Text:', textContent, 'IsAddress:', isAddress, 'HasENS:', ensDetected)
        setHasENS(ensDetected)
      }, 500)

      return () => observer.disconnect()
    }
  }, [address])

  return (
    <>
      {/* Composant invisible pour détecter l'ENS */}
      <div ref={nameRef} className="hidden">
        <Identity address={address}>
          <Name className="text-xs" />
        </Identity>
      </div>
      
      {/* Badge visible avec style conditionnel */}
      <Badge
        variant="outline"
        className={`text-xs transition-all duration-300 ${
          hasENS
            ? 'bg-green-100 text-green-700 border-green-300 shadow-sm'
            : 'bg-transparent text-gray-500 border-gray-300'
        }`}
      >
        ENS
      </Badge>
    </>
  )
}

export const WalletPanel = () => {
  const { isConnected: isStoreConnected, setWalletConnection, disconnectWallet } = useAppStore()
  
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [hasENS, setHasENS] = useState(false)

  // Sync wagmi connection state with our store
  useEffect(() => {
    if (isConnected && address) {
      console.log('🔍 Wallet connected - Address:', address)
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
              <Identity
                address={address}
                className="text-sm font-mono"
                hasCopyAddressOnClick={false}
              >
                <Name className="text-sm font-mono text-foreground" />
              </Identity>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Badge className="text-xs bg-brand text-white">
                Base
              </Badge>
              {/* Hook pour détecter ENS */}
              <ENSStatusBadge address={address} />
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

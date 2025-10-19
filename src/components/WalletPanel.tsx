import { useEffect, useState, useRef } from 'react'
import { Wallet, Power, Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { Identity, Name, Avatar } from '@coinbase/onchainkit/identity'
import baseLogoInline from '@/assets/base-logo-inline.png'

// Debug ENS pour diagnostiquer les problèmes
const DEBUG_ENS = true

// Composant pour afficher le nom/adresse avec loading
const ENSLoadingWrapper = ({ address }: { address: `0x${string}` | undefined }) => {
  const [isLoadingENS, setIsLoadingENS] = useState(false)
  const nameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (nameRef.current && address) {
      if (DEBUG_ENS) {
        console.log('🔍 ENS DEBUG - Starting observation for address:', address)
      }
      
      // Démarrer le loading
      setIsLoadingENS(true)
      
      // Observer le contenu du composant Name
      const observer = new MutationObserver(() => {
        const textContent = nameRef.current?.textContent || ''
        
        if (DEBUG_ENS) {
          console.log('🔍 ENS DEBUG - MutationObserver triggered')
          console.log('  - TextContent:', textContent)
          console.log('  - Text Length:', textContent.length)
        }
        
        // Si on a du contenu (ENS ou adresse), arrêter le loading
        if (textContent.length > 0) {
          setIsLoadingENS(false)
        }
      })

      observer.observe(nameRef.current, {
        childList: true,
        subtree: true,
        characterData: true
      })

      // Vérification initiale après plusieurs délais pour capturer les changements
      const checkENS = (delay: number, label: string) => {
        setTimeout(() => {
          const textContent = nameRef.current?.textContent || ''
          
          if (DEBUG_ENS) {
            console.log(`🔍 ENS DEBUG - ${label} Check (${delay}ms)`)
            console.log('  - TextContent:', textContent)
          }
          
          // Si on a du contenu (ENS ou adresse), arrêter le loading
          if (textContent.length > 0) {
            setIsLoadingENS(false)
          }
        }, delay)
      }

      checkENS(100, 'Quick')
      checkENS(500, 'Initial')
      checkENS(1000, 'Delayed')
      checkENS(2000, 'Extended')
      
      // Timeout de sécurité pour arrêter le loading après 3 secondes max
      const loadingTimeout = setTimeout(() => {
        setIsLoadingENS(false)
      }, 3000)

      return () => {
        observer.disconnect()
        clearTimeout(loadingTimeout)
      }
    }
  }, [address])

  if (isLoadingENS) {
    return (
      <div className="flex items-center gap-2 text-sm font-mono text-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading...</span>
      </div>
    )
  }

  return (
    <>
      <Identity
        address={address}
        className="text-sm font-mono"
        hasCopyAddressOnClick={false}
      >
        <Name className="text-sm font-mono text-foreground" />
      </Identity>
      <div ref={nameRef} className="hidden">
        <Identity address={address}>
          <Name className="text-xs" />
        </Identity>
      </div>
    </>
  )
}

// Composant pour la pastille ENS avec détection de statut
const ENSStatusBadge = ({ address }: { address: `0x${string}` | undefined }) => {
  const [hasENS, setHasENS] = useState(false)
  const nameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (nameRef.current && address) {
      if (DEBUG_ENS) {
        console.log('🔍 ENS DEBUG - Starting observation for address:', address)
      }
      
      // Observer le contenu du composant Name
      const observer = new MutationObserver(() => {
        const textContent = nameRef.current?.textContent || ''
        // Si le texte ne ressemble pas à une adresse (0x...), c'est probablement un ENS
        const isAddress = textContent.startsWith('0x') && textContent.length >= 10
        const ensDetected = !isAddress && textContent.length > 0
        
        if (DEBUG_ENS) {
          console.log('🔍 ENS DEBUG - MutationObserver triggered')
          console.log('  - TextContent:', textContent)
          console.log('  - IsAddress:', isAddress)
          console.log('  - ENS Detected:', ensDetected)
          console.log('  - Text Length:', textContent.length)
        }
        
        setHasENS(ensDetected)
      })

      observer.observe(nameRef.current, {
        childList: true,
        subtree: true,
        characterData: true
      })

      // Vérification initiale après plusieurs délais pour capturer les changements
      const checkENS = (delay: number, label: string) => {
        setTimeout(() => {
          const textContent = nameRef.current?.textContent || ''
          const isAddress = textContent.startsWith('0x') && textContent.length >= 10
          const ensDetected = !isAddress && textContent.length > 0
          
          if (DEBUG_ENS) {
            console.log(`🔍 ENS DEBUG - ${label} Check (${delay}ms)`)
            console.log('  - TextContent:', textContent)
            console.log('  - IsAddress:', isAddress)
            console.log('  - ENS Detected:', ensDetected)
          }
          
          setHasENS(ensDetected)
        }, delay)
      }

      checkENS(100, 'Quick')
      checkENS(500, 'Initial')
      checkENS(1000, 'Delayed')
      checkENS(2000, 'Extended')

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
              {/* Hook pour détecter le chargement ENS */}
              <ENSLoadingWrapper address={address} />
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

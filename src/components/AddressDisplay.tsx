import { type Address } from 'viem'
import { useDisplayName } from '@/hooks/useENSName'
import { Badge } from './ui/badge'

interface AddressDisplayProps {
  address: Address | undefined
  className?: string
  showENSBadge?: boolean
  showFull?: boolean
  truncateLength?: number
  variant?: 'default' | 'mono' | 'small'
}

export const AddressDisplay = ({
  address,
  className = '',
  showENSBadge = false,
  showFull = false,
  truncateLength = 6,
  variant = 'default'
}: AddressDisplayProps) => {
  const { displayName, ensName, isLoading, hasENS } = useDisplayName(address, {
    showFull,
    truncateLength
  })

  if (!address) {
    return <span className={className}>-</span>
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'mono':
        return 'font-mono text-sm'
      case 'small':
        return 'text-xs'
      default:
        return 'font-mono text-sm'
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={getVariantClasses()}>
        {displayName}
      </span>
      
      {isLoading && (
        <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
      )}
      
      {showENSBadge && hasENS && (
        <Badge variant="outline" className="text-xs">
          ENS
        </Badge>
      )}
    </div>
  )
}

// Specialized component for transaction lists
export const TransactionAddressDisplay = ({
  address,
  label,
  className = ''
}: {
  address: Address | undefined
  label?: string
  className?: string
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <span className="text-xs text-muted-foreground mb-1">{label}</span>
      )}
      <AddressDisplay 
        address={address} 
        variant="mono" 
        showENSBadge 
        truncateLength={8}
      />
    </div>
  )
}

// Specialized component for compact displays
export const CompactAddressDisplay = ({
  address,
  className = ''
}: {
  address: Address | undefined
  className?: string
}) => {
  const { displayName, hasENS } = useDisplayName(address, { truncateLength: 4 })
  
  if (!address) return null
  
  return (
    <span className={`font-mono text-xs ${hasENS ? 'text-primary' : 'text-muted-foreground'} ${className}`}>
      {displayName}
    </span>
  )
}
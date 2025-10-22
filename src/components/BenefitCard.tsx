import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  UserCheck, Zap, DollarSign, Gift, 
  CheckCircle, Clock, AlertCircle 
} from 'lucide-react'
import type { Benefit } from '@/types/benefits'

interface BenefitCardProps {
  benefit: Benefit
  onRedeem: (benefitId: string) => Promise<void>
  onViewDetails?: (benefit: Benefit) => void
  disabled?: boolean
  className?: string
  isRedeeming?: boolean
}

export function BenefitCard({ 
  benefit, 
  onRedeem, 
  onViewDetails, 
  disabled = false,
  className = '',
  isRedeeming = false 
}: BenefitCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  // Dynamic icon mapping
  const getIcon = () => {
    const iconMap = {
      UserCheck, Zap, DollarSign, Gift
    }
    const IconComponent = iconMap[benefit.iconName as keyof typeof iconMap] || Gift
    return IconComponent
  }
  
  const handleRedeem = async () => {
    if (disabled || !benefit.canRedeem) return
    
    setIsLoading(true)
    try {
      await onRedeem(benefit.id)
    } finally {
      setIsLoading(false)
    }
  }
  
  const Icon = getIcon()
  
  return (
    <Card className={`${benefit.colorClass} border-primary/20 overflow-hidden ${className}`} data-testid="benefit-card">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
                {benefit.title}
              </h3>
              <p className="text-white/80 text-sm leading-relaxed line-clamp-2">
                {benefit.description}
              </p>
            </div>

            {/* Mechanics & Guardrails */}
            <div className="mb-4 space-y-2">
              <div className="text-white/70 text-xs">
                <strong>How:</strong> {benefit.mechanics}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs bg-white/10 text-white/90 border-white/20">
                  {benefit.guardrails}
                </Badge>
              </div>
            </div>

            {/* Availability Info */}
            {benefit.maxRedemptions > 0 && (
              <div className="mb-4 text-white/70 text-xs">
                {benefit.totalRedeemed}/{benefit.maxRedemptions} claimed
                {benefit.remainingSlots && benefit.remainingSlots <= 10 && (
                  <span className="text-yellow-200 ml-2">
                    Only {benefit.remainingSlots} left!
                  </span>
                )}
              </div>
            )}

            {/* Action Area */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              {/* Price Display */}
              <div className="text-white text-center sm:text-left">
                <span className="text-lg sm:text-2xl font-bold">{benefit.priceAPX}</span>
                <span className="text-white/80 ml-1 text-sm sm:text-base">APX</span>
              </div>

              {/* Action Button */}
              {benefit.isRedeemed ? (
                <Button
                  disabled
                  className="bg-green-500/20 text-green-200 hover:bg-green-500/30 cursor-not-allowed border border-green-500/30 text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto sm:h-10 flex-shrink-0"
                >
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Redeemed ✓
                </Button>
              ) : !benefit.isAvailable ? (
                <Button
                  disabled
                  className="bg-red-500/20 text-red-200 hover:bg-red-500/30 cursor-not-allowed border border-red-500/30 text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto sm:h-10 flex-shrink-0"
                >
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Sold Out
                </Button>
              ) : !benefit.canRedeem ? (
                <Button
                  disabled
                  className="bg-white/10 text-white/50 cursor-not-allowed text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto sm:h-10 flex-shrink-0"
                >
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Insufficient APX</span>
                  <span className="sm:hidden">No APX</span>
                </Button>
              ) : (
                <Button
                  onClick={handleRedeem}
                  disabled={disabled || isLoading || isRedeeming}
                  className="bg-white text-primary hover:bg-white/90 font-medium text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto sm:h-10 flex-shrink-0"
                >
                  {isLoading || isRedeeming ? (
                    <>
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                      <span className="hidden sm:inline">Redeeming...</span>
                      <span className="sm:hidden">Redeeming</span>
                    </>
                  ) : (
                    <>
                      <Gift className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Redeem</span>
                      <span className="sm:hidden">Redeem</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
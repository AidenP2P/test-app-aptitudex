import { useState } from 'react'
import { Flame, Clock, Gift, Loader2, CheckCircle } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { cn } from '@/lib/utils'

interface ClaimCardProps {
  type: 'daily' | 'weekly'
  title: string
  description: string
  rewardAmount: string
  streakCount: number
  bonusPercentage: number
  canClaim: boolean
  nextClaimTime: Date | null
  isLoading?: boolean
  isAdmin?: boolean
  onClaim: () => Promise<void>
  className?: string
}

export function ClaimCard({
  type,
  title,
  description,
  rewardAmount,
  streakCount,
  bonusPercentage,
  canClaim,
  nextClaimTime,
  isLoading = false,
  isAdmin = false,
  onClaim,
  className
}: ClaimCardProps) {
  const [isClaimingLocal, setIsClaimingLocal] = useState(false)

  const handleClaim = async () => {
    if (!canClaim || isLoading || isClaimingLocal) return
    
    setIsClaimingLocal(true)
    try {
      await onClaim()
    } catch (error) {
      console.error('Claim failed:', error)
    } finally {
      setIsClaimingLocal(false)
    }
  }

  const isProcessing = isLoading || isClaimingLocal

  // Calcule le temps restant jusqu'au prochain claim
  const getTimeUntilNextClaim = () => {
    if (!nextClaimTime) return null
    
    const now = new Date()
    const diff = nextClaimTime.getTime() - now.getTime()
    
    if (diff <= 0) return null
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const timeUntilNext = getTimeUntilNextClaim()

  // Détermine l'icône selon l'état
  const getIcon = () => {
    if (canClaim) {
      return <Gift className="w-5 h-5 text-green-500" />
    } else if (timeUntilNext) {
      return <Clock className="w-5 h-5 text-orange-500" />
    } else {
      return <CheckCircle className="w-5 h-5 text-blue-500" />
    }
  }

  // Détermine la couleur de bordure selon l'état
  const getBorderColor = () => {
    if (canClaim) {
      return 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20'
    } else if (timeUntilNext) {
      return 'border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/20'
    } else {
      return 'border-border bg-card'
    }
  }

  return (
    <div className={cn(
      "p-6 rounded-xl border transition-all duration-300",
      getBorderColor(),
      canClaim && "shadow-md hover:shadow-lg",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        
        {/* Type badge */}
        <Badge variant="outline" className="text-xs">
          {type === 'daily' ? '🌅 Daily' : '📅 Weekly'}
        </Badge>
      </div>

      {/* Reward Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Reward Amount</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{rewardAmount} APX</span>
            {bonusPercentage > 0 && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                +{bonusPercentage}%
              </Badge>
            )}
          </div>
        </div>

        {/* Streak Info */}
        {streakCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Streak</span>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-medium">{streakCount} {type === 'daily' ? 'days' : 'weeks'}</span>
            </div>
          </div>
        )}

        {/* Next claim time */}
        {timeUntilNext && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Next claim in</span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="font-medium text-orange-600">{timeUntilNext}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <Button
        onClick={handleClaim}
        disabled={!canClaim || isProcessing}
        className={cn(
          "w-full h-12 text-sm font-medium transition-all",
          canClaim
            ? "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
            : ""
        )}
        variant={canClaim ? "default" : "outline"}
        size="lg"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Claiming...</span>
          </div>
        ) : canClaim ? (
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            <span>Claim {rewardAmount} APX</span>
          </div>
        ) : timeUntilNext ? (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Available in {timeUntilNext}</span>
          </div>
        ) : (
          "Not Available"
        )}
      </Button>

      {/* Bonus info */}
      {bonusPercentage > 0 && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-300 font-medium">
              Streak bonus active! +{bonusPercentage}% extra reward
            </span>
          </div>
        </div>
      )}

      {/* Streak Bonus Details */}
      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <span className="text-xs text-blue-700 dark:text-blue-300">
            🔥 Streak Bonus
          </span>
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
            {streakCount > 0 ? (
              `${streakCount} ${type === 'daily' ? 'day' : 'week'}${streakCount > 1 ? 's' : ''} (+${bonusPercentage}%)`
            ) : (
              'Start your streak!'
            )}
          </span>
        </div>
        {streakCount === 0 && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Claim consecutive {type === 'daily' ? 'days' : 'weeks'} to earn bonus rewards
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Composant simplifié pour afficher un aperçu des claims
 */
export function ClaimCardPreview({
  type,
  nextReward,
  nextStreak,
  nextClaimTime,
  className
}: {
  type: 'daily' | 'weekly'
  nextReward: string
  nextStreak: number
  nextClaimTime: Date | null
  className?: string
}) {
  const timeUntilNext = nextClaimTime ? new Date(nextClaimTime.getTime() - Date.now()) : null
  
  return (
    <div className={cn(
      "p-4 rounded-lg border bg-card/50",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {type === 'daily' ? (
            <span className="text-lg">🌅</span>
          ) : (
            <span className="text-lg">📅</span>
          )}
          <div>
            <p className="font-medium text-sm">
              {type === 'daily' ? 'Daily' : 'Weekly'} Claim
            </p>
            <p className="text-xs text-muted-foreground">
              {nextReward} APX ready
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-xs font-medium">{nextStreak}</span>
          </div>
          {timeUntilNext && (
            <p className="text-xs text-muted-foreground">
              In {Math.ceil(timeUntilNext.getTime() / (1000 * 60))}m
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
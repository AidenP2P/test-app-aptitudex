import { useState } from 'react'
import { Trophy, ExternalLink, Calendar, Users, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSpecialRewards } from '@/hooks/useSpecialRewards'
import type { SpecialReward } from '@/config/specialRewardsDistributor'

interface SpecialRewardCardProps {
  reward: SpecialReward
  onClaim?: () => void
}

export function SpecialRewardCard({ reward, onClaim }: SpecialRewardCardProps) {
  const { claimSpecialReward, validateSocialAction, isLoading } = useSpecialRewards()
  const [isValidating, setIsValidating] = useState(false)

  const handleClaim = async () => {
    try {
      console.log('🎯 Claiming reward:', reward.name, reward.id)
      const result = await claimSpecialReward(reward.id)
      if (result.success) {
        console.log('✅ Claim successful, calling onClaim callback')
        if (onClaim) {
          onClaim() // This should refresh the rewards list
        }
      }
    } catch (error) {
      console.error('Claim failed:', error)
    }
  }

  const handleSocialAction = async () => {
    if (reward.rewardType !== 'social') return

    setIsValidating(true)
    try {
      // Ouvrir le lien dans un nouvel onglet
      if (reward.requirements.url) {
        window.open(reward.requirements.url, '_blank', 'noopener,noreferrer')
      }

      // Simuler une validation après un délai
      setTimeout(async () => {
        const isValid = await validateSocialAction(reward.id, reward.requirements.action)
        if (isValid) {
          // Auto-claim après validation
          await handleClaim()
        }
        setIsValidating(false)
      }, 2000)
    } catch (error) {
      console.error('Social action failed:', error)
      setIsValidating(false)
    }
  }

  const getRewardIcon = () => {
    switch (reward.rewardType) {
      case 'base_batches':
        return Trophy
      case 'social':
        return ExternalLink
      case 'quiz':
        return CheckCircle
      case 'contest':
        return Trophy
      default:
        return Trophy
    }
  }

  const getRewardColor = () => {
    switch (reward.rewardType) {
      case 'base_batches':
        return 'bg-gradient-primary'
      case 'social':
        return 'bg-blue-500'
      case 'quiz':
        return 'bg-green-500'
      case 'contest':
        return 'bg-purple-500'
      default:
        return 'bg-gradient-primary'
    }
  }

  const getBadgeVariant = () => {
    if (reward.isClaimed) return 'secondary'
    if (reward.canClaim) return 'default'
    return 'outline'
  }

  const getBadgeText = () => {
    if (reward.isClaimed) return 'Claimed'
    if (reward.canClaim) return 'Available'
    return 'Unavailable'
  }

  const RewardIcon = getRewardIcon()
  const isExpired = new Date() > reward.endDate
  const isNotYetStarted = new Date() < reward.startDate

  return (
    <Card className={`${getRewardColor()} border-primary/20 overflow-hidden`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <RewardIcon className="w-6 h-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-3">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {reward.name}
                </h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  {reward.description}
                </p>
              </div>
              {/* Removed badge to avoid contradictory information with button state */}
            </div>

            {/* Reward Details */}
            <div className="flex items-center gap-4 mb-4 text-white/70 text-xs">
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                <span>+{reward.amount} APX</span>
              </div>
              
              {reward.maxClaims > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{reward.totalClaimed}/{reward.maxClaims} claimed</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Until {reward.endDate.toLocaleDateString()}</span>
              </div>
            </div>

            {/* Status Messages */}
            {isExpired && (
              <div className="flex items-center gap-2 mb-3 text-red-200 text-sm">
                <Clock className="w-4 h-4" />
                <span>This reward has expired</span>
              </div>
            )}

            {isNotYetStarted && (
              <div className="flex items-center gap-2 mb-3 text-yellow-200 text-sm">
                <Clock className="w-4 h-4" />
                <span>This reward is not yet available</span>
              </div>
            )}

            {/* Action Button - Responsive Layout */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="text-white text-center sm:text-left">
                <span className="text-lg sm:text-2xl font-bold">+{reward.amount}</span>
                <span className="text-white/80 ml-1 text-sm sm:text-base">APX</span>
              </div>

              {reward.isClaimed ? (
                <Button
                  disabled
                  className="bg-green-500/20 text-green-200 hover:bg-green-500/30 cursor-not-allowed border border-green-500/30 text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto sm:h-10 flex-shrink-0"
                >
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Claimed ✓
                </Button>
              ) : isExpired ? (
                <Button
                  disabled
                  className="bg-red-500/20 text-red-200 hover:bg-red-500/30 cursor-not-allowed border border-red-500/30 text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto sm:h-10 flex-shrink-0"
                >
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Expired
                </Button>
              ) : isNotYetStarted ? (
                <Button
                  disabled
                  className="bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/30 cursor-not-allowed border border-yellow-500/30 text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto sm:h-10 flex-shrink-0"
                >
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Not Available
                </Button>
              ) : reward.canClaim ? (
                <>
                  {reward.rewardType === 'social' ? (
                    <Button
                      onClick={handleSocialAction}
                      disabled={isLoading || isValidating}
                      className="bg-white text-primary hover:bg-white/90 font-medium text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto sm:h-10 flex-shrink-0"
                    >
                      {isValidating ? (
                        <>
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                          <span className="hidden sm:inline">Validating...</span>
                          <span className="sm:hidden">Validating</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          {reward.requirements.action === 'like_devfolio' ? (
                            <>
                              <span className="hidden sm:inline">Like & Claim</span>
                              <span className="sm:hidden">Like</span>
                            </>
                          ) : (
                            <>
                              <span className="hidden sm:inline">Complete Action</span>
                              <span className="sm:hidden">Complete</span>
                            </>
                          )}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleClaim}
                      disabled={isLoading}
                      className="bg-white text-primary hover:bg-white/90 font-medium text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto sm:h-10 flex-shrink-0"
                    >
                      {isLoading ? (
                        <>
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                          <span className="hidden sm:inline">Claiming...</span>
                          <span className="sm:hidden">Claiming</span>
                        </>
                      ) : (
                        <>
                          <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Claim Reward</span>
                          <span className="sm:hidden">Claim</span>
                        </>
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  disabled
                  className="bg-white/10 text-white/50 cursor-not-allowed text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto sm:h-10 flex-shrink-0"
                >
                  <span className="hidden sm:inline">Unavailable</span>
                  <span className="sm:hidden">N/A</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
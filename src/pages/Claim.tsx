import { useState } from 'react'
import { Download, ArrowRight, Loader2, Send, Trash2, AlertTriangle, RefreshCw, Zap } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/useAppStore'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAPXToken } from '@/hooks/useAPXToken'
import { useClaimRewards } from '@/hooks/useClaimRewards'
import { useAPXBurn } from '@/hooks/useAPXBurn'
import { useClaimDistributor } from '@/hooks/useClaimDistributor'
import { ClaimCard } from '@/components/ClaimCard'
import { cn } from '@/lib/utils'
import { isAddress } from 'viem'

const Claim = () => {
  const { isConnected, pendingClaim } = useAppStore()
  const navigate = useNavigate()
  
  // APX Token hooks
  const {
    formattedBalance,
    balance,
    isPaused,
    tokenSymbol,
    isLoading: isTokenLoading
  } = useAPXToken()
  
  const { claimRewards, transferAPX, isPending, isSuccess } = useClaimRewards()
  const { burnTokens, isPending: isBurning, isSuccess: isBurnSuccess } = useAPXBurn()
  
  // Nouveau système ClaimDistributor
  const {
    userClaimData,
    availability,
    contractBalance,
    isLoading: isClaimLoading,
    isPaymasterEnabled,
    claimDaily,
    claimWeekly,
    refresh
  } = useClaimDistributor()

  const handleRefresh = async () => {
    try {
      await refresh()
      toast.success('Data refreshed successfully!')
    } catch (error) {
      toast.error('Failed to refresh data')
      console.error('Refresh error:', error)
    }
  }

  const handleClaim = async () => {
    try {
      await claimRewards()
      toast.success('Legacy rewards claimed successfully!', {
        duration: 3000,
      })
    } catch (error) {
      toast.error('Failed to claim rewards. Please try again.', {
        duration: 3000,
      })
    }
  }

  // Wrappers pour les fonctions de claim qui ignorent les valeurs de retour
  const handleDailyClaim = async (): Promise<void> => {
    await claimDaily()
  }

  const handleWeeklyClaim = async (): Promise<void> => {
    await claimWeekly()
  }
  
  if (!isConnected) {
    return (
      <>
        <Header title="Daily & Weekly Claims" subtitle="Claim your APX token rewards" />
        <div className="px-6 py-12 text-center">
          <Download className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Connect your wallet to access claims
          </p>
        </div>
      </>
    )
  }
  
  const hasPending = Number(pendingClaim) > 0
  const isLoading = isTokenLoading || isPending
  
  return (
    <>
      <Header title="Daily & Weekly Claims" subtitle={`Claim your ${tokenSymbol} tokens`} />
      
      <div className="px-6 pb-8">
        {isPaused && (
          <div className="mb-6">
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Contract Paused</p>
                <p className="text-xs text-destructive/80">All token operations are temporarily disabled</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Status Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {isPaymasterEnabled && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Gas-free Claims
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-8 px-3"
            disabled={isClaimLoading}
            title="Refresh claim data"
          >
            <RefreshCw className={`w-4 h-4 ${isClaimLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Paymaster Information Banner */}
        {isPaymasterEnabled && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Gas-free Claims Available</h4>
                <p className="text-sm text-blue-700 mb-2">
                  Gas-free transactions work with <strong>Smart Contract Wallets</strong> (Coinbase Smart Wallet, Account Abstraction).
                </p>
                <p className="text-xs text-blue-600">
                  💡 With MetaMask: Claims will automatically use normal transactions (you pay gas fees). Claims still work perfectly!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Claims Interface */}
        <div className="space-y-4">
          {/* Daily Claim */}
          {availability && (
            <div style={{ backgroundColor: '#424242' }} className="rounded-xl p-6">
              <ClaimCard
                type="daily"
                title="Daily Reward"
                description={isPaymasterEnabled ? "Claim daily APX (gas-free!)" : "Claim your daily APX tokens"}
                rewardAmount={availability.dailyRewardAmount}
                streakCount={Number(userClaimData?.currentDailyStreak || 0)}
                bonusPercentage={availability.dailyBonusPercent}
                canClaim={availability.canClaimDaily}
                nextClaimTime={availability.nextDailyClaimTime}
                isLoading={isClaimLoading}
                isAdmin={true} // Tous les utilisateurs peuvent claim
                onClaim={handleDailyClaim}
                className="!bg-[#424242] !border-[#424242]"
              />
            </div>
          )}

          {/* Weekly Claim */}
          {availability && (
            <div style={{ backgroundColor: '#424242' }} className="rounded-xl p-6">
              <ClaimCard
                type="weekly"
                title="Weekly Reward"
                description={isPaymasterEnabled ? "Claim weekly APX bonus (gas-free!)" : "Claim your weekly APX bonus"}
                rewardAmount={availability.weeklyRewardAmount}
                streakCount={Number(userClaimData?.currentWeeklyStreak || 0)}
                bonusPercentage={availability.weeklyBonusPercent}
                canClaim={availability.canClaimWeekly}
                nextClaimTime={availability.nextWeeklyClaimTime}
                isLoading={isClaimLoading}
                isAdmin={true} // Tous les utilisateurs peuvent claim
                onClaim={handleWeeklyClaim}
                className="!bg-[#424242] !border-[#424242]"
              />
            </div>
          )}

          {/* Loading state for claims */}
          {!availability && isConnected && (
            <div className="space-y-4">
              <div className="p-6 rounded-xl border bg-card animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-muted rounded"></div>
                    <div>
                      <div className="w-24 h-4 bg-muted rounded mb-1"></div>
                      <div className="w-32 h-3 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="w-16 h-6 bg-muted rounded"></div>
                </div>
                <div className="w-full h-12 bg-muted rounded"></div>
              </div>
              <div className="p-6 rounded-xl border bg-card animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-muted rounded"></div>
                    <div>
                      <div className="w-24 h-4 bg-muted rounded mb-1"></div>
                      <div className="w-32 h-3 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="w-16 h-6 bg-muted rounded"></div>
                </div>
                <div className="w-full h-12 bg-muted rounded"></div>
              </div>
            </div>
          )}
        </div>

        {/* Your Claim Statistics */}
        {userClaimData && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-3">Your Claim Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Daily Claims</p>
                <p className="font-semibold">{Number(userClaimData.totalDailyClaims)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Weekly Claims</p>
                <p className="font-semibold">{Number(userClaimData.totalWeeklyClaims)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Lifetime APX Claimed</p>
                <p className="font-semibold">
                  {userClaimData.lifetimeAPXClaimed
                    ? (Number(userClaimData.lifetimeAPXClaimed) / 1e18).toFixed(2)
                    : '0'} APX
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="font-semibold">
                  {isPaymasterEnabled ? 'Gas-free' : 'Standard'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contract Balance */}
        {contractBalance && (
          <div className="mt-6 p-3 bg-card border rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">ClaimDistributor Balance</span>
              <span className="font-medium">{contractBalance} APX</span>
            </div>
          </div>
        )}

        {/* Legacy Pending Claims */}
        {hasPending && (
          <div className="mt-6 p-6 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500/20">
                <Download className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Legacy Pending Rewards</p>
                <p className="text-2xl font-bold">{pendingClaim}</p>
              </div>
            </div>
            
            <Button
              onClick={handleClaim}
              disabled={isLoading}
              className="w-full h-12 mb-3"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  Claim Legacy Rewards
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

export default Claim

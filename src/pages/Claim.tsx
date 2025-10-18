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
  
  // Form state
  const [activeTab, setActiveTab] = useState<'claims' | 'overview' | 'send' | 'burn'>('claims')
  const [sendAddress, setSendAddress] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [burnAmount, setBurnAmount] = useState('')
  
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

  const handleSendTokens = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAddress(sendAddress)) {
      toast.error('Invalid address format')
      return
    }
    
    if (!sendAmount || Number(sendAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    if (Number(sendAmount) > Number(formattedBalance)) {
      toast.error('Insufficient balance')
      return
    }
    
    try {
      await transferAPX(sendAddress as `0x${string}`, sendAmount)
      setSendAddress('')
      setSendAmount('')
    } catch (error) {
      console.error('Failed to send tokens:', error)
    }
  }

  const handleBurnTokens = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!burnAmount || Number(burnAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    if (Number(burnAmount) > Number(formattedBalance)) {
      toast.error('Insufficient balance')
      return
    }
    
    try {
      await burnTokens(burnAmount)
      setBurnAmount('')
    } catch (error) {
      console.error('Failed to burn tokens:', error)
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
            Connect your wallet to access claims and manage APX tokens
          </p>
        </div>
      </>
    )
  }
  
  const hasPending = Number(pendingClaim) > 0
  const isLoading = isTokenLoading || isPending
  
  return (
    <>
      <Header title="Daily & Weekly Claims" subtitle={`Claim your ${tokenSymbol} tokens and manage your wallet`} />
      
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
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
              activeTab === 'claims'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground hover:border-primary/30'
            }`}
          >
            <Download className="w-4 h-4" />
            Daily & Weekly Claims
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground hover:border-primary/30'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
            Token Overview
          </button>
          <button
            onClick={() => setActiveTab('send')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
              activeTab === 'send'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground hover:border-primary/30'
            }`}
          >
            <Send className="w-4 h-4" />
            Send Tokens
          </button>
          <button
            onClick={() => setActiveTab('burn')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
              activeTab === 'burn'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground hover:border-primary/30'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Burn Tokens
          </button>
        </div>

        {/* Daily & Weekly Claims Tab */}
        {activeTab === 'claims' && (
          <div className="space-y-6">
            {/* Status Bar */}
            <div className="flex items-center justify-between">
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
                onClick={refresh}
                className="h-8 px-3"
                disabled={isClaimLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isClaimLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Claims Interface */}
            <div className="space-y-4">
              {/* Daily Claim */}
              {availability && (
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
                  isAdmin={false} // Plus de restriction admin
                  onClaim={handleDailyClaim}
                />
              )}

              {/* Weekly Claim */}
              {availability && (
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
                  isAdmin={false} // Plus de restriction admin
                  onClaim={handleWeeklyClaim}
                />
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

            {/* User Stats */}
            {userClaimData && (
              <div className="p-4 bg-muted rounded-lg">
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

            {/* Contract Balance (for reference) */}
            {contractBalance && (
              <div className="p-3 bg-card border rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Contract Balance</span>
                  <span className="font-medium">{contractBalance} APX</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Token Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* APX Balance Card */}
            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold text-lg mb-4">Token Overview</h3>
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-primary" />
                </div>
                <h4 className="text-2xl font-bold mb-2">
                  {isTokenLoading ? 'Loading...' : formattedBalance}
                </h4>
                <p className="text-muted-foreground mb-4">{tokenSymbol} tokens in your wallet</p>
              </div>
            </div>

            {/* Legacy Pending Claims */}
            {hasPending && (
              <div className="p-6 bg-card rounded-xl border border-border">
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
            
            {/* Contract Info */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Token Contract</span>
                <span className="font-mono text-sm">0x1A51...3dD3</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Network</span>
                <span className="text-sm">Base Mainnet</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={isPaused ? 'destructive' : 'default'}>
                  {isPaused ? 'Paused' : 'Active'}
                </Badge>
              </div>
            </div>
            
            <Button
              onClick={() => navigate('/activity')}
              className="w-full h-12"
              variant="outline"
              size="lg"
            >
              View Transaction History
            </Button>
          </div>
        )}

        {/* Send Tab */}
        {activeTab === 'send' && (
          <form onSubmit={handleSendTokens} className="p-6 bg-card rounded-xl border border-border">
            <h3 className="font-semibold text-lg mb-4">Send {tokenSymbol} Tokens</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sendAddress">Recipient Address</Label>
                <Input
                  id="sendAddress"
                  type="text"
                  placeholder="0x..."
                  value={sendAddress}
                  onChange={(e) => setSendAddress(e.target.value)}
                  required
                  className="mt-1.5"
                  disabled={isPaused || isPending}
                />
                {sendAddress && !isAddress(sendAddress) && (
                  <p className="text-sm text-destructive mt-1">Invalid address format</p>
                )}
              </div>
              <div>
                <Label htmlFor="sendAmount">Amount ({tokenSymbol})</Label>
                <Input
                  id="sendAmount"
                  type="number"
                  placeholder="100"
                  step="0.000001"
                  min="0"
                  max={formattedBalance}
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  required
                  className="mt-1.5"
                  disabled={isPaused || isPending}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Available: {formattedBalance} {tokenSymbol}</span>
                  <button 
                    type="button"
                    onClick={() => setSendAmount(formattedBalance)}
                    className="text-primary hover:underline"
                    disabled={isPaused || isPending}
                  >
                    Send Max
                  </button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12" 
                size="lg"
                disabled={isPaused || isPending || !sendAddress || !sendAmount || Number(sendAmount) <= 0}
              >
                {isPending ? 'Sending...' : `Send ${sendAmount || '0'} ${tokenSymbol}`}
              </Button>
              {isPaused && (
                <p className="text-sm text-muted-foreground text-center">
                  Contract is paused. Transfers are temporarily disabled.
                </p>
              )}
            </div>
          </form>
        )}

        {/* Burn Tab */}
        {activeTab === 'burn' && (
          <form onSubmit={handleBurnTokens} className="p-6 bg-card rounded-xl border border-border">
            <h3 className="font-semibold text-lg mb-4">Burn {tokenSymbol} Tokens</h3>
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Warning</span>
                </div>
                <p className="text-xs text-destructive/80">
                  Burning tokens permanently removes them from circulation. This action cannot be undone.
                </p>
              </div>
              
              <div>
                <Label htmlFor="burnAmount">Amount to Burn ({tokenSymbol})</Label>
                <Input
                  id="burnAmount"
                  type="number"
                  placeholder="100"
                  step="0.000001"
                  min="0"
                  max={formattedBalance}
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(e.target.value)}
                  required
                  className="mt-1.5"
                  disabled={isPaused || isBurning}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Available: {formattedBalance} {tokenSymbol}</span>
                  <button 
                    type="button"
                    onClick={() => setBurnAmount(formattedBalance)}
                    className="text-primary hover:underline"
                    disabled={isPaused || isBurning}
                  >
                    Burn All
                  </button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12" 
                size="lg"
                variant="destructive"
                disabled={isPaused || isBurning || !burnAmount || Number(burnAmount) <= 0}
              >
                {isBurning ? 'Burning...' : `Burn ${burnAmount || '0'} ${tokenSymbol}`}
              </Button>
              {isPaused && (
                <p className="text-sm text-muted-foreground text-center">
                  Contract is paused. Token operations are temporarily disabled.
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </>
  )
}

export default Claim

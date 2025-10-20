import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { RewardItem } from '@/components/RewardItem';
import { BottomSheet } from '@/components/BottomSheet';
import { SpecialRewardCard } from '@/components/SpecialRewardCard';
import { useAppStore } from '@/store/useAppStore';
import { useSpecialRewards } from '@/hooks/useSpecialRewards';
import { Award, Zap, Info, Coins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { SpecialReward } from '@/config/specialRewardsDistributor';

const Rewards = () => {
  const { rewards, isConnected } = useAppStore();
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [specialRewards, setSpecialRewards] = useState<SpecialReward[]>([]);
  
  // Special rewards hook
  const { getAvailableRewards, contractBalance, isLoading: isSpecialRewardsLoading } = useSpecialRewards();
  
  const reward = rewards?.find((r) => r.id === selectedReward);
  
  // Load special rewards - get ALL rewards (claimed and non-claimed)
  useEffect(() => {
    if (isConnected) {
      getAvailableRewards().then((allRewards) => {
        console.log('🎯 Setting rewards in state:', allRewards);
        setSpecialRewards(allRewards); // Ne pas filtrer - afficher TOUS les rewards
      }).catch(console.error);
    } else {
      setSpecialRewards([]);
    }
  }, [isConnected, getAvailableRewards]);
  
  const hasAvailableSpecialRewards = specialRewards.length > 0
  const hasClaimableSpecialRewards = specialRewards.some(r => r.canClaim)
  
  // Check if we have any claimable rewards (legacy or special)
  const hasAnyAvailableRewards = (rewards && rewards.some(r => r.status === 'earned')) || hasAvailableSpecialRewards
  
  const handleSpecialRewardClaim = () => {
    // Refresh special rewards after claim - but keep ALL rewards visible
    console.log('🔄 Refreshing rewards after claim...')
    getAvailableRewards().then((allRewards) => {
      console.log('🔄 Refreshed rewards:', allRewards)
      setSpecialRewards(allRewards) // Keep ALL rewards, including newly claimed ones
    }).catch(console.error)
  }
  
  if (!isConnected) {
    return (
      <>
        <Header title="My Rewards" subtitle="All your earned kudos" />
        <div className="px-6 py-12 text-center">
          <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Connect your wallet to view rewards
          </p>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Header title="My Rewards" subtitle="APX token rewards via AptitudeX" />
      
      <div className="px-6 pb-8">
        {/* Explanation Text Block */}
        <div className="mb-6 p-4 bg-card border rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-white mb-2">About Your Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Your organization enables you through AptitudeX to receive rewards,
                defined according to the configured attribution rules. These rewards
                are distributed as APX tokens on the Base network.
              </p>
            </div>
          </div>
        </div>

        {/* Base Community Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Base Community Alpha Launch</h4>
              <p className="text-sm text-blue-700 mb-2">
                This application rewards all Base community members with Daily Claims 
                as part of our Alpha version launch. 
              </p>
              <p className="text-sm text-blue-600 font-medium">
                Stay tuned - amazing features are coming! 🚀
              </p>
            </div>
          </div>
        </div>


        {/* Special Rewards Section */}
        {isConnected && (
          <>
            {specialRewards.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Special Rewards</h3>
                  <Badge variant="secondary" className="text-xs">
                    {specialRewards.filter(r => r.canClaim).length} claimable / {specialRewards.length} total
                  </Badge>
                </div>
                <div className="space-y-4">
                  {specialRewards.map((specialReward) => {
                    console.log('🎨 Rendering reward card:', specialReward.name, 'canClaim:', specialReward.canClaim, 'isClaimed:', specialReward.isClaimed);
                    return (
                      <SpecialRewardCard
                        key={specialReward.id}
                        reward={specialReward}
                        onClaim={handleSpecialRewardClaim}
                      />
                    );
                  })}
                </div>
              </div>
            )}


            {/* Loading state for special rewards */}
            {isSpecialRewardsLoading && specialRewards.length === 0 && (
              <div className="mb-6 p-6 rounded-xl border bg-card animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-xl"></div>
                    <div>
                      <div className="w-32 h-4 bg-muted rounded mb-2"></div>
                      <div className="w-48 h-3 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="w-20 h-6 bg-muted rounded"></div>
                </div>
                <div className="w-full h-10 bg-muted rounded"></div>
              </div>
            )}
          </>
        )}
        
        {/* Original Rewards List */}
        {(!rewards || rewards.length === 0) ? (
          // Only show "no rewards" message if there are truly no available rewards
          !hasClaimableSpecialRewards && !isSpecialRewardsLoading && (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No one-time rewards to get
              </p>
            </div>
          )
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Legacy Rewards
            </p>
            {rewards.map((reward) => (
              <RewardItem
                key={reward.id}
                reward={reward}
                onClick={() => setSelectedReward(reward.id)}
              />
            ))}
          </div>
        )}

        {/* Special Rewards Contract Balance - Always show at bottom if connected */}
        {isConnected && contractBalance && (
          <div className="mt-8 p-3 bg-card border rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Special Rewards Balance</span>
              </div>
              <span className="font-medium">{contractBalance} APX</span>
            </div>
          </div>
        )}
      </div>
      
      <BottomSheet
        open={!!selectedReward}
        onOpenChange={(open) => !open && setSelectedReward(null)}
        title="Reward Details"
      >
        {reward && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">{reward.title}</h3>
                <Badge variant={reward.status === 'claimed' ? 'secondary' : 'default'} className={
                  reward.status === 'earned' ? 'bg-primary text-primary-foreground' : ''
                }>
                  {reward.status}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                {reward.rule && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rule</span>
                    <span className="font-medium">{reward.rule}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-white">+{reward.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{reward.date}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
};

export default Rewards;

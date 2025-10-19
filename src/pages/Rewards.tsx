import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { RewardItem } from '@/components/RewardItem';
import { BottomSheet } from '@/components/BottomSheet';
import { useAppStore } from '@/store/useAppStore';
import { Award, Zap, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useClaimDistributor } from '@/hooks/useClaimDistributor';

const Rewards = () => {
  const { rewards, isConnected } = useAppStore();
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  
  const {
    userClaimData,
    contractBalance,
    isPaymasterEnabled
  } = useClaimDistributor();
  
  const reward = rewards?.find((r) => r.id === selectedReward);
  
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

        {/* Your Claim Statistics */}
        {userClaimData && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
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
          <div className="mb-6 p-3 bg-card border rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Contract Balance</span>
              <span className="font-medium">{contractBalance} APX</span>
            </div>
          </div>
        )}

        {/* Original Rewards List */}
        {(!rewards || rewards.length === 0) ? (
          <div className="text-center py-8">
            <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No traditional rewards yet — your APX rewards are managed through the new claim system.
            </p>
          </div>
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

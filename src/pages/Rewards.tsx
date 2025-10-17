import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { RewardItem } from '@/components/RewardItem';
import { BottomSheet } from '@/components/BottomSheet';
import { useAppStore } from '@/store/useAppStore';
import { Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Rewards = () => {
  const { rewards, isConnected } = useAppStore();
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  
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
  
  if (!rewards || rewards.length === 0) {
    return (
      <>
        <Header title="My Rewards" subtitle="All your earned kudos" />
        <div className="px-6 py-12 text-center">
          <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No rewards yet — earn your first kudos by helping your team.
          </p>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Header title="My Rewards" subtitle="All your earned kudos" />
      
      <div className="px-6 pb-8">
        <div className="space-y-3">
          {rewards.map((reward) => (
            <RewardItem
              key={reward.id}
              reward={reward}
              onClick={() => setSelectedReward(reward.id)}
            />
          ))}
        </div>
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

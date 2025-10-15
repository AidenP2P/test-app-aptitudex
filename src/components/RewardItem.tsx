import { Award, CheckCircle2 } from 'lucide-react';
import { Reward } from '@/store/useAppStore';
import { Badge } from './ui/badge';

interface RewardItemProps {
  reward: Reward;
  onClick?: () => void;
}

export const RewardItem = ({ reward, onClick }: RewardItemProps) => {
  const isClaimed = reward.status === 'claimed';
  
  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-all text-left group min-h-[44px]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3 flex-1">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isClaimed ? 'bg-muted' : 'bg-brand'
          }`}>
            {isClaimed ? (
              <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Award className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold truncate">{reward.title}</h4>
              {!isClaimed && (
                <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
                  New
                </Badge>
              )}
            </div>
            {reward.rule && (
              <p className="text-xs text-muted-foreground mb-1">{reward.rule}</p>
            )}
            <p className="text-xs text-muted-foreground">{reward.date}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-lg font-bold ${isClaimed ? 'text-muted-foreground' : 'text-white'}`}>
            +{reward.amount}
          </p>
          <p className="text-xs text-muted-foreground capitalize">{reward.status}</p>
        </div>
      </div>
    </button>
  );
};

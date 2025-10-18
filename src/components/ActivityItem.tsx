import { Download, Award, Send, Calendar, Flame, Star } from 'lucide-react';
import { Activity } from '@/store/useAppStore';
import { CompactAddressDisplay } from './AddressDisplay';
import { Badge } from './ui/badge';

interface ActivityItemProps {
  activity: Activity;
}

export const ActivityItem = ({ activity }: ActivityItemProps) => {
  const getIcon = () => {
    switch (activity.type) {
      case 'claim':
        return Download;
      case 'earn':
        return Award;
      case 'issue':
        return Send;
      case 'daily_claim':
        return Calendar;
      case 'weekly_claim':
        return Calendar;
      case 'streak_bonus':
        return Flame;
      default:
        return Award;
    }
  };
  
  const Icon = getIcon();
  
  const getTypeColor = () => {
    switch (activity.type) {
      case 'claim':
        return 'text-primary';
      case 'earn':
        return 'text-green-400';
      case 'issue':
        return 'text-blue-400';
      case 'daily_claim':
        return 'text-blue-500';
      case 'weekly_claim':
        return 'text-purple-500';
      case 'streak_bonus':
        return 'text-orange-500';
      default:
        return 'text-primary';
    }
  };

  const getTypeDisplay = () => {
    switch (activity.type) {
      case 'daily_claim':
        return 'Daily Claim';
      case 'weekly_claim':
        return 'Weekly Claim';
      case 'streak_bonus':
        return 'Streak Bonus';
      default:
        return activity.type.charAt(0).toUpperCase() + activity.type.slice(1);
    }
  };

  const getBgColor = () => {
    switch (activity.type) {
      case 'daily_claim':
        return 'bg-blue-500/20';
      case 'weekly_claim':
        return 'bg-purple-500/20';
      case 'streak_bonus':
        return 'bg-orange-500/20';
      case 'claim':
        return 'bg-brand';
      default:
        return 'bg-muted';
    }
  };
  
  return (
    <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getBgColor()}`}>
        <Icon className={`w-5 h-5 ${
          activity.type === 'claim' || activity.type.includes('claim') || activity.type === 'streak_bonus'
            ? 'text-white'
            : getTypeColor()
        }`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{getTypeDisplay()}</p>
            {activity.isStreakBonus && (
              <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/20">
                <Star className="w-3 h-3 mr-1" />
                Bonus
              </Badge>
            )}
            {activity.frequency && (
              <Badge variant="outline" className="text-xs">
                {activity.frequency}
              </Badge>
            )}
          </div>
          <p className={`text-sm font-bold ${getTypeColor()}`}>
            +{activity.amount} APX
          </p>
        </div>
        
        {activity.description && (
          <p className="text-xs text-muted-foreground mb-1">{activity.description}</p>
        )}
        
        {activity.streakDay && (
          <div className="flex items-center gap-1 mb-1">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-xs text-orange-500">
              {activity.streakDay} day streak
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{new Date(activity.date).toLocaleDateString()}</span>
          {activity.tx && (
            <>
              <span>•</span>
              <span className="font-mono truncate">{activity.tx}</span>
            </>
          )}
          
          {/* Show addresses for transfers */}
          {activity.fromAddress && (
            <>
              <span>•</span>
              <span>From:</span>
              <CompactAddressDisplay address={activity.fromAddress as `0x${string}`} />
            </>
          )}
          {activity.toAddress && (
            <>
              <span>•</span>
              <span>To:</span>
              <CompactAddressDisplay address={activity.toAddress as `0x${string}`} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

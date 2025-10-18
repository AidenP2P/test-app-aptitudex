import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { ActivityItem } from '@/components/ActivityItem';
import { useAppStore } from '@/store/useAppStore';
import { Activity as ActivityIcon } from 'lucide-react';

const Activity = () => {
  const { activity, isConnected } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'earned' | 'claimed' | 'claims'>('all');
  
  const filteredActivity = activity.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'earned') return item.type === 'earn';
    if (filter === 'claimed') return item.type === 'claim';
    if (filter === 'claims') return ['daily_claim', 'weekly_claim', 'streak_bonus'].includes(item.type);
    return true;
  });
  
  if (!isConnected) {
    return (
      <>
        <Header title="Activity" subtitle="Transaction history" />
        <div className="px-6 py-12 text-center">
          <ActivityIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Connect your wallet to view activity
          </p>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Header title="Activity" subtitle="Transaction history" />
      
      <div className="px-6 pb-8">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'earned', 'claimed', 'claims'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-h-[44px] ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-foreground hover:border-primary/30'
              }`}
            >
              {f === 'claims' ? 'Daily/Weekly Claims' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="space-y-3">
          {filteredActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No activity found
              </p>
            </div>
          ) : (
            filteredActivity.map((item) => (
              <ActivityItem key={item.id} activity={item} />
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default Activity;

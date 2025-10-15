import { Download, Award, Send } from 'lucide-react';
import { Activity } from '@/store/useAppStore';

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
    }
  };
  
  return (
    <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        activity.type === 'claim' ? 'bg-brand' : 'bg-muted'
      }`}>
        <Icon className={`w-5 h-5 ${
          activity.type === 'claim' ? 'text-white' : getTypeColor()
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-medium capitalize">{activity.type}</p>
          <p className={`text-sm font-bold ${getTypeColor()}`}>
            {activity.type === 'claim' ? '-' : '+'}{activity.amount}
          </p>
        </div>
        {activity.description && (
          <p className="text-xs text-white mb-1">{activity.description}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{activity.date}</span>
          {activity.tx && (
            <>
              <span>•</span>
              <span className="font-mono truncate">{activity.tx}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

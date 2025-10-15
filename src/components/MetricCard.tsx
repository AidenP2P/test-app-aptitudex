import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  variant?: 'default' | 'highlight';
}

export const MetricCard = ({ icon: Icon, label, value, variant = 'default' }: MetricCardProps) => {
  return (
    <div 
      className={`p-4 rounded-xl border transition-all ${
        variant === 'highlight' 
          ? 'bg-primary/10 border-primary/20' 
          : 'bg-card border-border'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${variant === 'highlight' ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">
        {value}
      </p>
    </div>
  );
};

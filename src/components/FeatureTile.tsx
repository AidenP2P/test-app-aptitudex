import { LucideIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface FeatureTileProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
}

export const FeatureTile = ({ icon: Icon, title, description, to }: FeatureTileProps) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    // Check if the URL contains an anchor
    if (to.includes('#')) {
      e.preventDefault();
      const [path, anchor] = to.split('#');
      navigate(path);
      
      // Wait for navigation to complete, then scroll to anchor
      setTimeout(() => {
        const element = document.getElementById(anchor);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      className="block p-6 bg-card rounded-xl border border-border hover:border-primary/30 transition-all group min-h-[44px]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center group-hover:bg-brand transition-colors">
              <Icon className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-semibold text-lg">{title}</h3>
          </div>
          <p className="text-sm text-muted-foreground ml-[52px]">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      </div>
    </Link>
  );
};

import { Home, Award, Download, Activity, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

export const BottomNav = () => {
  const user = useAppStore((state) => state.user);
  
  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/rewards', icon: Award, label: 'Rewards' },
    { to: '/claim', icon: Download, label: 'Claim' },
    { to: '/activity', icon: Activity, label: 'Activity' },
  ];
  
  if (user?.isAdmin) {
    links.push({ to: '/admin', icon: Settings, label: 'Admin' });
  }
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background-dark border-t border-border z-50">
      <div className="mx-auto max-w-lg">
        <div className="flex justify-around items-center h-16 px-2">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full min-w-[44px] transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-6 h-6 mb-1" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-xs font-medium">{label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 w-1 h-1 bg-primary rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

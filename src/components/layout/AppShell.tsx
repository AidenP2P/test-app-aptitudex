import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { PreviewBanner } from '../PreviewBanner';

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="min-h-screen bg-gradient-subtle pb-20 safe-area-inset">
      <PreviewBanner />
      <main className="mx-auto max-w-lg">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

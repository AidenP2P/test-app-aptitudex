import { Award, Flame, Download } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { WalletPanel } from '@/components/WalletPanel';
import { MetricCard } from '@/components/MetricCard';
import { FeatureTile } from '@/components/FeatureTile';
import { useAppStore } from '@/store/useAppStore';
import baseLogo from '@/assets/base-logo.png';
const Home = () => {
  const {
    isConnected,
    kudosBalance,
    user,
    pendingClaim
  } = useAppStore();
  return <>
      <Header title="AptitudeX" subtitle="On-chain app for team recognition and reward" />
      
      <WalletPanel />
      
      {isConnected && <>
          <div className="px-6 mb-8">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Your Stats
            </p>
            <div className="grid grid-cols-3 gap-3">
              <MetricCard icon={Award} label="My Kudos" value={kudosBalance} />
              <MetricCard icon={Flame} label="Streak" value={`${user?.streakDays}d`} variant="highlight" />
              <MetricCard icon={Download} label="Pending" value={pendingClaim} variant={Number(pendingClaim) > 0 ? 'highlight' : 'default'} />
            </div>
          </div>
          
          <div className="px-6 pb-8">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Quick Actions
            </p>
            <div className="space-y-3">
              <FeatureTile icon={Award} title="My Rewards" description="View all earned kudos and rewards" to="/rewards" />
              <FeatureTile icon={Download} title="Claim" description="Claim pending rewards to your wallet" to="/claim" />
              <FeatureTile icon={Award} title="Activity" description="View your transaction history" to="/activity" />
            </div>
          </div>
        </>}
      
      {!isConnected && <div className="px-6 pb-8 flex items-center justify-center gap-2">
          <p className="text-sm text-muted-foreground">On-chain, for the Base community.</p>
          
        </div>}
    </>;
};
export default Home;
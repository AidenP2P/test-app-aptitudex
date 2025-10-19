import { Award, Flame, Download, AlertTriangle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { WalletPanel } from '@/components/WalletPanel';
import { MetricCard } from '@/components/MetricCard';
import { FeatureTile } from '@/components/FeatureTile';
import { useAppStore } from '@/store/useAppStore';
import { useAPXToken } from '@/hooks/useAPXToken';
import { useClaimData } from '@/hooks/useClaimDistributor';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
const Home = () => {
  const navigate = useNavigate();
  const {
    isConnected,
    user,
    pendingClaim
  } = useAppStore();
  
  const {
    formattedBalance,
    isAdmin,
    isPaused,
    isLoading: isTokenLoading,
    tokenSymbol,
    tokenName
  } = useAPXToken();

  // Nouveau système ClaimDistributor - seulement pour les statistiques
  const {
    userClaimData,
    isPaymasterEnabled
  } = useClaimData();

  const handlePendingClick = () => {
    if (Number(pendingClaim) > 0) {
      navigate('/claim');
    }
  };

  // Show loading state if token data is still loading and wallet is connected
  if (isConnected && isTokenLoading) {
    return (
      <>
        <Header title="Aptitude X Base Community" subtitle="On-chain APX token rewards on Base" />
        <WalletPanel />
        <div className="px-6 py-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading token data...</p>
        </div>
      </>
    );
  }
  return <>
      <Header title="Aptitude X Base Community" subtitle="On-chain APX token rewards on Base" />
      
      <WalletPanel />
      
      {isConnected && <>
          {isPaused && (
            <div className="px-6 mb-4">
              <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">Contract Paused</p>
                  <p className="text-xs text-destructive/80">Token transfers are temporarily disabled</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="px-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Your Stats
              </p>
              {isAdmin && (
                <Badge variant="secondary" className="text-xs">
                  Admin
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <MetricCard
                icon={Award}
                label={`My ${tokenSymbol}`}
                value={isTokenLoading ? 'Loading...' : formattedBalance}
                variant="default"
              />
              <MetricCard
                icon={Flame}
                label="Daily Streak"
                value={`${userClaimData ? Number(userClaimData.currentDailyStreak) : 0}d`}
                variant="highlight"
              />
              <div onClick={handlePendingClick} className={Number(pendingClaim) > 0 ? 'cursor-pointer' : ''}>
                <MetricCard
                  icon={Download}
                  label="Pending"
                  value={pendingClaim}
                  variant={Number(pendingClaim) > 0 ? 'highlight' : 'default'}
                />
              </div>
            </div>
          </div>

          {/* Additional Stats Section */}
          {userClaimData && (
            <div className="px-6 mb-8">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                Claim Statistics
              </p>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  icon={Award}
                  label="Total Claims"
                  value={`${Number(userClaimData.totalDailyClaims) + Number(userClaimData.totalWeeklyClaims)}`}
                  variant="default"
                />
                <MetricCard
                  icon={Download}
                  label="APX Claimed"
                  value={`${(Number(userClaimData.lifetimeAPXClaimed) / 1e18).toFixed(0)}`}
                  variant="highlight"
                />
              </div>
            </div>
          )}
          
          <div className="px-6 pb-8">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Quick Actions
            </p>
            <div className="space-y-3">
              <FeatureTile
                icon={Award}
                title="My Rewards"
                description="View all earned APX tokens and rewards"
                to="/rewards"
              />
              <FeatureTile
                icon={Download}
                title="Daily & Weekly Claims"
                description={isPaymasterEnabled
                  ? "Claim your APX rewards (gas-free!)"
                  : isPaused
                    ? "Claims disabled (contract paused)"
                    : "Claim your daily and weekly APX rewards"
                }
                to="/claim"
              />
              <FeatureTile
                icon={Award}
                title="Activity"
                description="View your transaction history"
                to="/activity"
              />
              {isAdmin && (
                <FeatureTile
                  icon={Award}
                  title="Admin Console"
                  description="Mint tokens and manage contract"
                  to="/admin"
                />
              )}
            </div>
          </div>
        </>}
      
      {!isConnected && <div className="px-6 pb-8 flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground text-center">
            Connect your wallet to interact with APX tokens on Base mainnet
          </p>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Token Contract</p>
            <p className="font-mono text-xs">0x1A51...3dD3</p>
          </div>
        </div>}
    </>;
};
export default Home;
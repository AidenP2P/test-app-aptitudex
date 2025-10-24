import { Award, Flame, Download, AlertTriangle, Gift, Info, ArrowRight } from 'lucide-react';
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
    availability,
    isPaymasterEnabled
  } = useClaimData();

  // Calcule le total des tokens claimables (Daily + Weekly + Legacy)
  const getTotalClaimableTokens = () => {
    let total = 0;
    
    // Ajout des legacy pending claims
    total += Number(pendingClaim) || 0;
    
    // Ajout des Daily et Weekly claims disponibles
    if (availability) {
      if (availability.canClaimDaily) {
        total += Number(availability.dailyRewardAmount) || 0;
      }
      if (availability.canClaimWeekly) {
        total += Number(availability.weeklyRewardAmount) || 0;
      }
    }
    
    return total.toFixed(0);
  };

  const totalClaimable = getTotalClaimableTokens();
  const hasClaimableTokens = Number(totalClaimable) > 0;

  const handlePendingClick = () => {
    if (hasClaimableTokens) {
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
            <div className="space-y-3">
              {/* My APX - Full width */}
              <MetricCard
                icon={Award}
                label={`My ${tokenSymbol}`}
                value={isTokenLoading ? 'Loading...' : formattedBalance}
                variant="default"
              />
              
              {/* Daily Streak and Pending - Side by side */}
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  icon={Flame}
                  label="Daily Streak"
                  value={`${userClaimData ? Number(userClaimData.currentDailyStreak) : 0}d`}
                  variant="highlight"
                />
                <div onClick={handlePendingClick} className={hasClaimableTokens ? 'cursor-pointer' : ''}>
                  <MetricCard
                    icon={Download}
                    label="Pending"
                    value={totalClaimable}
                    variant={hasClaimableTokens ? 'highlight' : 'default'}
                  />
                </div>
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
                description="Check out current rewards campaigns"
                to="/rewards"
              />
              <FeatureTile
                icon={Gift}
                title="My Benefits"
                description="Exchange APX tokens for benefits"
                to="/rewards#my-benefits"
              />
              <FeatureTile
                icon={Download}
                title="My Daily & Weekly Claims"
                description={isPaymasterEnabled
                  ? "Claim your daily and weekly APX rewards"
                  : isPaused
                    ? "Claims disabled (contract paused)"
                    : "Claim your daily and weekly APX rewards"
                }
                to="/claim"
              />
              <FeatureTile
                icon={Award}
                title="My Activity"
                description="View your transaction history"
                to="/activity"
              />
              {isAdmin && (
                <FeatureTile
                  icon={Award}
                  title="My Admin Console"
                  description="Mint tokens and manage contract"
                  to="/admin"
                />
              )}
            </div>
          </div>
        </>}
      
      {!isConnected && <div className="px-6 pb-8 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground text-center">
              Connect your wallet to interact with APX tokens on Base mainnet
            </p>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Token Contract</p>
              <p className="font-mono text-xs">0x1A51...3dD3</p>
            </div>
          </div>
          
          <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full flex-shrink-0">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-950 dark:text-blue-50 mb-2">
                  Questions before connecting your wallet?
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-200 mb-3">
                  Learn about AptitudeX and understand how our on-chain rewards system works safely.
                </p>
                <button
                  onClick={() => navigate('/about')}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-1"
                >
                  About
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>}
    </>;
};
export default Home;
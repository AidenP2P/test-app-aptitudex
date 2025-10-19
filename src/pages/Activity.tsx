import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { ActivityItem } from '@/components/ActivityItem';
import { useAppStore } from '@/store/useAppStore';
import { Activity as ActivityIcon, Download, ArrowRight, Send, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAPXToken } from '@/hooks/useAPXToken';
import { useClaimRewards } from '@/hooks/useClaimRewards';
import { useAPXBurn } from '@/hooks/useAPXBurn';
import { toast } from 'sonner';
import { isAddress } from 'viem';

const Activity = () => {
  const { activity, isConnected, pendingClaim } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'earned' | 'claimed' | 'claims' | 'send' | 'burn'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'burn'>('overview');
  
  // Form state for Send and Burn operations
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');

  // APX Token hooks
  const {
    formattedBalance,
    isPaused,
    tokenSymbol,
    isLoading: isTokenLoading
  } = useAPXToken();
  
  const { claimRewards, transferAPX, isPending, isSuccess } = useClaimRewards();
  const { burnTokens, isPending: isBurning, isSuccess: isBurnSuccess } = useAPXBurn();
  
  const filteredActivity = activity.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'earned') return item.type === 'earn';
    if (filter === 'claimed') return item.type === 'claim';
    if (filter === 'claims') return ['daily_claim', 'weekly_claim', 'streak_bonus'].includes(item.type);
    if (filter === 'send') return item.type === 'send';
    if (filter === 'burn') return item.type === 'burn';
    return true;
  });

  const handleSendTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAddress(sendAddress)) {
      toast.error('Invalid address format');
      return;
    }
    
    if (!sendAmount || Number(sendAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (Number(sendAmount) > Number(formattedBalance)) {
      toast.error('Insufficient balance');
      return;
    }
    
    try {
      await transferAPX(sendAddress as `0x${string}`, sendAmount);
      setSendAddress('');
      setSendAmount('');
    } catch (error) {
      console.error('Failed to send tokens:', error);
    }
  };

  const handleBurnTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!burnAmount || Number(burnAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (Number(burnAmount) > Number(formattedBalance)) {
      toast.error('Insufficient balance');
      return;
    }
    
    try {
      await burnTokens(burnAmount);
      setBurnAmount('');
    } catch (error) {
      console.error('Failed to burn tokens:', error);
    }
  };

  const handleClaim = async () => {
    try {
      await claimRewards();
      toast.success('Legacy rewards claimed successfully!', {
        duration: 3000,
      });
    } catch (error) {
      toast.error('Failed to claim rewards. Please try again.', {
        duration: 3000,
      });
    }
  };
  
  if (!isConnected) {
    return (
      <>
        <Header title="Activity" subtitle="Transaction history and token management" />
        <div className="px-6 py-12 text-center">
          <ActivityIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Connect your wallet to view activity and manage tokens
          </p>
        </div>
      </>
    );
  }

  const hasPending = Number(pendingClaim) > 0;
  const isLoading = isTokenLoading || isPending;
  
  return (
    <>
      <Header title="Activity" subtitle="Transaction history and token management" />
      
      <div className="px-6 pb-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground hover:border-primary/30'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
            Token Overview
          </button>
          <button
            onClick={() => setActiveTab('send')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
              activeTab === 'send'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground hover:border-primary/30'
            }`}
          >
            <Send className="w-4 h-4" />
            Send Tokens
          </button>
          <button
            onClick={() => setActiveTab('burn')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
              activeTab === 'burn'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground hover:border-primary/30'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Burn Tokens
          </button>
        </div>

        {/* Token Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* APX Balance Card */}
            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold text-lg mb-4">Token Overview</h3>
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-primary" />
                </div>
                <h4 className="text-2xl font-bold mb-2">
                  {isTokenLoading ? 'Loading...' : formattedBalance}
                </h4>
                <p className="text-muted-foreground mb-4">{tokenSymbol} tokens in your wallet</p>
              </div>
            </div>

            {/* Legacy Pending Claims */}
            {hasPending && (
              <div className="p-6 bg-card rounded-xl border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500/20">
                    <Download className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Legacy Pending Rewards</p>
                    <p className="text-2xl font-bold">{pendingClaim}</p>
                  </div>
                </div>
                
                <Button
                  onClick={handleClaim}
                  disabled={isLoading}
                  className="w-full h-12 mb-3"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      Claim Legacy Rewards
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {/* Contract Info */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Token Contract</span>
                <span className="font-mono text-sm">0x1A51...3dD3</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Network</span>
                <span className="text-sm">Base Mainnet</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={isPaused ? 'destructive' : 'default'}>
                  {isPaused ? 'Paused' : 'Active'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Send Tab */}
        {activeTab === 'send' && (
          <form onSubmit={handleSendTokens} className="p-6 bg-card rounded-xl border border-border">
            <h3 className="font-semibold text-lg mb-4">Send {tokenSymbol} Tokens</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sendAddress">Recipient Address</Label>
                <Input
                  id="sendAddress"
                  type="text"
                  placeholder="0x..."
                  value={sendAddress}
                  onChange={(e) => setSendAddress(e.target.value)}
                  required
                  className="mt-1.5"
                  disabled={isPaused || isPending}
                />
                {sendAddress && !isAddress(sendAddress) && (
                  <p className="text-sm text-destructive mt-1">Invalid address format</p>
                )}
              </div>
              <div>
                <Label htmlFor="sendAmount">Amount ({tokenSymbol})</Label>
                <Input
                  id="sendAmount"
                  type="number"
                  placeholder="100"
                  step="0.000001"
                  min="0"
                  max={formattedBalance}
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  required
                  className="mt-1.5"
                  disabled={isPaused || isPending}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Available: {formattedBalance} {tokenSymbol}</span>
                  <button 
                    type="button"
                    onClick={() => setSendAmount(formattedBalance)}
                    className="text-primary hover:underline"
                    disabled={isPaused || isPending}
                  >
                    Send Max
                  </button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12" 
                size="lg"
                disabled={isPaused || isPending || !sendAddress || !sendAmount || Number(sendAmount) <= 0}
              >
                {isPending ? 'Sending...' : `Send ${sendAmount || '0'} ${tokenSymbol}`}
              </Button>
              {isPaused && (
                <p className="text-sm text-muted-foreground text-center">
                  Contract is paused. Transfers are temporarily disabled.
                </p>
              )}
            </div>
          </form>
        )}

        {/* Burn Tab */}
        {activeTab === 'burn' && (
          <form onSubmit={handleBurnTokens} className="p-6 bg-card rounded-xl border border-border">
            <h3 className="font-semibold text-lg mb-4">Burn {tokenSymbol} Tokens</h3>
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Warning</span>
                </div>
                <p className="text-xs text-destructive/80">
                  Burning tokens permanently removes them from circulation. This action cannot be undone.
                </p>
              </div>
              
              <div>
                <Label htmlFor="burnAmount">Amount to Burn ({tokenSymbol})</Label>
                <Input
                  id="burnAmount"
                  type="number"
                  placeholder="100"
                  step="0.000001"
                  min="0"
                  max={formattedBalance}
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(e.target.value)}
                  required
                  className="mt-1.5"
                  disabled={isPaused || isBurning}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Available: {formattedBalance} {tokenSymbol}</span>
                  <button 
                    type="button"
                    onClick={() => setBurnAmount(formattedBalance)}
                    className="text-primary hover:underline"
                    disabled={isPaused || isBurning}
                  >
                    Burn All
                  </button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12" 
                size="lg"
                variant="destructive"
                disabled={isPaused || isBurning || !burnAmount || Number(burnAmount) <= 0}
              >
                {isBurning ? 'Burning...' : `Burn ${burnAmount || '0'} ${tokenSymbol}`}
              </Button>
              {isPaused && (
                <p className="text-sm text-muted-foreground text-center">
                  Contract is paused. Token operations are temporarily disabled.
                </p>
              )}
            </div>
          </form>
        )}

        {/* Transaction History Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
          
          {/* Filter buttons */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {(['all', 'earned', 'claimed', 'claims', 'send', 'burn'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-h-[44px] ${
                  filter === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-foreground hover:border-primary/30'
                }`}
              >
                {f === 'claims' ? 'Daily/Weekly Claims' : 
                 f === 'send' ? 'Send Operations' :
                 f === 'burn' ? 'Burn Operations' :
                 f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Activity list */}
          <div className="space-y-3">
            {filteredActivity.length === 0 ? (
              <div className="text-center py-8">
                <ActivityIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No activity found for the selected filter
                </p>
              </div>
            ) : (
              filteredActivity.map((item) => (
                <div key={item.id} className="p-4 bg-card border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.type === 'daily_claim' || item.type === 'weekly_claim' ? 'bg-green-100' :
                        item.type === 'send' ? 'bg-blue-100' :
                        item.type === 'burn' ? 'bg-red-100' :
                        'bg-gray-100'
                      }`}>
                        {item.type === 'daily_claim' || item.type === 'weekly_claim' ? 
                          <Download className={`w-4 h-4 text-green-600`} /> :
                        item.type === 'send' ? 
                          <Send className="w-4 h-4 text-blue-600" /> :
                        item.type === 'burn' ? 
                          <Trash2 className="w-4 h-4 text-red-600" /> :
                          <ActivityIcon className="w-4 h-4 text-gray-600" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {item.type === 'daily_claim' ? 'Daily Claim' :
                           item.type === 'weekly_claim' ? 'Weekly Claim' :
                           item.type === 'send' ? 'Token Send' :
                           item.type === 'burn' ? 'Token Burn' :
                           item.description || 'Transaction'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium text-sm ${
                        item.type === 'burn' ? 'text-red-600' : 
                        item.type === 'daily_claim' || item.type === 'weekly_claim' ? 'text-green-600' :
                        'text-foreground'
                      }`}>
                        {item.type === 'burn' ? '-' : '+'}{item.amount} {tokenSymbol}
                      </p>
                      {item.tx && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {item.tx}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Activity;

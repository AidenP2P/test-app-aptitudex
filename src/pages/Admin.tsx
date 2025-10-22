import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/store/useAppStore';
import { Settings, Send, FileText, Users, Pause, Play, DollarSign, Wallet, Trophy, Calendar, Plus, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAPXToken } from '@/hooks/useAPXToken';
import { useAPXMint, useAPXPause } from '@/hooks/useAPXMint';
import { useClaimData } from '@/hooks/useClaimDistributor';
import { useProvisionDistributor } from '@/hooks/useProvisionDistributor';
import { useSpecialRewardsAdmin } from '@/hooks/useSpecialRewardsAdmin';
import { useBenefitsAdmin } from '@/hooks/useBenefitsAdmin';
import { useDebugNetwork } from '@/hooks/useDebugNetwork';
import { isAddress, parseEther } from 'viem';

const Admin = () => {
  const { user, isConnected } = useAppStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'issue' | 'claims' | 'special' | 'benefits' | 'rules' | 'allowlist' | 'contract'>('issue');
  
  // APX Token hooks
  const {
    isAdmin,
    isPaused,
    formattedTotalSupply,
    contractOwner,
    formattedBalance,
    isLoading: isTokenLoading
  } = useAPXToken();
  
  const {
    mintTokens,
    isPending: isMinting,
    isSuccess: isMintSuccess
  } = useAPXMint();
  
  const {
    togglePause,
    isPending: isPauseToggling,
    isSuccess: isPauseSuccess
  } = useAPXPause();

  // ClaimDistributor hooks
  const {
    claimConfig,
    contractBalance,
    isPaymasterEnabled
  } = useClaimData();

  // Provisioning hook
  const {
    provisionContract,
    isLoading: isProvisioning
  } = useProvisionDistributor();

  // Debug network hook
  const {
    currentChainId,
    isBaseMainnet,
    forceBaseMainnet
  } = useDebugNetwork();

  // Special Rewards Admin hook
  const {
    contractBalance: specialRewardsBalance,
    activeRewardsCount,
    activeRewardIds,
    createSpecialReward,
    provisionContract: provisionSpecialRewards,
    toggleRewardStatus,
    emergencyWithdraw: emergencyWithdrawSpecial,
    isLoading: isSpecialRewardsLoading
  } = useSpecialRewardsAdmin();

  // Benefits Admin hook
  const {
    initializePredefinedBenefits,
    exportContacts,
    getStats: getBenefitsStats,
    clearLocalData,
    isLoading: isBenefitsLoading
  } = useBenefitsAdmin();
  
  // Issue reward state
  const [issueAddress, setIssueAddress] = useState('');
  const [issueAmount, setIssueAmount] = useState('');
  const [issueNote, setIssueNote] = useState('');
  
  // Rule state
  const [ruleName, setRuleName] = useState('');
  const [ruleFrequency, setRuleFrequency] = useState<'daily' | 'weekly'>('daily');
  const [ruleBonus, setRuleBonus] = useState('');
  const [ruleActive, setRuleActive] = useState(true);
  
  // ClaimDistributor state
  const [provisionAmount, setProvisionAmount] = useState('');
  const [dailyRewardAmount, setDailyRewardAmount] = useState('10');
  const [weeklyRewardAmount, setWeeklyRewardAmount] = useState('100');
  const [claimsEnabled, setClaimsEnabled] = useState(true);

  // Special Rewards state
  const [specialRewardForm, setSpecialRewardForm] = useState({
    name: '',
    description: '',
    amount: '',
    rewardType: 'base_batches' as 'base_batches' | 'social' | 'quiz' | 'contest',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxClaims: '',
    requirements: {
      type: 'one_time',
      action: '',
      url: '',
      verification: 'self_declared',
      eligibility: ''
    }
  });
  const [specialProvisionAmount, setSpecialProvisionAmount] = useState('');

  // Allowlist state
  const [newAddress, setNewAddress] = useState('');
  const [allowlist] = useState(['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1']);
  
  // Redirect if not admin
  if (!isConnected || !isAdmin) {
    navigate('/');
    return null;
  }
  
  const handleIssueReward = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAddress(issueAddress)) {
      toast.error('Invalid address format');
      return;
    }
    
    if (!issueAmount || Number(issueAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    try {
      await mintTokens(issueAddress as `0x${string}`, issueAmount);
      // Reset form on success
      setIssueAddress('');
      setIssueAmount('');
      setIssueNote('');
    } catch (error) {
      console.error('Failed to mint tokens:', error);
    }
  };
  
  const handleDefineRule = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Rule "${ruleName}" created successfully`);
    setRuleName('');
    setRuleBonus('');
  };
  
  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!provisionAmount || Number(provisionAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const result = await provisionContract(provisionAmount);
      if (result.success) {
        setProvisionAmount('');
      }
    } catch (error) {
      console.error('Failed to provision contract:', error);
      toast.error('Failed to provision contract');
    }
  };

  const handleUpdateClaimConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Simule la mise à jour de la configuration
      // En réalité, cela ferait appel au contract ClaimDistributor
      toast.success('Claim configuration updated successfully');
    } catch (error) {
      console.error('Failed to update config:', error);
      toast.error('Failed to update configuration');
    }
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Address added to allowlist');
    setNewAddress('');
  };

  const handleCreateSpecialReward = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!specialRewardForm.name || !specialRewardForm.description || !specialRewardForm.amount) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const result = await createSpecialReward(specialRewardForm);
      if (result.success) {
        // Reset form on success
        setSpecialRewardForm({
          name: '',
          description: '',
          amount: '',
          rewardType: 'base_batches',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          maxClaims: '',
          requirements: {
            type: 'one_time',
            action: '',
            url: '',
            verification: 'self_declared',
            eligibility: ''
          }
        });
      }
    } catch (error) {
      console.error('Failed to create special reward:', error);
    }
  };

  const handleProvisionSpecialRewards = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!specialProvisionAmount || Number(specialProvisionAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const result = await provisionSpecialRewards(specialProvisionAmount);
      if (result.success) {
        setSpecialProvisionAmount('');
      }
    } catch (error) {
      console.error('Failed to provision special rewards contract:', error);
      toast.error('Failed to provision contract');
    }
  };
  
  return (
    <>
      <Header title="Admin Console" subtitle="Manage rewards and rules" />
      
      <div className="px-6 pb-8">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('issue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
              activeTab === 'issue'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground hover:border-primary/30'
            }`}
          >
            <Send className="w-4 h-4" />
            Issue Reward
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
              activeTab === 'claims'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground hover:border-primary/30'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            ClaimDistributor
          </button>
          <button
            onClick={() => setActiveTab('special')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
              activeTab === 'special'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground hover:border-primary/30'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Special Rewards
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground hover:border-primary/30'
            }`}
          >
            <FileText className="w-4 h-4" />
            Define Rule
          </button>
          <button
            onClick={() => setActiveTab('allowlist')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
              activeTab === 'allowlist'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground hover:border-primary/30'
            }`}
          >
            <Users className="w-4 h-4" />
            Allowlist
          </button>
          <button
            onClick={() => setActiveTab('contract')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
              activeTab === 'contract'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground hover:border-primary/30'
            }`}
          >
            <Settings className="w-4 h-4" />
            Contract
          </button>
          <button
            onClick={() => setActiveTab('benefits')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
              activeTab === 'benefits'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground hover:border-primary/30'
            }`}
          >
            <Gift className="w-4 h-4" />
            Benefits
          </button>
        </div>
        
        {activeTab === 'issue' && (
          <form onSubmit={handleIssueReward} className="p-6 bg-card rounded-xl border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Mint APX Tokens</h3>
              {isPaused && (
                <Badge variant="destructive">Contract Paused</Badge>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Recipient Address</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="0x..."
                  value={issueAddress}
                  onChange={(e) => setIssueAddress(e.target.value)}
                  required
                  className="mt-1.5"
                  disabled={isPaused || isMinting}
                />
                {issueAddress && !isAddress(issueAddress) && (
                  <p className="text-sm text-destructive mt-1">Invalid address format</p>
                )}
              </div>
              <div>
                <Label htmlFor="amount">Amount (APX)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="100"
                  step="0.000001"
                  min="0"
                  value={issueAmount}
                  onChange={(e) => setIssueAmount(e.target.value)}
                  required
                  className="mt-1.5"
                  disabled={isPaused || isMinting}
                />
              </div>
              <div>
                <Label htmlFor="note">Note (optional)</Label>
                <Textarea
                  id="note"
                  placeholder="Reason for minting..."
                  value={issueNote}
                  onChange={(e) => setIssueNote(e.target.value)}
                  className="mt-1.5"
                  disabled={isPaused || isMinting}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12"
                size="lg"
                disabled={isPaused || isMinting || !issueAddress || !issueAmount}
              >
                {isMinting ? 'Minting...' : `Mint ${issueAmount || '0'} APX`}
              </Button>
              {isPaused && (
                <p className="text-sm text-muted-foreground text-center">
                  Contract is paused. Unpause to mint tokens.
                </p>
              )}
            </div>
          </form>
        )}

        {activeTab === 'claims' && (
          <div className="space-y-6">
            {/* ClaimDistributor Status */}
            <div className="p-6 bg-card rounded-xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">ClaimDistributor Status</h3>
                {isPaymasterEnabled && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Wallet className="w-3 h-3" />
                    Gasless Claims Active
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Contract Balance</p>
                  <p className="text-xl font-bold">{contractBalance || '0'} APX</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Claims Status</p>
                  <p className="text-xl font-bold">
                    {claimConfig?.enabled ? 'Active' : 'Disabled'}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Daily Reward</p>
                  <p className="text-xl font-bold">
                    {claimConfig ? (Number(claimConfig.dailyAmount) / 1e18).toFixed(0) : '10'} APX
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Weekly Reward</p>
                  <p className="text-xl font-bold">
                    {claimConfig ? (Number(claimConfig.weeklyAmount) / 1e18).toFixed(0) : '100'} APX
                  </p>
                </div>
              </div>
            </div>

            {/* Provision Contract */}
            <form onSubmit={handleProvision} className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold text-lg mb-4">Provision ClaimDistributor</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="provisionAmount">Amount (APX)</Label>
                  <Input
                    id="provisionAmount"
                    type="number"
                    placeholder="1000000"
                    step="0.000001"
                    min="0"
                    value={provisionAmount}
                    onChange={(e) => setProvisionAmount(e.target.value)}
                    required
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Current wallet balance: {formattedBalance} APX
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12"
                  size="lg"
                  disabled={!provisionAmount || Number(provisionAmount) <= 0 || isProvisioning || !isBaseMainnet}
                >
                  {!isBaseMainnet
                    ? 'Switch to Base Mainnet First'
                    : isProvisioning
                      ? 'Provisioning...'
                      : `Provision ${provisionAmount || '0'} APX`
                  }
                </Button>
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> This will transfer APX tokens from your wallet to the ClaimDistributor contract for user rewards.
                </p>
              </div>
            </form>

            {/* Configure Claims */}
            <form onSubmit={handleUpdateClaimConfig} className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold text-lg mb-4">Configure Claim Rewards</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dailyReward">Daily Reward Amount (APX)</Label>
                  <Input
                    id="dailyReward"
                    type="number"
                    placeholder="10"
                    step="0.000001"
                    min="0"
                    value={dailyRewardAmount}
                    onChange={(e) => setDailyRewardAmount(e.target.value)}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="weeklyReward">Weekly Reward Amount (APX)</Label>
                  <Input
                    id="weeklyReward"
                    type="number"
                    placeholder="100"
                    step="0.000001"
                    min="0"
                    value={weeklyRewardAmount}
                    onChange={(e) => setWeeklyRewardAmount(e.target.value)}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <Label htmlFor="claimsEnabled" className="cursor-pointer">
                    <div>
                      <div className="font-medium">Enable Claims</div>
                      <div className="text-sm text-muted-foreground">Allow users to claim daily and weekly rewards</div>
                    </div>
                  </Label>
                  <Switch
                    id="claimsEnabled"
                    checked={claimsEnabled}
                    onCheckedChange={setClaimsEnabled}
                  />
                </div>
                <Button type="submit" className="w-full h-12" size="lg">
                  Update Configuration
                </Button>
              </div>
            </form>

            {/* Emergency Controls */}
            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold text-lg mb-4">Emergency Controls</h3>
              <div className="space-y-3">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    if (confirm('Are you sure you want to disable all claims? This action can be reversed.')) {
                      toast.success('Claims disabled for emergency')
                    }
                  }}
                >
                  Emergency: Disable All Claims
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (confirm('Are you sure you want to withdraw all funds from the ClaimDistributor?')) {
                      toast.success('Emergency withdrawal initiated')
                    }
                  }}
                >
                  Emergency: Withdraw All Funds
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                <strong>Warning:</strong> Emergency controls should only be used in critical situations.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'special' && (
          <div className="space-y-6">
            {/* Special Rewards Status */}
            <div className="p-6 bg-card rounded-xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Special Rewards Status</h3>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  {activeRewardsCount} Active Rewards
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Contract Balance</p>
                  <p className="text-xl font-bold">{specialRewardsBalance} APX</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Active Rewards</p>
                  <p className="text-xl font-bold">{activeRewardsCount}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Contract Address</p>
                  <p className="text-xs font-mono">0xb2a5...775C</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-xl font-bold text-green-400">Live</p>
                </div>
              </div>
            </div>

            {/* Create Special Reward */}
            <form onSubmit={handleCreateSpecialReward} className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Special Reward
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="specialName">Reward Name</Label>
                    <Input
                      id="specialName"
                      type="text"
                      placeholder="Base Batches 002 Bonus"
                      value={specialRewardForm.name}
                      onChange={(e) => setSpecialRewardForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialAmount">Amount (APX)</Label>
                    <Input
                      id="specialAmount"
                      type="number"
                      placeholder="50"
                      step="0.000001"
                      min="0"
                      value={specialRewardForm.amount}
                      onChange={(e) => setSpecialRewardForm(prev => ({ ...prev, amount: e.target.value }))}
                      required
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialDescription">Description</Label>
                  <Textarea
                    id="specialDescription"
                    placeholder="Exclusive reward for you as first users of this app!"
                    value={specialRewardForm.description}
                    onChange={(e) => setSpecialRewardForm(prev => ({ ...prev, description: e.target.value }))}
                    required
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label>Reward Type</Label>
                  <div className="grid grid-cols-4 gap-2 mt-1.5">
                    {(['base_batches', 'social', 'quiz', 'contest'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSpecialRewardForm(prev => ({ ...prev, rewardType: type }))}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                          specialRewardForm.rewardType === type
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground hover:bg-muted/80'
                        }`}
                      >
                        {type.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="specialStartDate">Start Date</Label>
                    <Input
                      id="specialStartDate"
                      type="date"
                      value={specialRewardForm.startDate}
                      onChange={(e) => setSpecialRewardForm(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialEndDate">End Date</Label>
                    <Input
                      id="specialEndDate"
                      type="date"
                      value={specialRewardForm.endDate}
                      onChange={(e) => setSpecialRewardForm(prev => ({ ...prev, endDate: e.target.value }))}
                      required
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialMaxClaims">Max Claims (0 = unlimited)</Label>
                  <Input
                    id="specialMaxClaims"
                    type="number"
                    placeholder="0"
                    min="0"
                    value={specialRewardForm.maxClaims}
                    onChange={(e) => setSpecialRewardForm(prev => ({ ...prev, maxClaims: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>

                {/* Requirements section for social type */}
                {specialRewardForm.rewardType === 'social' && (
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    <Label>Social Action Requirements</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="socialAction">Action</Label>
                        <Input
                          id="socialAction"
                          placeholder="like_devfolio"
                          value={specialRewardForm.requirements.action}
                          onChange={(e) => setSpecialRewardForm(prev => ({
                            ...prev,
                            requirements: { ...prev.requirements, action: e.target.value }
                          }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="socialUrl">URL</Label>
                        <Input
                          id="socialUrl"
                          placeholder="https://devfolio.co/projects/..."
                          value={specialRewardForm.requirements.url}
                          onChange={(e) => setSpecialRewardForm(prev => ({
                            ...prev,
                            requirements: { ...prev.requirements, url: e.target.value }
                          }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12"
                  size="lg"
                  disabled={isSpecialRewardsLoading || !specialRewardForm.name || !specialRewardForm.amount}
                >
                  {isSpecialRewardsLoading ? 'Creating...' : `Create ${specialRewardForm.name} (+${specialRewardForm.amount || '0'} APX)`}
                </Button>
              </div>
            </form>

            {/* Provision Special Rewards Contract */}
            <form onSubmit={handleProvisionSpecialRewards} className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold text-lg mb-4">Provision Special Rewards Contract</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="specialProvisionAmount">Amount (APX)</Label>
                  <Input
                    id="specialProvisionAmount"
                    type="number"
                    placeholder="100000"
                    step="0.000001"
                    min="0"
                    value={specialProvisionAmount}
                    onChange={(e) => setSpecialProvisionAmount(e.target.value)}
                    required
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Current contract balance: {specialRewardsBalance} APX
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12"
                  size="lg"
                  disabled={!specialProvisionAmount || Number(specialProvisionAmount) <= 0 || isSpecialRewardsLoading}
                >
                  {isSpecialRewardsLoading ? 'Processing...' : `Approve ${specialProvisionAmount || '0'} APX`}
                </Button>
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> This will approve the SpecialRewardsDistributor to spend your APX tokens. Follow up with manual provision() call.
                </p>
              </div>
            </form>

            {/* Quick Actions - Initialize Predefined Rewards */}
            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold text-lg mb-4">Quick Setup - Initialize Predefined Rewards</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setSpecialRewardForm({
                      name: 'Celebrate Alpha version launch for Base Community',
                      description: 'Exclusive reward for you as first users of this app!',
                      amount: '50',
                      rewardType: 'base_batches',
                      startDate: new Date().toISOString().split('T')[0],
                      endDate: '2025-12-31',
                      maxClaims: '0',
                      requirements: {
                        type: 'one_time',
                        action: '',
                        url: '',
                        verification: 'self_declared',
                        eligibility: 'alpha_user'
                      }
                    });
                  }}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Setup Alpha Launch Reward (50 APX)
                </Button>
                
                <Button
                  onClick={() => {
                    setSpecialRewardForm({
                      name: 'Support us on Devfolio',
                      description: 'Like our project in the context of Base Batches 002 Builder and get rewarded!',
                      amount: '1000',
                      rewardType: 'social',
                      startDate: new Date().toISOString().split('T')[0],
                      endDate: '2024-10-24',
                      maxClaims: '0',
                      requirements: {
                        type: 'social_action',
                        action: 'like_devfolio',
                        url: 'https://devfolio.co/projects/kudos-protocol-d7e4',
                        verification: 'self_declared',
                        eligibility: ''
                      }
                    });
                  }}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Setup Devfolio Like Reward (1000 APX)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                <strong>Quick Setup:</strong> Click to pre-fill forms with the predefined rewards, then click "Create" to deploy them.
              </p>
            </div>



            {/* Emergency Controls */}
            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold text-lg mb-4">Emergency Controls</h3>
              <div className="space-y-3">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    const amount = prompt('Enter amount to withdraw (APX):');
                    if (amount && confirm(`Are you sure you want to withdraw ${amount} APX from SpecialRewardsDistributor?`)) {
                      emergencyWithdrawSpecial(amount);
                    }
                  }}
                  disabled={isSpecialRewardsLoading}
                >
                  Emergency: Withdraw Funds
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                <strong>Warning:</strong> Emergency withdrawal will remove funds from the contract, preventing users from claiming rewards.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'benefits' && (
          <div className="space-y-6">
            {/* Benefits Management Header */}
            <div className="p-6 bg-card rounded-xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Benefits Management</h3>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  Demo Mode
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage APX token benefits that users can redeem. Currently in demo mode with local storage.
              </p>
            </div>

            {/* Benefits Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-card rounded-xl border border-border">
                <h4 className="font-medium mb-3">Initialize Benefits</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Create the 4 predefined benefits for users to redeem
                </p>
                <Button
                  onClick={() => initializePredefinedBenefits()}
                  disabled={isBenefitsLoading}
                  className="w-full"
                >
                  {isBenefitsLoading ? 'Initializing...' : 'Setup'}
                </Button>
              </div>

              <div className="p-6 bg-card rounded-xl border border-border">
                <h4 className="font-medium mb-3">Export Contacts</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Download CSV of all submitted contact emails
                </p>
                <Button
                  onClick={() => exportContacts()}
                  variant="outline"
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>

              <div className="p-6 bg-card rounded-xl border border-border">
                <h4 className="font-medium mb-3">Statistics</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  View benefits usage and performance metrics
                </p>
                <Button
                  onClick={() => getBenefitsStats().then(stats => {
                    if (stats) {
                      toast.success(`Stats: ${stats.totalRedemptions} redemptions, ${stats.totalAPXBurned} APX burned`)
                    } else {
                      toast.info('No benefits statistics available yet')
                    }
                  })}
                  variant="outline"
                  className="w-full"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  View
                </Button>
              </div>

              <div className="p-6 bg-card rounded-xl border border-border">
                <h4 className="font-medium mb-3">Development</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Clear demo data for testing
                </p>
                <Button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all demo data? This cannot be undone.')) {
                      clearLocalData()
                    }
                  }}
                  variant="destructive"
                  className="w-full"
                >
                  Clear Data
                </Button>
              </div>
            </div>

            {/* Available Benefits Overview */}
            <div className="p-6 bg-card rounded-xl border border-border">
              <h4 className="font-medium mb-4">Available Benefits</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Early Access to the Beta</div>
                    <div className="text-sm text-muted-foreground">500 APX • Limited to 100 redemptions</div>
                  </div>
                  <Badge variant="secondary">Access</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">10 USDC Voucher</div>
                    <div className="text-sm text-muted-foreground">1000 APX • Limited to 10 redemptions</div>
                  </div>
                  <Badge variant="secondary">Reward</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">1:1 with the Creator (Aiden P2P)</div>
                    <div className="text-sm text-muted-foreground">1500 APX • Limited to 10 redemptions</div>
                  </div>
                  <Badge variant="secondary">Premium</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Lucky Draw — Win 100 USDC</div>
                    <div className="text-sm text-muted-foreground">2000 APX • Limited to 500 entries</div>
                  </div>
                  <Badge variant="secondary">Contest</Badge>
                </div>
              </div>
            </div>

            {/* Benefits System Notes */}
            <div className="p-6 bg-card rounded-xl border border-border">
              <h4 className="font-medium mb-3">Implementation Notes</h4>
              <div className="text-sm space-y-2 text-muted-foreground">
                <p>
                  <strong>Smart Contract:</strong> BenefitsManagement contract handles benefit creation,
                  redemption with APX burn, and contact hash storage.
                </p>
                <p>
                  <strong>Manual Processing:</strong> During alpha, benefits are processed manually.
                  Users submit contact info and the team fulfills benefits within 24-48h.
                </p>
                <p>
                  <strong>Contact Storage:</strong> Email addresses are stored locally with hash
                  links on-chain for privacy and GDPR compliance.
                </p>
                <p>
                  <strong>Gasless Transactions:</strong> Benefits redemptions can be sponsored via
                  Coinbase Paymaster for better user experience.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <form onSubmit={handleDefineRule} className="p-6 bg-card rounded-xl border border-border">
            <h3 className="font-semibold text-lg mb-4">Define Rule</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ruleName">Rule Name</Label>
                <Input
                  id="ruleName"
                  type="text"
                  placeholder="Daily Contribution"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setRuleFrequency('daily')}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                      ruleFrequency === 'daily'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => setRuleFrequency('weekly')}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                      ruleFrequency === 'weekly'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    Weekly
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="bonus">Streak Bonus %</Label>
                <Input
                  id="bonus"
                  type="number"
                  placeholder="10"
                  value={ruleBonus}
                  onChange={(e) => setRuleBonus(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <Label htmlFor="active" className="cursor-pointer">Active</Label>
                <Switch
                  id="active"
                  checked={ruleActive}
                  onCheckedChange={setRuleActive}
                />
              </div>
              <Button type="submit" className="w-full h-12" size="lg">
                Create Rule
              </Button>
            </div>
          </form>
        )}
        
        {activeTab === 'allowlist' && (
          <div className="space-y-4">
            <form onSubmit={handleAddAddress} className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold text-lg mb-4">Add to Allowlist</h3>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="0x..."
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" size="lg" className="px-6">
                  Add
                </Button>
              </div>
            </form>
            
            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold text-lg mb-4">Current Allowlist</h3>
              <div className="space-y-2">
                {allowlist.map((address, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <span className="font-mono text-sm">{address}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'contract' && (
          <div className="space-y-4">
            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold text-lg mb-4">Contract Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Contract Address</span>
                  <span className="font-mono text-sm">0x1A51...3dD3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Owner</span>
                  <span className="font-mono text-sm">
                    {contractOwner ? `${contractOwner.slice(0, 6)}...${contractOwner.slice(-4)}` : 'Loading...'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Supply</span>
                  <span className="font-semibold">{formattedTotalSupply} APX</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={isPaused ? 'destructive' : 'default'}>
                    {isPaused ? 'Paused' : 'Active'}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold text-lg mb-4">Contract Controls</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">Contract Status</div>
                    <div className="text-sm text-muted-foreground">
                      {isPaused ? 'Contract is paused - no transfers allowed' : 'Contract is active'}
                    </div>
                  </div>
                  <Button
                    onClick={togglePause}
                    disabled={isPauseToggling || isTokenLoading}
                    variant={isPaused ? 'default' : 'destructive'}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {isPauseToggling ? (
                      'Processing...'
                    ) : isPaused ? (
                      <>
                        <Play className="w-4 h-4" />
                        Unpause
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4" />
                        Pause
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p><strong>Warning:</strong> Pausing the contract will prevent all token transfers, including minting.</p>
                  <p>Only the contract owner can pause/unpause the contract.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Admin;

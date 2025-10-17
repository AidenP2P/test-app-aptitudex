import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/store/useAppStore';
import { Settings, Send, FileText, Users, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAPXToken } from '@/hooks/useAPXToken';
import { useAPXMint, useAPXPause } from '@/hooks/useAPXMint';
import { isAddress } from 'viem';

const Admin = () => {
  const { user, isConnected } = useAppStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'issue' | 'rules' | 'allowlist' | 'contract'>('issue');
  
  // APX Token hooks
  const {
    isAdmin,
    isPaused,
    formattedTotalSupply,
    contractOwner,
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
  
  // Issue reward state
  const [issueAddress, setIssueAddress] = useState('');
  const [issueAmount, setIssueAmount] = useState('');
  const [issueNote, setIssueNote] = useState('');
  
  // Rule state
  const [ruleName, setRuleName] = useState('');
  const [ruleFrequency, setRuleFrequency] = useState<'daily' | 'weekly'>('daily');
  const [ruleBonus, setRuleBonus] = useState('');
  const [ruleActive, setRuleActive] = useState(true);
  
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
  
  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Address added to allowlist');
    setNewAddress('');
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

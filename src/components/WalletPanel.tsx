import { Wallet, Power } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import baseLogoInline from '@/assets/base-logo-inline.png';

export const WalletPanel = () => {
  const { isConnected, user, connectWallet, disconnectWallet } = useAppStore();
  
  if (!isConnected) {
    return (
      <div className="mx-6 mb-6 p-6 bg-card rounded-xl border border-border">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-5 h-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">Connect Your Wallet</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Secure, one-tap connect</p>
          </div>
        </div>
        <Button onClick={connectWallet} className="w-full h-12" size="lg">
          Connect Wallet
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-2">
          Built on Base
          <img src={baseLogoInline} alt="Base" className="h-[1em]" />
        </p>
      </div>
    );
  }
  
  return (
    <div className="mx-6 mb-6 p-6 bg-card rounded-xl border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-mono text-sm">
              {user?.address.slice(0, 6)}...{user?.address.slice(-4)}
            </p>
            <Badge variant="secondary" className="mt-1 text-xs bg-brand text-white">
              Base
            </Badge>
          </div>
        </div>
        <button
          onClick={disconnectWallet}
          className="p-2 hover:bg-muted rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Disconnect wallet"
        >
          <Power className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

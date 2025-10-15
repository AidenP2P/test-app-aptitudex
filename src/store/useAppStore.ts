import { create } from 'zustand';

export interface User {
  address: string;
  isAdmin: boolean;
  streakDays: number;
}

export interface Reward {
  id: string;
  title: string;
  amount: string;
  date: string;
  status: 'earned' | 'claimed';
  rule?: string;
}

export interface Activity {
  id: string;
  type: 'claim' | 'earn' | 'issue';
  amount: string;
  date: string;
  tx?: string;
  description?: string;
}

interface AppStore {
  user: User | null;
  isConnected: boolean;
  kudosBalance: string;
  pendingClaim: string;
  rewards: Reward[];
  activity: Activity[];
  connectWallet: () => void;
  disconnectWallet: () => void;
  claimRewards: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  isConnected: false,
  kudosBalance: '0',
  pendingClaim: '0',
  rewards: [],
  activity: [],
  
  connectWallet: () => {
    // Mock wallet connection
    set({
      isConnected: true,
      user: {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        isAdmin: true,
        streakDays: 5,
      },
      kudosBalance: '1,250',
      pendingClaim: '250',
      rewards: [
        {
          id: 'r1',
          title: 'Peer Kudos',
          amount: '50',
          date: '2025-10-01',
          status: 'earned',
          rule: 'Team Recognition',
        },
        {
          id: 'r2',
          title: 'Sprint Goal',
          amount: '100',
          date: '2025-09-28',
          status: 'claimed',
          rule: 'Sprint Completion',
        },
        {
          id: 'r3',
          title: 'Code Review',
          amount: '75',
          date: '2025-09-25',
          status: 'earned',
          rule: 'Quality Contribution',
        },
        {
          id: 'r4',
          title: 'Daily Streak',
          amount: '25',
          date: '2025-09-20',
          status: 'claimed',
          rule: 'Consistency Bonus',
        },
      ],
      activity: [
        {
          id: 'a1',
          type: 'claim',
          amount: '200',
          date: '2025-10-02',
          tx: '0xabc123...',
          description: 'Claimed pending rewards',
        },
        {
          id: 'a2',
          type: 'earn',
          amount: '50',
          date: '2025-10-01',
          description: 'Peer Kudos from teammate',
        },
        {
          id: 'a3',
          type: 'earn',
          amount: '100',
          date: '2025-09-28',
          description: 'Sprint Goal completed',
        },
        {
          id: 'a4',
          type: 'claim',
          amount: '75',
          date: '2025-09-25',
          tx: '0xdef456...',
          description: 'Claimed weekly rewards',
        },
      ],
    });
  },
  
  disconnectWallet: () => {
    set({
      isConnected: false,
      user: null,
      kudosBalance: '0',
      pendingClaim: '0',
      rewards: [],
      activity: [],
    });
  },
  
  claimRewards: () => {
    set((state) => ({
      kudosBalance: String(Number(state.kudosBalance.replace(',', '')) + Number(state.pendingClaim)),
      pendingClaim: '0',
      activity: [
        {
          id: `a${Date.now()}`,
          type: 'claim',
          amount: state.pendingClaim,
          date: new Date().toISOString().split('T')[0],
          tx: `0x${Math.random().toString(16).slice(2, 10)}...`,
          description: 'Claimed pending rewards',
        },
        ...state.activity,
      ],
    }));
  },
}));

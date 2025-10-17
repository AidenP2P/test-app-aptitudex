import { create } from 'zustand'
import { base } from 'viem/chains'

export interface User {
  address: string;
  isAdmin: boolean;
  streakDays: number;
  // APX-specific data
  apxBalance?: string;
  isAPXOwner?: boolean;
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
  chainId: number;
  // APX-specific state
  apxContractOwner: string | null;
  isContractPaused: boolean;
  setWalletConnection: (address: string, connected: boolean, isAdmin?: boolean) => void;
  setChainId: (chainId: number) => void;
  disconnectWallet: () => void;
  claimRewards: () => void;
  setKudosBalance: (balance: string) => void;
  setPendingClaim: (amount: string) => void;
  // APX-specific actions
  setAPXContractOwner: (owner: string | null) => void;
  setContractPaused: (paused: boolean) => void;
  addTransaction: (transaction: Activity) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  isConnected: false,
  kudosBalance: '0',
  pendingClaim: '0',
  rewards: [],
  activity: [],
  chainId: base.id,
  // APX-specific initial state
  apxContractOwner: null,
  isContractPaused: false,

  setWalletConnection: (address: string, connected: boolean, isAdmin?: boolean) => {
    if (connected) {
      set((state) => ({
        isConnected: true,
        user: {
          address,
          isAdmin: isAdmin || state.apxContractOwner?.toLowerCase() === address.toLowerCase() || false,
          streakDays: 0,
          apxBalance: state.kudosBalance,
          isAPXOwner: state.apxContractOwner?.toLowerCase() === address.toLowerCase(),
        },
      }))
    } else {
      set({
        isConnected: false,
        user: null,
      })
    }
  },

  setChainId: (chainId: number) => {
    set({ chainId })
  },

  disconnectWallet: () => {
    set({
      isConnected: false,
      user: null,
      kudosBalance: '0',
      pendingClaim: '0',
      rewards: [],
      activity: [],
    })
  },

  setKudosBalance: (balance: string) => {
    set({ kudosBalance: balance })
  },

  setPendingClaim: (amount: string) => {
    set({ pendingClaim: amount })
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
    }))
  },

  // APX-specific actions
  setAPXContractOwner: (owner: string | null) => {
    set((state) => ({
      apxContractOwner: owner,
      user: state.user ? {
        ...state.user,
        isAdmin: state.user.address.toLowerCase() === owner?.toLowerCase(),
        isAPXOwner: state.user.address.toLowerCase() === owner?.toLowerCase(),
      } : null,
    }))
  },

  setContractPaused: (paused: boolean) => {
    set({ isContractPaused: paused })
  },

  addTransaction: (transaction: Activity) => {
    set((state) => ({
      activity: [transaction, ...state.activity],
    }))
  },
}))

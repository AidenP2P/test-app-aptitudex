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
  type: 'claim' | 'earn' | 'issue' | 'daily_claim' | 'weekly_claim' | 'streak_bonus' | 'send' | 'burn';
  amount: string;
  date: string;
  tx?: string;
  description?: string;
  // Additional fields for new claim system
  streakDay?: number; // For tracking which day of streak this was
  isStreakBonus?: boolean; // If this is a streak bonus reward
  frequency?: 'daily' | 'weekly'; // For new claim types
  fromAddress?: string; // For transfers
  toAddress?: string; // For transfers
}

// New interface for claim system
export interface ClaimData {
  lastDailyClaim: string | null; // ISO date
  lastWeeklyClaim: string | null; // ISO date
  currentDailyStreak: number;
  currentWeeklyStreak: number;
  totalDailyClaims: number;
  totalWeeklyClaims: number;
  canClaimDaily: boolean;
  canClaimWeekly: boolean;
  nextDailyClaimTime: string | null; // ISO datetime
  nextWeeklyClaimTime: string | null; // ISO datetime
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
  // New claim system state
  claimData: ClaimData;
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
  // New claim system actions
  updateClaimData: (claimData: Partial<ClaimData>) => void;
  addClaimActivity: (type: 'daily_claim' | 'weekly_claim' | 'streak_bonus', amount: string, streakDay?: number) => void;
  clearActivity: () => void;
  setActivity: (activities: Activity[]) => void;
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
  // New claim system initial state
  claimData: {
    lastDailyClaim: null,
    lastWeeklyClaim: null,
    currentDailyStreak: 0,
    currentWeeklyStreak: 0,
    totalDailyClaims: 0,
    totalWeeklyClaims: 0,
    canClaimDaily: true,
    canClaimWeekly: true,
    nextDailyClaimTime: null,
    nextWeeklyClaimTime: null,
  },

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
    set((state) => {
      // Check if transaction already exists to avoid duplicates
      const existingIndex = state.activity.findIndex(
        (existing) => existing.id === transaction.id ||
        (existing.tx && existing.tx === transaction.tx)
      )
      
      if (existingIndex >= 0) {
        // Update existing transaction
        const updatedActivity = [...state.activity]
        updatedActivity[existingIndex] = transaction
        return { activity: updatedActivity }
      } else {
        // Add new transaction
        return { activity: [transaction, ...state.activity] }
      }
    })
  },

  // New claim system actions
  updateClaimData: (newClaimData: Partial<ClaimData>) => {
    set((state) => ({
      claimData: { ...state.claimData, ...newClaimData },
    }))
  },

  addClaimActivity: (type: 'daily_claim' | 'weekly_claim' | 'streak_bonus', amount: string, streakDay?: number) => {
    set((state) => ({
      activity: [
        {
          id: `${type}_${Date.now()}`,
          type,
          amount,
          date: new Date().toISOString(),
          description: type === 'daily_claim'
            ? 'Daily reward claimed'
            : type === 'weekly_claim'
            ? 'Weekly reward claimed'
            : `Streak bonus (${streakDay} ${streakDay === 1 ? 'day' : 'days'})`,
          streakDay,
          isStreakBonus: type === 'streak_bonus',
          frequency: type.includes('daily') ? 'daily' : 'weekly',
        },
        ...state.activity,
      ],
    }))
  },

  clearActivity: () => {
    set({ activity: [] })
  },

  setActivity: (activities: Activity[]) => {
    set({ activity: activities })
  },
}))

# 🎯 APX Claims System - Complete Documentation

## 📋 Overview

The APX Claims system allows users to automatically earn APX tokens through **Daily** and **Weekly** rewards with a progressive **streak** system.

### ✨ Main Features

- **Daily Claims**: 10 APX per day (base)
- **Weekly Claims**: 100 APX per week (base)
- **Streak System**: Progressive bonuses for consecutive claims
- **Multipliers**: Up to +100% bonus after 100 days of streak
- **Cooldowns**: 24h for daily, 7 days for weekly
- **Persistence**: Data saved in localStorage
- **Real-time Interface**: Dynamic countdown timers

## 🏗️ Technical Architecture

### Main Files

```
src/
├── config/claimSystem.ts          # Central configuration
├── services/claimStorage.ts       # localStorage persistence
├── hooks/useClaimSystem.ts        # Main logic hook
├── components/ClaimCard.tsx       # Claim interface
├── components/CountdownTimer.tsx  # Timer components
└── pages/Home.tsx                 # UI integration
```

### Data Structure

```typescript
interface UserClaimData {
  lastDailyClaim: string | null
  lastWeeklyClaim: string | null
  currentDailyStreak: number
  currentWeeklyStreak: number
  totalDailyClaims: number
  totalWeeklyClaims: number
  lifetimeAPXClaimed: string
  streakRecord: {
    longestDailyStreak: number
    longestWeeklyStreak: number
  }
}
```

## 🎮 Usage

### For Users

1. **Wallet Connection**
   - Connect your wallet to the application
   - Claim data is automatically loaded

2. **Daily Claims**
   - Available every 24 hours
   - Base amount: 10 APX
   - Automatic streak bonus

3. **Weekly Claims**
   - Available every 7 days
   - Base amount: 100 APX
   - Higher streak bonus

4. **Streak System**
   - Maintained automatically with regular claims
   - 2-hour grace period after cooldown expiration
   - Bonuses visible in the interface

### For Admins

#### Admin Requirements
- Connected wallet must be the **APX contract owner**
- Admin address configured: `0xF35EeFB35B13d908497BF51Fbc3f0f798f9f93f4`

#### Admin Actions
1. **Automatic minting** during user claims
2. **Amount management** via configuration
3. **Monitoring** claims via logs

## ⚙️ Configuration

### Reward Amounts

```typescript
// File: src/config/claimSystem.ts
export const CLAIM_CONFIG = {
  dailyReward: {
    baseAmount: '10',     // 10 APX per day
    streakMultipliers: {
      7: 1.2,   // +20% after 7 days
      30: 1.5,  // +50% after 30 days
      100: 2.0, // +100% after 100 days
    }
  },
  weeklyReward: {
    baseAmount: '100',    // 100 APX per week
    streakMultipliers: {
      4: 1.25,   // +25% after 4 weeks
      12: 1.5,   // +50% after 12 weeks
      52: 2.0,   // +100% after 52 weeks
    }
  }
}
```

### Cooldowns

```typescript
cooldowns: {
  daily: 24 * 60 * 60 * 1000,      // 24 hours
  weekly: 7 * 24 * 60 * 60 * 1000, // 7 days
}
```

## 🎯 Calculation Examples

### Daily Claims

| Streak | Base APX | Multiplier | Total APX | Bonus |
|--------|----------|------------|-----------|-------|
| 1-6 days | 10 | 1.0x | 10 APX | 0% |
| 7-29 days | 10 | 1.2x | 12 APX | +20% |
| 30-99 days | 10 | 1.5x | 15 APX | +50% |
| 100+ days | 10 | 2.0x | 20 APX | +100% |

### Weekly Claims

| Streak | Base APX | Multiplier | Total APX | Bonus |
|--------|----------|------------|-----------|-------|
| 1-3 weeks | 100 | 1.0x | 100 APX | 0% |
| 4-11 weeks | 100 | 1.25x | 125 APX | +25% |
| 12-51 weeks | 100 | 1.5x | 150 APX | +50% |
| 52+ weeks | 100 | 2.0x | 200 APX | +100% |

## 🎨 User Interface

### Home Page

The Claims interface is integrated directly into the home page:

```
┌─────────────────────────────────┐
│ 🌅 Daily Reward                │
│ ┌─────────────────────────────┐ │
│ │ 💰 12 APX Ready             │ │
│ │ 🔥 Streak: 5 days           │ │
│ │ ⏰ Bonus unlocks in 2 days  │ │
│ └─────────────────────────────┘ │
│ [   CLAIM DAILY REWARD   ] ✨  │
└─────────────────────────────────┘
```

### Visual States

- **🟢 Green**: Claim available
- **🟠 Orange**: Waiting (cooldown active)
- **🔵 Blue**: General information
- **⏰ Timer**: Real-time countdown

## 🔧 API Hooks

### useClaimSystem()

Hook principal pour gérer les claims :

```typescript
const {
  userData,           // Données utilisateur
  availability,       // Disponibilité des claims
  isLoading,         // État de chargement
  claimDaily,        // Fonction claim daily
  claimWeekly,       // Fonction claim weekly
  isAdmin,           // Status admin
  refresh            // Recharger les données
} = useClaimSystem()
```

### useClaimData()

Hook optimisé pour l'affichage uniquement :

```typescript
const {
  userData,
  availability,
  isConnected,
  isAdmin,
  lastUpdate
} = useClaimData()
```

## 🛡️ Security

### Client-Side Validations
- **Strict cooldown**: Temporal verification
- **Spam protection**: Loading states
- **Admin validation**: Permission control

### Blockchain-Side Validations
- **Only admin** can mint APX
- **Amounts validated** before minting
- **Transaction logs** for audit

### Error Handling
- **Wallet not connected** → Error message
- **Insufficient permissions** → Admin required notification
- **Active cooldown** → Timer display
- **Minting failure** → Automatic retry

## 📊 Data Persistence

### localStorage Structure

```json
{
  "aptitudex_claim_data_0x123...": {
    "lastDailyClaim": "2025-01-15T10:30:00Z",
    "lastWeeklyClaim": "2025-01-14T09:00:00Z",
    "currentDailyStreak": 5,
    "currentWeeklyStreak": 2,
    "totalDailyClaims": 45,
    "totalWeeklyClaims": 8,
    "lifetimeAPXClaimed": "1250.5",
    "streakRecord": {
      "longestDailyStreak": 12,
      "longestWeeklyStreak": 4
    },
    "lastUpdated": "2025-01-15T10:30:00Z"
  }
}
```

### Backup/Restore

```typescript
// Export data
const backupData = ClaimStorageService.exportUserData(address)

// Import data
const success = ClaimStorageService.importUserData(address, backupData)
```

## 🚀 Deployment

### Prerequisites
- ✅ APX contract deployed on Base
- ✅ Admin wallet configured
- ✅ Base RPC functional

### Environment Variables
```env
VITE_CHAIN_ID=8453
VITE_RPC_URL=https://mainnet.base.org
VITE_ONCHAINKIT_API_KEY=optional_for_ens
```

### APX Token Configuration
```typescript
// src/config/apxToken.ts
export const APX_TOKEN_CONFIG = {
  address: '0x1A51cC117Ab0f4881Db1260C9344C479D0893dD3',
  adminWallet: '0xF35EeFB35B13d908497BF51Fbc3f0f798f9f93f4',
  chainId: 8453, // Base mainnet
}
```

## 📈 Metrics and Analytics

### Tracked Data
- **Total APX distributed** per period
- **Number of claims** daily/weekly
- **Average user streaks**
- **Retention** via streak system

### Debug Logs
```javascript
// Automatic console logs
🔍 Wallet connected - Address: 0x123...
🔍 ENS Debug - Address: 0x123...
🔍 ENS Detection - Text: username.base.eth
```

## 🛠️ Maintenance

### Automatic Cleanup
```typescript
// Cleans old data (>365 days)
const cleanedCount = ClaimStorageService.cleanupOldData()
```

### Storage Statistics
```typescript
const stats = ClaimStorageService.getStorageStats()
// { totalUsers, totalStorage, oldestEntry, newestEntry }
```

## 🎯 Future Developments

### Upcoming Features
- **Smart Contract Claims**: Onchain logic
- **Referral System**: Bonus for referrers
- **NFT Rewards**: For exceptional streaks
- **Leaderboard**: Community ranking
- **Push Notifications**: Available claims alerts

### Smart Contract Migration
The current system (frontend + minting) can easily migrate to a smart contract:

```solidity
contract APXClaimSystem {
    mapping(address => uint256) public lastDailyClaim;
    mapping(address => uint256) public dailyStreak;
    
    function claimDaily() external {
        // Onchain logic
    }
}
```

---

## 💡 Support

### FAQ

**Q: My streak was reset, why?**
A: A streak resets if more than 26h elapse between two daily claims (24h + 2h grace period).

**Q: Why can't I claim?**
A: Only admin wallets can mint APX. Connect the configured admin wallet.

**Q: Is my data saved?**
A: Yes, in localStorage with export/import possibility.

### Contact
- GitHub Issues for bugs
- Discord for community support

---

**🎉 The APX Claims system is now operational!**
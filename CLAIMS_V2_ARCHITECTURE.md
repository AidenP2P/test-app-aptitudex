# Claims System V2 - Architecture Documentation

## 🏗️ New Architecture

### Smart Contract ClaimDistributor

```solidity
// Main contract for reward distribution
contract ClaimDistributor {
    // Daily/weekly claims management
    function claimDaily() external;
    function claimWeekly() external;
    
    // Administration
    function provision(uint256 amount) external onlyOwner;
    function updateConfig(uint256 dailyAmount, uint256 weeklyAmount, bool enabled) external onlyOwner;
    
    // Views for frontend
    function canClaimDaily(address user) external view returns (bool);
    function getRewardAmounts(address user) external view returns (uint256, uint256);
}
```

**Features:**
- ✅ Autonomous claims without admin intervention
- ✅ Admin provisioning to fund the contract
- ✅ Automatic calculation of streaks and bonuses
- ✅ Dynamic reward configuration
- ✅ Emergency controls

### Coinbase Paymaster Integration

```typescript
// Gasless configuration via Coinbase Developer Platform
const PAYMASTER_CONFIG = {
  rpcUrl: 'https://api.developer.coinbase.com/rpc/v1/base',
  policyId: 'aptitudex-claims-policy',
  sponsorshipMode: 'FULL', // 100% of fees sponsored
  supportedMethods: ['claimDaily', 'claimWeekly']
}
```

**Benefits:**
- ✅ Fully gasless claims for users
- ✅ Configurable sponsoring policies
- ✅ Fallback to normal transactions if necessary
- ✅ Monitoring and sponsoring quotas

### Refactored Frontend

#### Home Page - Overview
```typescript
// Display general statistics only
<MetricCard label="Daily Streak" value={`${streak}d`} />
<MetricCard label="APX Claimed" value={`${totalClaimed}`} />

// Link to dedicated Claims page
<FeatureTile
  title="Daily & Weekly Claims"
  description="Claim your APX rewards (gas-free!)"
  to="/claim"
/>
```

#### Claims Page - Complete interface
```typescript
// Complete interface with new system
const { claimDaily, claimWeekly, isPaymasterEnabled } = useClaimDistributor()

<ClaimCard
  title="Daily Reward"
  description={isPaymasterEnabled ? "Claim daily APX (gas-free!)" : "Claim your daily APX tokens"}
  canClaim={canClaimDaily}
  isAdmin={false} // No more admin restriction
  onClaim={claimDaily}
/>
```

#### Admin Page - Provisioning and configuration
```typescript
// New ClaimDistributor tab
<div className="claims-admin">
  {/* Contract provisioning */}
  <form onSubmit={handleProvision}>
    <Input placeholder="1000000" /> {/* Amount APX */}
    <Button>Provision Contract</Button>
  </form>

  {/* Rewards configuration */}
  <form onSubmit={handleUpdateConfig}>
    <Input value={dailyAmount} /> {/* 10 APX */}
    <Input value={weeklyAmount} /> {/* 100 APX */}
    <Switch checked={enabled} />
  </form>
</div>
```

## 📁 File Structure

### Smart Contracts
```
contracts/
├── ClaimDistributor.sol          # Main distribution contract
└── deployment/
    ├── deploy.js                 # Deployment script
    └── verify.js                 # Basescan verification
```

### Configuration
```
src/config/
├── claimDistributor.ts           # ABI and contract configuration
├── paymaster.ts                  # Coinbase Paymaster configuration
└── chains.ts                     # Base network configuration
```

### React Hooks
```
src/hooks/
├── useClaimDistributor.ts        # Main Smart Contract hook
├── usePaymaster.ts               # Gasless transactions hook
└── legacy/
    └── useClaimSystem.ts         # Old system (deprecated)
```

### Refactored Pages
```
src/pages/
├── Home.tsx                      # General stats + links
├── Claim.tsx                     # Complete claims interface
└── Admin.tsx                     # Provisioning + configuration
```

## 🚀 Deployment Guide

### Step 1: Smart Contract Deployment

```bash
# Contract compilation
npx hardhat compile

# Deployment on Base Mainnet
npx hardhat run scripts/deploy.js --network base

# Verification on Basescan
npx hardhat verify --network base <CONTRACT_ADDRESS> <APX_TOKEN_ADDRESS> <OWNER_ADDRESS>
```

### Step 2: Coinbase Paymaster Configuration

```bash
# Environment variables
VITE_COINBASE_PAYMASTER_RPC=https://api.developer.coinbase.com/rpc/v1/base
VITE_COINBASE_POLICY_ID=aptitudex-claims-policy
VITE_COINBASE_API_KEY=cdp_...
VITE_COINBASE_PROJECT_ID=...
```

### Step 3: Frontend Update

1. **Update contract address**
```typescript
// src/config/claimDistributor.ts
export const CLAIM_DISTRIBUTOR_CONFIG = {
  contractAddress: '0x...' as Address, // Deployed address
  abi: [...] // Generated ABI
}
```

2. **Test integration**
```bash
npm run dev
# Verify gasless claims locally
```

### Step 4: Initial Provisioning

1. **Admin connection to frontend**
2. **Initial APX token mint (e.g., 10M APX)**
3. **ClaimDistributor provision (e.g., 1M APX)**
4. **Rewards configuration (10 APX daily, 100 APX weekly)**
5. **Claims activation**

## 🔄 Migration from V1

### Database
- ✅ **localStorage**: Compatible, no migration required
- ✅ **Streaks**: Preserved via existing grace system
- ✅ **History**: Maintained in local state

### Existing contracts
- ✅ **APX Token**: No changes required
- ✅ **Admin permissions**: Preserved for provisioning
- ✅ **Legacy claims**: Remain available during transition

### User interface
- ✅ **Navigation**: Existing Claims menu redirects to new interface
- ✅ **Components**: ClaimCard and CountdownTimer reused
- ✅ **Styling**: Consistent design with existing

## 📊 Metrics and Monitoring

### Smart Contract Events
```solidity
event DailyClaimed(address indexed user, uint256 amount, uint256 streak, uint256 bonusPercent);
event WeeklyClaimed(address indexed user, uint256 amount, uint256 streak, uint256 bonusPercent);
event Provisioned(address indexed admin, uint256 amount, uint256 newBalance);
event ConfigUpdated(uint256 dailyAmount, uint256 weeklyAmount, bool enabled);
```

### Frontend Analytics
```typescript
// Gasless claims tracking
analytics.track('claim_daily', {
  amount: rewardAmount,
  streak: currentStreak,
  gasless: isPaymasterEnabled,
  txHash: transactionHash
})
```

### Admin Dashboards
- **Contract Balance**: Real-time monitoring
- **Claims per Day**: Usage statistics
- **Paymaster Usage**: Sponsoring costs
- **User Engagement**: Streaks and retention

## 🔒 Security

### Smart Contract
- ✅ **OpenZeppelin**: ReentrancyGuard, Ownable
- ✅ **Access Control**: Admin functions protected
- ✅ **Emergency Controls**: Pause and withdrawal
- ✅ **Input Validation**: All parameters validated

### Frontend
- ✅ **Type Safety**: Strict TypeScript
- ✅ **Address Validation**: viem address checks
- ✅ **Error Handling**: Graceful fallbacks
- ✅ **Rate Limiting**: Cooldowns respected

### Paymaster
- ✅ **Policy Limits**: Gas limits and quotas
- ✅ **Method Whitelist**: Only claims sponsored
- ✅ **User Validation**: Anti-spam protections

## 🎯 Expected Results

### User Experience
- **Frictionless claims**: 0 gas fees for users
- **Dedicated interface**: Centralized Claims page
- **Accessibility**: All wallets can claim
- **Performance**: Fast transactions via Paymaster

### Scalability
- **Automatic distribution**: No more manual intervention
- **Flexible provisioning**: Admin can adjust rewards
- **Integrated monitoring**: Visibility on usage and costs

### Adoption
- **Reduced entry barrier**: No gas fees
- **Increased engagement**: Motivating streaks and bonuses
- **Active community**: Daily/weekly claims

## 📞 Support and Maintenance

### Contact points
- **Smart Contract**: Upgradeable via proxy if necessary
- **Paymaster**: Coinbase Developer Platform support
- **Frontend**: Monitoring via Vercel/Netlify

### Emergency procedures
1. **Disable claims**: Admin can disable via toggle
2. **Withdraw funds**: Emergency withdrawal function
3. **Fallback mode**: Normal claims if Paymaster unavailable

---
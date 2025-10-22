# SpecialRewardsDistributor Initialization Guide

## 🎯 Deployed Contract

**Address:** `0xb2a507877F5F3c593ee3BeaAc0ff92161D28775C`
**Balance:** 2,000,000 APX ✅
**Status:** Ready to be initialized

## 📋 Initialization Steps

### **Step 1: Create "Alpha Launch" Reward**

```typescript
// Smart contract call
await specialRewardsDistributor.createSpecialReward(
  "0x616c7068616c61756e63680000000000000000000000000000000000000000", // alphalaunch
  ethers.parseEther("50"),           // 50 APX
  Math.floor(Date.now() / 1000),    // startTime (now)
  Math.floor(new Date('2025-12-31').getTime() / 1000), // endTime
  "base_batches",                    // rewardType
  JSON.stringify({                   // requirements
    name: "Celebrate Alpha version launch for Base Community",
    description: "Exclusive reward for you as first users of this app!",
    type: "one_time",
    eligibility: "alpha_user"
  }),
  0 // maxClaims (0 = unlimited)
)
```

### **Step 2: Create "Devfolio Like" Reward**

```typescript
await specialRewardsDistributor.createSpecialReward(
  "0x6465766f666f6c696f6c696b65000000000000000000000000000000000000", // devfoliolike
  ethers.parseEther("1000"),         // 1000 APX
  Math.floor(Date.now() / 1000),    // startTime (now)
  Math.floor(new Date('2024-10-24').getTime() / 1000), // endTime
  "social",                          // rewardType
  JSON.stringify({                   // requirements
    name: "Support us on Devfolio",
    description: "Like our project in the context of Base Batches 002 Builder and get rewarded!",
    type: "social_action",
    action: "like_devfolio",
    url: "https://devfolio.co/projects/kudos-protocol-d7e4",
    verification: "self_declared"
  }),
  0 // maxClaims (0 = unlimited)
)
```

## 🛠️ Administration Interface

To facilitate initialization, here are the exact calls to make via your admin interface:

### **Alpha Launch Parameters:**
- **rewardId:** `0x616c7068616c61756e63680000000000000000000000000000000000000000`
- **amount:** `50000000000000000000` (50 * 10^18)
- **startTime:** `1729449600` (current timestamp)
- **endTime:** `1735689600` (31/12/2025)
- **rewardType:** `"base_batches"`
- **requirements:** `{"name":"Celebrate Alpha version launch for Base Community","description":"Exclusive reward for you as first users of this app!","type":"one_time","eligibility":"alpha_user"}`
- **maxClaims:** `0`

### **Devfolio Like Parameters:**
- **rewardId:** `0x6465766f666f6c696f6c696b65000000000000000000000000000000000000`
- **amount:** `1000000000000000000000` (1000 * 10^18)
- **startTime:** `1729449600` (current timestamp)
- **endTime:** `1729814400` (24/10/2024)
- **rewardType:** `"social"`
- **requirements:** `{"name":"Support us on Devfolio","description":"Like our project in the context of Base Batches 002 Builder and get rewarded!","type":"social_action","action":"like_devfolio","url":"https://devfolio.co/projects/kudos-protocol-d7e4","verification":"self_declared"}`
- **maxClaims:** `0`

## 🔍 Verification

After creating the rewards, you can verify with:

```typescript
// Check number of active rewards
const count = await specialRewardsDistributor.getActiveRewardsCount()
console.log(`Active rewards: ${count}`) // Should be 2

// List all reward IDs
const rewardIds = await specialRewardsDistributor.getAllActiveRewardIds()
console.log('Reward IDs:', rewardIds)

// Check reward details
const alphaDetails = await specialRewardsDistributor.getRewardDetails(
  "0x616c7068616c61756e63680000000000000000000000000000000000000000"
)
console.log('Alpha Launch details:', alphaDetails)
```

## 🚀 Once Initialized

After initialization, the app will be **fully functional**:

1. ✅ Users will see the 2 rewards in the Rewards page
2. ✅ They will be able to claim via the interface
3. ✅ Transactions will be real on Base
4. ✅ APX tokens will be distributed automatically
5. ✅ Claims tracking will be done on-chain

## 📊 Monitoring

Monitor these events for tracking:

- `SpecialRewardCreated`: Rewards created
- `SpecialRewardClaimed`: Claims made
- Contract balance: `getContractBalance()`

## ⚠️ Important

Once the rewards are created, the app will automatically switch from simulation mode to real smart contract mode!
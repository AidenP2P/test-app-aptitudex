# 🔧 Coinbase Paymaster Configuration - Complete Guide

## 📋 **Steps to Get Your Policy ID**

### **1. Access the Coinbase Developer Platform Portal**
```bash
1. Go to: https://portal.cdp.coinbase.com/
2. Sign in with your Coinbase account
3. Create a new project if necessary
```

### **2. Create a Sponsoring Policy**
```bash
Navigation: Projects → Your Project → Paymaster → Policies

1. Click "Create Policy"
2. Name: "AptitudeX Claims Policy"
3. Description: "Sponsoring daily/weekly APX claims"
4. Type: "Full Sponsorship"
```

### **3. Configure Policy Restrictions**
```json
{
  "name": "AptitudeX Claims Policy",
  "sponsorshipType": "FULL",
  "gasLimits": {
    "maxGasPerTransaction": 300000,
    "maxTransactionsPerDay": 2
  },
  "allowedContracts": [
    "0x9Af5dFD8903968D6d0e20e741fB0737E6de67a97"
  ],
  "allowedMethods": [
    "claimDaily",
    "claimWeekly"
  ]
}
```

### **4. Retrieve Identifiers**
After creating the policy, you will get:
- ✅ **Policy ID** (e.g., `pol_abc123def456`)
- ✅ **API Key** (in Settings → API Keys)
- ✅ **Project ID** (in Project Settings)

## 🔑 **Configuration in .env**

```env
# Replace with your real values from the CDP portal
VITE_COINBASE_POLICY_ID=pol_your_real_policy_id_here
VITE_COINBASE_API_KEY=cdp_your_real_api_key_here
VITE_COINBASE_PROJECT_ID=your_real_project_id_here
```

## 🧪 **Test vs Production Mode**

### **Option 1: Tests WITHOUT Paymaster (recommended to start)**
```env
# Leave empty to use normal transactions with gas
VITE_COINBASE_POLICY_ID=
VITE_COINBASE_API_KEY=
VITE_COINBASE_PROJECT_ID=
```

### **Option 2: Tests WITH Paymaster (after CDP configuration)**
```env
# Use your real values from the CDP portal
VITE_COINBASE_POLICY_ID=pol_abc123def456
VITE_COINBASE_API_KEY=cdp_xyz789ghi012
VITE_COINBASE_PROJECT_ID=proj-456def789ghi
```

## 📍 **Useful Links**

- **CDP Portal**: https://portal.cdp.coinbase.com/
- **Paymaster Documentation**: https://docs.cdp.coinbase.com/paymaster/
- **Base Mainnet RPC**: https://api.developer.coinbase.com/rpc/v1/base

## ⚠️ **Important Notes**

1. **Policy IDs are NOT visible by default** - you need to create them
2. **Base Mainnet** requires a real Policy (no testnet)
3. **Quotas**: Check your CDP plan limits
4. **Billing**: Gasless transactions are billed to your CDP account

## 🚀 **Recommendation**

**For now, test first WITHOUT Paymaster:**
1. Leave the Paymaster variables empty in .env
2. Test the /claim interface with normal transactions (with gas)
3. Configure the Paymaster later once everything works

The system works perfectly with or without Paymaster! 🎯
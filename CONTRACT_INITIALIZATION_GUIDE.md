# Guide d'Initialisation du SpecialRewardsDistributor

## 🎯 Contract Déployé

**Adresse :** `0xb2a507877F5F3c593ee3BeaAc0ff92161D28775C`  
**Balance :** 2,000,000 APX ✅  
**Status :** Prêt à être initialisé

## 📋 Étapes d'Initialisation

### **Étape 1 : Créer le Reward "Alpha Launch"**

```typescript
// Appel au smart contract
await specialRewardsDistributor.createSpecialReward(
  "0x616c7068616c61756e63680000000000000000000000000000000000000000", // alphalaunch
  ethers.parseEther("50"),           // 50 APX
  Math.floor(Date.now() / 1000),    // startTime (maintenant)
  Math.floor(new Date('2025-12-31').getTime() / 1000), // endTime
  "base_batches",                    // rewardType
  JSON.stringify({                   // requirements
    name: "Celebrate Alpha version launch for Base Community",
    description: "Exclusive reward for you as first users of this app!",
    type: "one_time",
    eligibility: "alpha_user"
  }),
  0 // maxClaims (0 = illimité)
)
```

### **Étape 2 : Créer le Reward "Devfolio Like"**

```typescript
await specialRewardsDistributor.createSpecialReward(
  "0x6465766f666f6c696f6c696b65000000000000000000000000000000000000", // devfoliolike
  ethers.parseEther("1000"),         // 1000 APX
  Math.floor(Date.now() / 1000),    // startTime (maintenant)
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
  0 // maxClaims (0 = illimité)
)
```

## 🛠️ Interface d'Administration

Pour faciliter l'initialisation, voici les appels exact à faire via votre interface admin :

### **Parametres Alpha Launch :**
- **rewardId :** `0x616c7068616c61756e63680000000000000000000000000000000000000000`
- **amount :** `50000000000000000000` (50 * 10^18)
- **startTime :** `1729449600` (timestamp actuel)
- **endTime :** `1735689600` (31/12/2025)
- **rewardType :** `"base_batches"`
- **requirements :** `{"name":"Celebrate Alpha version launch for Base Community","description":"Exclusive reward for you as first users of this app!","type":"one_time","eligibility":"alpha_user"}`
- **maxClaims :** `0`

### **Parametres Devfolio Like :**
- **rewardId :** `0x6465766f666f6c696f6c696b65000000000000000000000000000000000000`
- **amount :** `1000000000000000000000` (1000 * 10^18)
- **startTime :** `1729449600` (timestamp actuel)
- **endTime :** `1729814400` (24/10/2024)
- **rewardType :** `"social"`
- **requirements :** `{"name":"Support us on Devfolio","description":"Like our project in the context of Base Batches 002 Builder and get rewarded!","type":"social_action","action":"like_devfolio","url":"https://devfolio.co/projects/kudos-protocol-d7e4","verification":"self_declared"}`
- **maxClaims :** `0`

## 🔍 Vérification

Après avoir créé les rewards, vous pouvez vérifier avec :

```typescript
// Vérifier le nombre de rewards actifs
const count = await specialRewardsDistributor.getActiveRewardsCount()
console.log(`Active rewards: ${count}`) // Devrait être 2

// Lister tous les reward IDs
const rewardIds = await specialRewardsDistributor.getAllActiveRewardIds()
console.log('Reward IDs:', rewardIds)

// Vérifier les détails d'un reward
const alphaDetails = await specialRewardsDistributor.getRewardDetails(
  "0x616c7068616c61756e63680000000000000000000000000000000000000000"
)
console.log('Alpha Launch details:', alphaDetails)
```

## 🚀 Une fois initialisé

Après l'initialisation, l'app sera **entièrement fonctionnelle** :

1. ✅ Les utilisateurs verront les 2 rewards dans la page Rewards
2. ✅ Ils pourront claimer via l'interface
3. ✅ Les transactions seront réelles sur Base
4. ✅ Les tokens APX seront distribués automatiquement
5. ✅ Le tracking des claims sera fait on-chain

## 📊 Monitoring

Surveillez ces events pour monitoring :

- `SpecialRewardCreated` : Rewards créés
- `SpecialRewardClaimed` : Claims effectués
- Balance du contract : `getContractBalance()`

## ⚠️ Important

Une fois les rewards créés, l'app basculera automatiquement du mode simulation vers le mode réel smart contract !
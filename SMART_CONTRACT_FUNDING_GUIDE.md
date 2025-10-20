# Guide d'Alimentation du SpecialRewardsDistributor

## 🔄 Processus d'Alimentation

### **Étape 1 : Prérequis Admin**
```typescript
// Vérifications nécessaires avant alimentation
✅ Vous êtes le owner du contract SpecialRewardsDistributor
✅ Vous avez suffisamment de tokens APX dans votre wallet admin
✅ Le contract APX token est déployé et fonctionnel
```

### **Étape 2 : Approval des Tokens APX**
```typescript
// D'abord, approuver le contract à dépenser vos tokens APX
await apxTokenContract.approve(
  specialRewardsDistributorAddress, 
  amountToProvision // ex: ethers.parseEther("10000") pour 10,000 APX
)
```

### **Étape 3 : Provisionner le Contract**
```typescript
// Ensuite, appeler la fonction provision
await specialRewardsDistributor.provision(amountToProvision)

// Le contract fait automatiquement :
// 1. transferFrom(admin, contract, amount)
// 2. Stocke les tokens dans le contract
// 3. Émet un event Provisioned(admin, amount, newBalance)
```

## 💰 Fonctions de Gestion des Fonds

### **📥 provision(uint256 amount)**
```solidity
function provision(uint256 amount) external onlyOwner {
    require(amount > 0, "Amount must be greater than 0");
    require(apxToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    
    uint256 newBalance = apxToken.balanceOf(address(this));
    emit Provisioned(msg.sender, amount, newBalance);
}
```

**Utilisation :**
- Alimenter le contract avec des tokens APX
- Seul l'owner peut appeler cette fonction
- Nécessite une approval préalable du token APX

### **📊 getContractBalance()**
```solidity
function getContractBalance() external view returns (uint256) {
    return apxToken.balanceOf(address(this));
}
```

**Utilisation :**
- Vérifier combien de tokens APX sont disponibles dans le contract
- Fonction view (lecture seule)
- Accessible à tous

### **🚨 emergencyWithdraw(uint256 amount)**
```solidity
function emergencyWithdraw(uint256 amount) external onlyOwner {
    uint256 balance = apxToken.balanceOf(address(this));
    require(amount <= balance, "Insufficient balance");
    require(apxToken.transfer(msg.sender, amount), "Transfer failed");
    
    emit EmergencyWithdraw(msg.sender, amount);
}
```

**Utilisation :**
- Récupérer des fonds en cas d'urgence
- Seul l'owner peut appeler cette fonction
- Transfer direct du contract vers le wallet admin

## 📋 Workflow Complet de Déploiement

### **Phase 1 : Déploiement**
```bash
# 1. Déployer le contract SpecialRewardsDistributor
# Paramètres constructor: (apxTokenAddress, ownerAddress)

# 2. Vérifier le déploiement
npx hardhat verify --network base CONTRACT_ADDRESS APX_TOKEN_ADDRESS OWNER_ADDRESS
```

### **Phase 2 : Configuration Initiale**
```typescript
// 1. Créer les rewards prédéfinis
await specialRewardsDistributor.createSpecialReward(
  "0x616c7068616c61756e63680000000000000000000000000000000000000000", // alphalaunch
  ethers.parseEther("50"),     // 50 APX
  Math.floor(Date.now() / 1000), // startTime (maintenant)
  Math.floor(new Date('2025-12-31').getTime() / 1000), // endTime
  "base_batches",              // rewardType
  JSON.stringify({             // requirements
    name: "Celebrate Alpha version launch for Base Community",
    description: "Exclusive reward for you as first users of this app!",
    type: "one_time",
    eligibility: "alpha_user"
  }),
  0 // maxClaims (0 = illimité)
)

await specialRewardsDistributor.createSpecialReward(
  "0x6465766f666f6c696f6c696b65000000000000000000000000000000000000", // devfoliolike
  ethers.parseEther("1000"),   // 1000 APX
  Math.floor(Date.now() / 1000),
  Math.floor(new Date('2024-10-24').getTime() / 1000),
  "social",
  JSON.stringify({
    name: "Support us on Devfolio",
    description: "Like our project in the context of Base Batches 002 Builder and get rewarded!",
    type: "social_action",
    action: "like_devfolio",
    url: "https://devfolio.co/projects/kudos-protocol-d7e4",
    verification: "self_declared"
  }),
  0
)
```

### **Phase 3 : Alimentation**
```typescript
// 1. Calculer le montant nécessaire
const totalNeeded = 
  (50 * expectedAlphaUsers) +     // Alpha launch rewards
  (1000 * expectedDevfolioLikes)  // Devfolio rewards

// Ex: 100 users alpha + 50 likes = 5,000 + 50,000 = 55,000 APX

// 2. Approve + Provision
await apxToken.approve(specialRewardsDistributor.address, ethers.parseEther("55000"))
await specialRewardsDistributor.provision(ethers.parseEther("55000"))

// 3. Vérifier
const balance = await specialRewardsDistributor.getContractBalance()
console.log(`Contract balance: ${ethers.formatEther(balance)} APX`)
```

## 🔧 Interface Admin Frontend

### **Hook de Gestion Admin**
```typescript
// src/hooks/useSpecialRewardsAdmin.ts
export function useSpecialRewardsAdmin() {
  const { writeContract } = useWriteContract()
  
  const provisionContract = async (amount: string) => {
    // 1. D'abord approve
    await writeContract({
      address: APX_TOKEN_ADDRESS,
      abi: APX_TOKEN_ABI,
      functionName: 'approve',
      args: [SPECIAL_REWARDS_DISTRIBUTOR_ADDRESS, parseEther(amount)]
    })
    
    // 2. Puis provision
    await writeContract({
      address: SPECIAL_REWARDS_DISTRIBUTOR_ADDRESS,
      abi: SPECIAL_REWARDS_DISTRIBUTOR_ABI,
      functionName: 'provision',
      args: [parseEther(amount)]
    })
  }
  
  return { provisionContract }
}
```

### **Panel Admin**
```tsx
// Composant pour la gestion admin
function AdminSpecialRewardsPanel() {
  const [provisionAmount, setProvisionAmount] = useState('')
  const { provisionContract, contractBalance } = useSpecialRewardsAdmin()
  
  return (
    <div className="space-y-4">
      <div>
        <label>Contract Balance: {contractBalance} APX</label>
      </div>
      
      <div>
        <input 
          value={provisionAmount}
          onChange={(e) => setProvisionAmount(e.target.value)}
          placeholder="Amount to provision (APX)"
        />
        <button onClick={() => provisionContract(provisionAmount)}>
          Provision Contract
        </button>
      </div>
    </div>
  )
}
```

## 💡 Recommandations

### **Montants Suggérés**
```typescript
// Estimation basée sur vos rewards actuels
const estimations = {
  alphaLaunchReward: 50,        // APX par user
  devfolioReward: 1000,         // APX par like
  
  // Estimations conservatrices
  expectedAlphaUsers: 200,      // 200 early users
  expectedDevfolioLikes: 100,   // 100 likes
  
  // Total nécessaire
  totalRequired: (50 * 200) + (1000 * 100), // 110,000 APX
  
  // Avec marge de sécurité 20%
  recommendedProvision: 132000  // 132,000 APX
}
```

### **Monitoring**
```typescript
// Events à surveiller
contract.on('SpecialRewardClaimed', (user, rewardId, amount) => {
  console.log(`${user} claimed ${ethers.formatEther(amount)} APX for reward ${rewardId}`)
})

contract.on('Provisioned', (admin, amount, newBalance) => {
  console.log(`Contract provisioned with ${ethers.formatEther(amount)} APX. New balance: ${ethers.formatEther(newBalance)}`)
})
```

## 🚨 Sécurité

### **Points d'Attention**
1. **Owner Security** : Le wallet owner doit être ultra-sécurisé (multisig recommandé)
2. **Provision Monitoring** : Surveiller les balances pour éviter les ruptures
3. **Emergency Funds** : Garder toujours accès aux fonctions d'emergency withdraw
4. **Rate Limiting** : Le contract empêche les double-claims automatiquement

### **Backup Plan**
```typescript
// En cas de problème, récupérer les fonds
await specialRewardsDistributor.emergencyWithdraw(
  await specialRewardsDistributor.getContractBalance()
)
```

## ✅ Résumé

**Oui, vous avez raison :** Vous devez alimenter le contract manuellement avec vos tokens APX depuis votre compte admin, et ensuite le contract se débrouille pour distribuer aux utilisateurs qui claim les rewards.

Le processus est sécurisé et vous gardez le contrôle total avec les fonctions admin.
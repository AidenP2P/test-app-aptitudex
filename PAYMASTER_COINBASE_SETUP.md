# Configuration Paymaster Coinbase - Guide Complet

## 🎯 Objectif
Configurer le Paymaster Coinbase pour permettre des transactions gasless sur Base pour les claims APX.

## 📋 Prérequis

### Comptes et accès
- ✅ Compte [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
- ✅ Wallet admin avec APX tokens sur Base Mainnet
- ✅ Smart Contract ClaimDistributor déployé

### Informations nécessaires
- **Adresse ClaimDistributor**: `0x...` (obtenue après déploiement)
- **Adresse APX Token**: `0x1A51...` (votre token existant)
- **Wallet admin**: Adresse du propriétaire

## 🚀 Étape 1: Configuration Coinbase Developer Platform

### 1.1 Créer un projet
1. Se connecter sur [CDP Portal](https://portal.cdp.coinbase.com/)
2. **Create Project** → "AptitudeX Claims"
3. **Blockchain**: Base Mainnet
4. **Use Case**: Smart Account & Paymaster

### 1.2 Configurer les API Keys
```bash
# Dans le dashboard CDP
1. Project Settings → API Keys
2. Create New API Key
3. Permissions: "Paymaster Operations", "Smart Accounts"
4. Noter les valeurs:
   - API_KEY: cdp_...
   - PROJECT_ID: ...
   - PRIVATE_KEY: ... (pour signer les sponsorships)
```

### 1.3 Configurer Paymaster Policy
```json
{
  "name": "AptitudeX Claims Policy",
  "description": "Sponsoring des claims daily/weekly APX",
  "rules": {
    "gasLimits": {
      "maxGasPerTx": 300000,
      "maxGasPerDay": 10000000
    },
    "allowedMethods": [
      "claimDaily",
      "claimWeekly"
    ],
    "allowedContracts": [
      "0x..." // Adresse du ClaimDistributor
    ],
    "userLimits": {
      "maxTxPerDay": 2,
      "cooldownBetweenTx": 3600
    }
  },
  "budget": {
    "dailyBudgetUSD": 100,
    "monthlyBudgetUSD": 3000
  }
}
```

## 🔧 Étape 2: Configuration Frontend

### 2.1 Variables d'environnement
Créer/mettre à jour le fichier `.env`:

```bash
# Coinbase Developer Platform
VITE_COINBASE_PAYMASTER_RPC=https://api.developer.coinbase.com/rpc/v1/base
VITE_COINBASE_API_KEY=cdp_your_api_key_here
VITE_COINBASE_PROJECT_ID=your_project_id_here
VITE_COINBASE_POLICY_ID=your_policy_id_here

# Smart Contract (après déploiement)
VITE_CLAIM_DISTRIBUTOR_ADDRESS=0x_your_deployed_contract_address

# APX Token (existant)
VITE_APX_TOKEN_ADDRESS=0x1A51B19BC7b...
```

### 2.2 Mettre à jour la configuration
Modifier `src/config/claimDistributor.ts`:

```typescript
// Remplacer l'adresse par celle du contract déployé
export const CLAIM_DISTRIBUTOR_CONFIG = {
  contractAddress: import.meta.env.VITE_CLAIM_DISTRIBUTOR_ADDRESS as Address,
  abi: [...] // ABI inchangé
}
```

Modifier `src/config/paymaster.ts`:

```typescript
export const PAYMASTER_CONFIG: PaymasterConfig = {
  rpcUrl: import.meta.env.VITE_COINBASE_PAYMASTER_RPC,
  policyId: import.meta.env.VITE_COINBASE_POLICY_ID,
  apiKey: import.meta.env.VITE_COINBASE_API_KEY,
  projectId: import.meta.env.VITE_COINBASE_PROJECT_ID,
  // ... reste inchangé
}
```

## 🧪 Étape 3: Tester la configuration

### 3.1 Test basique du Paymaster
```bash
# Dans le terminal du projet
npm run dev

# Ouvrir la console browser et tester:
```

```javascript
// Test de connectivité Paymaster
const testPaymaster = async () => {
  const response = await fetch('/api/paymaster/status', {
    headers: {
      'Authorization': `Bearer ${process.env.VITE_COINBASE_API_KEY}`,
      'X-Project-ID': process.env.VITE_COINBASE_PROJECT_ID
    }
  });
  console.log('Paymaster Status:', await response.json());
};

testPaymaster();
```

### 3.2 Test de sponsoring
1. **Connecter wallet** sur l'app
2. **Aller sur /claim**
3. **Vérifier** que le badge "Gas-free Claims" apparaît
4. **Tenter un claim** → doit déclencher le sponsoring

## 📊 Étape 4: Monitoring et ajustements

### 4.1 Dashboard CDP
Surveiller dans le Coinbase Developer Portal:
- **Gas Usage**: Consommation quotidienne
- **Transaction Volume**: Nombre de claims sponsorisés
- **Policy Violations**: Tentatives bloquées
- **Budget Tracking**: Coûts en USD

### 4.2 Logs frontend
Ajouter du logging pour surveiller:

```typescript
// Dans usePaymaster.ts
const sponsorTransaction = useCallback(async (contractAddress, functionName, args) => {
  console.log('🎯 Sponsoring attempt:', {
    contract: contractAddress,
    method: functionName,
    user: address,
    timestamp: new Date().toISOString()
  });
  
  const result = await requestSponsorship(sponsorRequest);
  
  if (result.success) {
    console.log('✅ Sponsorship successful:', result.sponsorshipData);
    analytics.track('paymaster_success', {
      method: functionName,
      gasEstimate: gasEstimate.toString(),
      user: address
    });
  } else {
    console.error('❌ Sponsorship failed:', result.error);
    analytics.track('paymaster_error', {
      method: functionName,
      error: result.error,
      user: address
    });
  }
  
  return result;
}, []);
```

## 🔒 Étape 5: Sécurité et limites

### 5.1 Protection anti-spam
```json
{
  "userLimits": {
    "maxDailyClaimsPerUser": 1,
    "maxWeeklyClaimsPerUser": 1,
    "cooldownBetweenClaims": 24, // heures
    "blacklist": [] // Adresses bloquées
  }
}
```

### 5.2 Monitoring des coûts
```typescript
// Alert si budget dépassé
const checkBudget = async () => {
  const response = await fetch('/api/paymaster/budget');
  const budget = await response.json();
  
  if (budget.dailySpent > budget.dailyLimit * 0.8) {
    console.warn('🚨 Budget alert: 80% spent');
    // Notifier l'admin
  }
};
```

## 🛠️ Étape 6: API Routes (optionnel)

Si besoin d'un backend pour gérer le Paymaster:

```typescript
// pages/api/paymaster/sponsor.ts
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { to, data, from, gasLimit } = req.body;
  
  // Validation des paramètres
  if (!isAddress(to) || !isAddress(from)) {
    return res.status(400).json({ error: 'Invalid address' });
  }
  
  // Requête vers Coinbase Paymaster
  const sponsorResponse = await fetch('https://api.developer.coinbase.com/rpc/v1/base', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.COINBASE_API_KEY}`,
      'X-Project-ID': process.env.COINBASE_PROJECT_ID
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'pm_sponsorUserOperation',
      params: [{
        sender: from,
        target: to,
        data: data,
        gasLimit: gasLimit,
        policyId: process.env.COINBASE_POLICY_ID
      }]
    })
  });
  
  const result = await sponsorResponse.json();
  res.json(result);
}
```

## ✅ Checklist de validation

### Avant la mise en production:
- [ ] **API Keys** configurées et fonctionnelles
- [ ] **Policy** créée avec les bonnes limites
- [ ] **Budget** défini et monitoring activé
- [ ] **Frontend** mis à jour avec les nouvelles variables
- [ ] **Tests** de sponsoring réussis en développement
- [ ] **Fallback** vers transactions normales testé
- [ ] **Logs** et analytics en place

### Après la mise en production:
- [ ] **Monitor** le dashboard CDP quotidiennement
- [ ] **Ajuster** les limites selon l'usage réel
- [ ] **Backup plan** si le Paymaster est indisponible
- [ ] **Documentation** utilisateur sur les claims gasless

## 🚨 Troubleshooting

### Erreurs courantes:

**"Paymaster not configured"**
→ Vérifier les variables d'environnement

**"Policy violation"**
→ Vérifier les limites de gas et méthodes autorisées

**"Budget exceeded"**
→ Augmenter le budget ou attendre le reset quotidien

**"Network error"**
→ Vérifier la connectivité vers l'API Coinbase

### Commandes de debug:
```bash
# Tester les variables d'environnement
echo $VITE_COINBASE_API_KEY

# Vérifier la configuration
npm run build && npm run preview

# Logs détaillés
DEBUG=paymaster npm run dev
```

---

**🎉 Une fois cette configuration terminée, on passe à l'étape 3: Provisioning du contract !**
# 🔧 Configuration Coinbase Paymaster - Guide Complet

## 📋 **Étapes pour obtenir votre Policy ID**

### **1. Accéder au Portail Coinbase Developer Platform**
```bash
1. Aller sur: https://portal.cdp.coinbase.com/
2. Se connecter avec votre compte Coinbase
3. Créer un nouveau projet si nécessaire
```

### **2. Créer une Policy de Sponsoring**
```bash
Navigation: Projects → Votre Projet → Paymaster → Policies

1. Cliquer "Create Policy"
2. Nommer: "AptitudeX Claims Policy"  
3. Description: "Sponsoring des claims daily/weekly APX"
4. Type: "Full Sponsorship"
```

### **3. Configurer les Restrictions de Policy**
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

### **4. Récupérer les Identifiants**
Après création de la policy, vous obtiendrez :
- ✅ **Policy ID** (ex: `pol_abc123def456`)
- ✅ **API Key** (dans Settings → API Keys)
- ✅ **Project ID** (dans Project Settings)

## 🔑 **Configuration dans .env**

```env
# Remplacer avec vos vraies valeurs du portail CDP
VITE_COINBASE_POLICY_ID=pol_your_real_policy_id_here
VITE_COINBASE_API_KEY=cdp_your_real_api_key_here
VITE_COINBASE_PROJECT_ID=your_real_project_id_here
```

## 🧪 **Mode Test vs Production**

### **Option 1: Tests SANS Paymaster (recommandé pour commencer)**
```env
# Laisser vide pour utiliser les transactions normales avec gas
VITE_COINBASE_POLICY_ID=
VITE_COINBASE_API_KEY=
VITE_COINBASE_PROJECT_ID=
```

### **Option 2: Tests AVEC Paymaster (après configuration CDP)**
```env
# Utiliser vos vraies valeurs du portail CDP
VITE_COINBASE_POLICY_ID=pol_abc123def456
VITE_COINBASE_API_KEY=cdp_xyz789ghi012
VITE_COINBASE_PROJECT_ID=proj-456def789ghi
```

## 📍 **Liens Utiles**

- **Portail CDP**: https://portal.cdp.coinbase.com/
- **Documentation Paymaster**: https://docs.cdp.coinbase.com/paymaster/
- **Base Mainnet RPC**: https://api.developer.coinbase.com/rpc/v1/base

## ⚠️ **Notes Importantes**

1. **Les Policy IDs ne sont PAS visibles par défaut** - il faut les créer
2. **Base Mainnet** nécessite une vraie Policy (pas de testnet)
3. **Quotas** : Vérifiez les limites de votre plan CDP
4. **Facturation** : Les transactions gasless sont facturées à votre compte CDP

## 🚀 **Recommandation**

**Pour l'instant, teste d'abord SANS Paymaster :**
1. Laisse les variables Paymaster vides dans .env
2. Teste l'interface /claim avec transactions normales (avec gas)
3. Configure le Paymaster plus tard une fois que tout fonctionne

Le système fonctionne parfaitement avec ou sans Paymaster ! 🎯
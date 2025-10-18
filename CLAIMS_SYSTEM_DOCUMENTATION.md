# 🎯 Système de Claims APX - Documentation Complète

## 📋 Vue d'Ensemble

Le système de Claims APX permet aux utilisateurs de gagner des tokens APX de manière automatique via des récompenses **Daily (quotidiennes)** et **Weekly (hebdomadaires)** avec un système de **streak** progressif.

### ✨ Fonctionnalités Principales

- **Claims Daily** : 10 APX par jour (base)
- **Claims Weekly** : 100 APX par semaine (base)
- **Système de Streak** : Bonus progressifs pour les claims consécutifs
- **Multiplicateurs** : Jusqu'à +100% de bonus après 100 jours de streak
- **Cooldowns** : 24h pour daily, 7 jours pour weekly
- **Persistance** : Données sauvegardées dans localStorage
- **Interface temps réel** : Timers de countdown dynamiques

## 🏗️ Architecture Technique

### Fichiers Principaux

```
src/
├── config/claimSystem.ts          # Configuration centrale
├── services/claimStorage.ts       # Persistance localStorage
├── hooks/useClaimSystem.ts        # Hook principal de logique
├── components/ClaimCard.tsx       # Interface de claim
├── components/CountdownTimer.tsx  # Composants de timer
└── pages/Home.tsx                 # Intégration UI
```

### Structure des Données

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

## 🎮 Utilisation

### Pour les Utilisateurs

1. **Connexion Wallet**
   - Connecter son wallet à l'application
   - Les données de claim sont automatiquement chargées

2. **Claims Daily**
   - Disponible toutes les 24 heures
   - Montant de base : 10 APX
   - Bonus de streak automatique

3. **Claims Weekly**  
   - Disponible toutes les 7 jours
   - Montant de base : 100 APX
   - Bonus de streak plus important

4. **Système de Streak**
   - Se maintient automatiquement avec des claims réguliers
   - 2 heures de grâce après l'expiration du cooldown
   - Bonus visibles dans l'interface

### Pour les Admins

#### Prérequis Admin
- Le wallet connecté doit être le **owner du contrat APX**
- Adresse admin configurée : `0xF35EeFB35B13d908497BF51Fbc3f0f798f9f93f4`

#### Actions Admin
1. **Mint automatique** lors des claims utilisateurs
2. **Gestion des montants** via configuration
3. **Monitoring** des claims via logs

## ⚙️ Configuration

### Montants de Rewards

```typescript
// Fichier: src/config/claimSystem.ts
export const CLAIM_CONFIG = {
  dailyReward: {
    baseAmount: '10',     // 10 APX par jour
    streakMultipliers: {
      7: 1.2,   // +20% après 7 jours
      30: 1.5,  // +50% après 30 jours  
      100: 2.0, // +100% après 100 jours
    }
  },
  weeklyReward: {
    baseAmount: '100',    // 100 APX par semaine
    streakMultipliers: {
      4: 1.25,   // +25% après 4 semaines
      12: 1.5,   // +50% après 12 semaines
      52: 2.0,   // +100% après 52 semaines
    }
  }
}
```

### Cooldowns

```typescript
cooldowns: {
  daily: 24 * 60 * 60 * 1000,      // 24 heures
  weekly: 7 * 24 * 60 * 60 * 1000, // 7 jours
}
```

## 🎯 Exemples de Calculs

### Daily Claims

| Streak | Base APX | Multiplicateur | Total APX | Bonus |
|--------|----------|----------------|-----------|-------|
| 1-6 jours | 10 | 1.0x | 10 APX | 0% |
| 7-29 jours | 10 | 1.2x | 12 APX | +20% |
| 30-99 jours | 10 | 1.5x | 15 APX | +50% |
| 100+ jours | 10 | 2.0x | 20 APX | +100% |

### Weekly Claims

| Streak | Base APX | Multiplicateur | Total APX | Bonus |
|--------|----------|----------------|-----------|-------|
| 1-3 semaines | 100 | 1.0x | 100 APX | 0% |
| 4-11 semaines | 100 | 1.25x | 125 APX | +25% |
| 12-51 semaines | 100 | 1.5x | 150 APX | +50% |
| 52+ semaines | 100 | 2.0x | 200 APX | +100% |

## 🎨 Interface Utilisateur

### Page d'Accueil

L'interface Claims est intégrée directement dans la page d'accueil :

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

### États Visuels

- **🟢 Vert** : Claim disponible
- **🟠 Orange** : En attente (cooldown actif)  
- **🔵 Bleu** : Informations générales
- **⏰ Timer** : Countdown temps réel

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

## 🛡️ Sécurité

### Validations Côté Client
- **Cooldown strict** : Vérification temporelle
- **Protection spam** : États de loading
- **Validation admin** : Contrôle des permissions

### Validations Côté Blockchain
- **Seul l'admin** peut mint des APX
- **Montants validés** avant minting
- **Transaction logs** pour audit

### Gestion des Erreurs
- **Wallet non connecté** → Message d'erreur
- **Permissions insuffisantes** → Notification admin requis
- **Cooldown actif** → Affichage du timer
- **Échec du minting** → Retry automatique

## 📊 Persistance des Données

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
// Export des données
const backupData = ClaimStorageService.exportUserData(address)

// Import des données  
const success = ClaimStorageService.importUserData(address, backupData)
```

## 🚀 Déploiement

### Prérequis
- ✅ Contrat APX déployé sur Base
- ✅ Wallet admin configuré
- ✅ RPC Base fonctionnel

### Variables d'Environnement
```env
VITE_CHAIN_ID=8453
VITE_RPC_URL=https://mainnet.base.org
VITE_ONCHAINKIT_API_KEY=optional_for_ens
```

### Configuration APX Token
```typescript
// src/config/apxToken.ts
export const APX_TOKEN_CONFIG = {
  address: '0x1A51cC117Ab0f4881Db1260C9344C479D0893dD3',
  adminWallet: '0xF35EeFB35B13d908497BF51Fbc3f0f798f9f93f4',
  chainId: 8453, // Base mainnet
}
```

## 📈 Métriques et Analytics

### Données Trackées
- **Total APX distribué** par période
- **Nombre de claims** daily/weekly
- **Streaks moyens** des utilisateurs
- **Rétention** via système de streak

### Logs de Debug
```javascript
// Console logs automatiques
🔍 Wallet connected - Address: 0x123...
🔍 ENS Debug - Address: 0x123...
🔍 ENS Detection - Text: username.base.eth
```

## 🛠️ Maintenance

### Nettoyage Automatique
```typescript
// Nettoie les données anciennes (>365 jours)
const cleanedCount = ClaimStorageService.cleanupOldData()
```

### Statistiques Storage
```typescript
const stats = ClaimStorageService.getStorageStats()
// { totalUsers, totalStorage, oldestEntry, newestEntry }
```

## 🎯 Évolutions Futures

### Prochaines Fonctionnalités
- **Smart Contract Claims** : Logique onchain
- **Système de Referral** : Bonus pour parrains
- **NFT Rewards** : Pour streaks exceptionnels  
- **Leaderboard** : Classement communautaire
- **Push Notifications** : Alertes claims disponibles

### Migration Smart Contract
Le système actuel (frontend + minting) peut facilement migrer vers un smart contract :

```solidity
contract APXClaimSystem {
    mapping(address => uint256) public lastDailyClaim;
    mapping(address => uint256) public dailyStreak;
    
    function claimDaily() external {
        // Logique onchain
    }
}
```

---

## 💡 Support

### FAQ

**Q: Mon streak a été reset, pourquoi ?**
R: Un streak se reset si plus de 26h s'écoulent entre deux claims daily (24h + 2h de grâce).

**Q: Pourquoi je ne peux pas claim ?**
R: Seuls les wallets admin peuvent mint des APX. Connectez le wallet admin configuré.

**Q: Mes données sont-elles sauvegardées ?**
R: Oui, dans localStorage avec possibilité d'export/import.

### Contact
- GitHub Issues pour bugs
- Discord pour support communautaire

---

**🎉 Le système de Claims APX est maintenant opérationnel !**
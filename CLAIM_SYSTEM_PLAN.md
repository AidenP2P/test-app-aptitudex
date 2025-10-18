# Plan d'Implémentation du Système de Claims APX

## 🎯 Objectif
Implémenter un système de récompenses Daily/Weekly avec streak system pour distribuer des tokens APX automatiquement.

## 📋 Architecture Option B : Frontend + APX Minting

### 1. Configuration du Système de Rewards

**Fichier : `src/config/claimSystem.ts`**
```typescript
// Configuration centralisée des rewards
export const CLAIM_CONFIG = {
  dailyReward: {
    baseAmount: '10', // 10 APX par jour
    streakMultipliers: {
      7: 1.2,   // 20% bonus après 7 jours
      30: 1.5,  // 50% bonus après 30 jours
      100: 2.0, // 100% bonus après 100 jours
    }
  },
  weeklyReward: {
    baseAmount: '100', // 100 APX par semaine
    streakMultipliers: {
      4: 1.25,   // 25% bonus après 4 semaines
      12: 1.5,   // 50% bonus après 12 semaines
      52: 2.0,   // 100% bonus après 52 semaines
    }
  },
  cooldowns: {
    daily: 24 * 60 * 60 * 1000,  // 24 heures en ms
    weekly: 7 * 24 * 60 * 60 * 1000, // 7 jours en ms
  }
}
```

### 2. Hook useClaimSystem

**Fichier : `src/hooks/useClaimSystem.ts`**
```typescript
// Hook principal pour gérer les claims
export function useClaimSystem() {
  // Logique de validation des cooldowns
  // Calcul des streaks et bonus
  // Interface avec le minting APX
  // Gestion des erreurs et états
}
```

### 3. Services de Persistance

**Fichier : `src/services/claimStorage.ts`**
```typescript
// Gestion localStorage pour les données de claim
// Backup/restore des streaks
// Validation des données utilisateur
```

### 4. Interface Utilisateur

**Modifications dans :**
- `src/pages/Home.tsx` - Section Claims principale
- `src/components/ClaimCard.tsx` - Nouveau composant
- `src/components/StreakDisplay.tsx` - Affichage streaks
- `src/components/CountdownTimer.tsx` - Timer jusqu'au prochain claim

### 5. Page Admin

**Fichier : `src/pages/AdminClaims.tsx`**
```typescript
// Interface admin pour :
// - Configurer les montants de rewards
// - Voir les statistiques de claims
// - Reset manual des streaks
// - Monitoring des distributions APX
```

## 🔄 Flow d'Implémentation

### Phase 1 : Configuration et Logique Core
1. **Créer `claimSystem.ts`** avec configuration
2. **Développer `useClaimSystem.ts`** avec logique principale
3. **Implémenter `claimStorage.ts`** pour persistance
4. **Tester la logique** sans UI

### Phase 2 : Interface Utilisateur
1. **Créer `ClaimCard.tsx`** composant principal
2. **Développer `CountdownTimer.tsx`** pour feedback temps
3. **Intégrer dans `Home.tsx`** la section claims
4. **Ajouter animations** et feedback visuel

### Phase 3 : Distribution APX
1. **Connecter avec `useAPXMint.ts`** pour minting
2. **Implémenter validation admin** via wallet owner
3. **Ajouter transaction tracking** dans activity
4. **Gestion des erreurs** de minting

### Phase 4 : Interface Admin
1. **Créer page AdminClaims.tsx**** 
2. **Dashboard de monitoring** des claims
3. **Configuration dynamique** des rewards
4. **Statistiques et analytics**

### Phase 5 : Tests et Optimisation
1. **Tests de différents scénarios** de claims
2. **Optimisation des performances**
3. **Amélioration UX/UI**
4. **Documentation utilisateur**

## 🎨 Design de l'Interface

### Composant ClaimCard
```
┌─────────────────────────────────┐
│ 🌅 Daily Claim                 │
│ ┌─────────────────────────────┐ │
│ │ 💰 12 APX Ready             │ │
│ │ 🔥 Streak: 5 days           │ │
│ │ ⏰ Bonus unlocks in 2 days  │ │
│ └─────────────────────────────┘ │
│ [   CLAIM DAILY REWARD   ] ✨  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 📅 Weekly Claim                │
│ ┌─────────────────────────────┐ │
│ │ ⏱️ Next in 2d 14h 23m       │ │
│ │ 🔥 Streak: 2 weeks          │ │
│ │ 💰 125 APX (25% bonus!)     │ │
│ └─────────────────────────────┘ │
│ [     AVAILABLE IN 2D     ] ⌛ │
└─────────────────────────────────┘
```

## 📊 Données Stockées

### localStorage Structure
```json
{
  "claimData": {
    "lastDailyClaim": "2025-01-15T10:30:00Z",
    "lastWeeklyClaim": "2025-01-14T09:00:00Z",
    "currentDailyStreak": 5,
    "currentWeeklyStreak": 2,
    "totalDailyClaims": 45,
    "totalWeeklyClaims": 8,
    "lifetimeAPXClaimed": "1250.5"
  }
}
```

## 🔒 Sécurité et Validations

### Côté Frontend
- **Validation cooldown** strict côté client
- **Protection spam** avec loading states
- **Backup localStorage** en cas de perte

### Côté Blockchain
- **Seul l'admin** peut mint des APX
- **Validation des montants** avant minting
- **Transaction logs** pour audit

## 🚀 Points d'Extension Futurs

1. **Migration vers Smart Contract** pour logique onchain
2. **Système de referral** avec bonus
3. **NFT rewards** pour streaks exceptionnels
4. **Leaderboard** communautaire
5. **Push notifications** web pour claims

## 📈 Métriques de Succès

- **Taux d'adoption** des claims daily/weekly
- **Rétention utilisateurs** via streaks
- **Volume APX distribué** par période
- **Engagement communautaire** augmenté

---

**Prêt pour l'implémentation !** 🎯
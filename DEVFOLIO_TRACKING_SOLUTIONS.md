# Solutions de Tracking pour Actions Sociales (Devfolio Like)

## 🎯 Problématique

Comment vérifier de manière fiable qu'un utilisateur a bien liké le projet sur Devfolio pour valider le reward ?

## 📊 Options de Tracking Disponibles

### **Option 1 : Self-Declaration (Actuel)**
```typescript
// Solution actuelle - Déclaration de bonne foi
const validateSocialAction = async (action: string) => {
  // L'utilisateur clique sur "Like & Claim"
  // → Ouvre Devfolio dans un nouvel onglet
  // → Attend 2 secondes
  // → Auto-valide et claim le reward
  return true // Toujours accepté
}
```

**✅ Avantages :**
- Simple à implémenter
- UX fluide
- Pas de dépendances externes

**❌ Inconvénients :**
- Aucune vérification réelle
- Facilement abusable
- Pas de garantie que l'action a été effectuée

---

### **Option 2 : API Devfolio (Idéal mais limitée)**
```typescript
// Hypothétique - si Devfolio avait une API publique
const checkDevfolioLike = async (userId: string, projectId: string) => {
  const response = await fetch(`https://api.devfolio.co/projects/${projectId}/likes`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  const likes = await response.json()
  return likes.some(like => like.userId === userId)
}
```

**❌ Problème : Devfolio n'expose pas d'API publique pour les likes**

---

### **Option 3 : Web Scraping (Risqué)**
```typescript
// Via service backend
const scrapeDevfolioLikes = async (projectUrl: string, userIdentifier: string) => {
  // Service backend qui scrape la page Devfolio
  // Cherche le userIdentifier dans la liste des likes
  // Retourne true/false
}
```

**❌ Problèmes :**
- Violation potentielle des ToS de Devfolio
- Fragile (changes de structure HTML)
- Rate limiting et IP blocking
- Complexité technique élevée

---

### **Option 4 : Browser Extension / UserScript (Avancée)**
```typescript
// Extension navigateur qui track les clics
class DevfolioTracker {
  trackLikeAction(projectId: string, walletAddress: string) {
    // Detecte le clic sur le bouton "like"
    // Envoie une confirmation signée à notre backend
    // Wallet signe la transaction pour prouver l'action
  }
}
```

**✅ Avantages :**
- Tracking précis des actions
- Signature cryptographique pour l'authenticité

**❌ Inconvénients :**
- Nécessite installation d'extension
- UX complexe pour les utilisateurs
- Développement et maintenance importants

---

### **Option 5 : Social Proof + Community Validation**
```typescript
interface SocialProofClaim {
  walletAddress: string
  projectUrl: string
  screenshotProof?: string // Upload d'une capture d'écran
  timestamp: number
  witnesses?: string[] // Autres utilisateurs qui confirment
}
```

**✅ Avantages :**
- Plus fiable que self-declaration
- Community-driven

**❌ Inconvénients :**
- UX plus lourde
- Stockage d'images
- Validation manuelle requise

---

### **Option 6 : Limitation Temporelle + Monitoring**
```typescript
const smartValidation = {
  // Combinaison de plusieurs éléments
  timeBasedValidation: {
    // Délai obligatoire après ouverture du lien
    minimumTimeOnSite: 30000, // 30 secondes
    // Fenêtre de validation limitée
    validationWindow: 300000, // 5 minutes
  },
  
  rateLimiting: {
    // Une seule tentative par wallet par jour
    maxAttemptsPerDay: 1,
    // Cooldown entre tentatives
    cooldownPeriod: 86400000, // 24h
  },
  
  behaviorAnalysis: {
    // Tracking du focus/blur de la fenêtre
    // Vérification que l'utilisateur est resté sur Devfolio
    minimumEngagement: true
  }
}
```

---

## 🔧 Solution Recommandée : Hybrid Approach

### **Phase 1 : Enhanced Self-Declaration**
```typescript
class EnhancedSocialValidator {
  async validateDevfolioAction(walletAddress: string, projectUrl: string) {
    // 1. Ouvrir Devfolio dans nouvelle fenêtre (pas onglet)
    const devfolioWindow = window.open(projectUrl, 'devfolio', 'width=800,height=600')
    
    // 2. Monitoring de la fenêtre
    const monitoring = this.startWindowMonitoring(devfolioWindow)
    
    // 3. Attente minimum obligatoire
    await this.waitMinimumTime(30000) // 30 secondes
    
    // 4. Vérification que l'utilisateur a interagi
    const hasInteracted = monitoring.userInteracted
    
    // 5. Signature de l'action par le wallet
    const signature = await this.signAction(walletAddress, projectUrl, Date.now())
    
    return hasInteracted && signature
  }
  
  startWindowMonitoring(window: Window) {
    let userInteracted = false
    let timeSpent = 0
    
    const interval = setInterval(() => {
      if (!window.closed) {
        timeSpent += 1000
        // Détecter si l'utilisateur est actif sur la fenêtre
        if (document.hasFocus()) {
          userInteracted = true
        }
      } else {
        clearInterval(interval)
      }
    }, 1000)
    
    return { userInteracted, timeSpent }
  }
  
  async signAction(walletAddress: string, url: string, timestamp: number) {
    // L'utilisateur signe un message prouvant son intention
    const message = `I liked ${url} at ${timestamp}`
    return await window.ethereum.request({
      method: 'personal_sign',
      params: [message, walletAddress]
    })
  }
}
```

### **Phase 2 : Backend Validation**
```typescript
// Backend service pour validation additionnelle
class SocialActionValidator {
  async validateClaim(claim: SocialActionClaim) {
    // 1. Vérifier la signature
    const isValidSignature = this.verifySignature(claim)
    
    // 2. Rate limiting par wallet
    const withinLimits = await this.checkRateLimits(claim.walletAddress)
    
    // 3. Blacklist check
    const notBlacklisted = await this.checkBlacklist(claim.walletAddress)
    
    // 4. Timing validation
    const validTiming = this.validateTiming(claim.timestamp)
    
    return isValidSignature && withinLimits && notBlacklisted && validTiming
  }
}
```

### **Phase 3 : Community Reporting**
```typescript
// Système de signalement communautaire
interface ReportSystem {
  reportFraud: (walletAddress: string, evidence: string) => void
  reviewReports: () => PendingReport[]
  blacklistWallet: (walletAddress: string) => void
}
```

## 📈 Implémentation Progressive

### **Semaine 1 : Basic Enhanced Validation**
- ✅ Window monitoring
- ✅ Minimum time requirements
- ✅ Wallet signature

### **Semaine 2 : Backend Security**
- ✅ Rate limiting
- ✅ Signature verification
- ✅ Blacklist system

### **Semaine 3 : Advanced Features**
- ✅ Community reporting
- ✅ Analytics dashboard
- ✅ Fraud detection patterns

### **Semaine 4 : API Integration (si disponible)**
- ✅ Recherche d'API alternatives
- ✅ Intégration avec services tiers
- ✅ Fallback systems

## 🔐 Sécurité et Considérations

### **Protection contre les abus :**
1. **Rate Limiting** : 1 claim par wallet par jour
2. **Signature Required** : Wallet doit signer l'action
3. **Time Validation** : Minimum 30 secondes sur Devfolio
4. **IP Tracking** : Détection des fermes de wallets
5. **Behavioral Analysis** : Patterns suspects
6. **Community Reporting** : Signalement par la communauté

### **Privacy & Compliance :**
- Pas de tracking cross-site
- Données minimales collectées
- Respect GDPR/CCPA
- Transparence sur la validation

## 🎯 Recommandation Finale

**Commencer par Option 6 (Enhanced Self-Declaration) car :**

1. **Balance UX/Sécurité** : Suffisamment secure sans être invasif
2. **Évolutif** : Peut être renforcé progressivement
3. **Pas de dépendances externes** : Pas de risque d'API changes
4. **Cost-effective** : Développement rapide
5. **Legal-safe** : Respect des ToS de toutes les plateformes

Cette approche offre **80% de la sécurité pour 20% de l'effort** tout en gardant une UX acceptable pour les utilisateurs légitimes.
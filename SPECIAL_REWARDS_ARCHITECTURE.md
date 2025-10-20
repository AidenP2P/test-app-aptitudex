# Architecture des Special Rewards

## 🎯 Réorganisation des Pages

### Pages et Responsabilités

#### Page Claim (`/claim`)
**Responsabilité:** Daily/Weekly claims via `ClaimDistributor.sol`
- ✅ Déjà implémentée
- **À ajouter depuis Rewards:** 
  - `Your Claim Statistics` (lignes 74-102 de Rewards.tsx)
  - `Contract Balance` du ClaimDistributor (lignes 104-112 de Rewards.tsx)

#### Page Rewards (`/rewards`) 
**Responsabilité:** Special rewards ponctuels (quiz, games, social actions)
- **À supprimer vers Claim:**
  - `Your Claim Statistics` (daily/weekly data)
  - `Contract Balance` du ClaimDistributor
- **À garder:**
  - Banner "Base Community Alpha Launch"
  - Legacy rewards system
- **À ajouter:**
  - Special rewards cards (Base Batches 002, quiz, etc.)
  - Contract balance du nouveau smart contract

## 🏗️ Architecture Smart Contract

### Nouveau Smart Contract: `SpecialRewardsDistributor.sol`

```solidity
contract SpecialRewardsDistributor is Ownable, ReentrancyGuard {
    IERC20 public immutable apxToken;
    
    struct SpecialReward {
        uint256 amount;           // Montant en APX
        uint256 startTime;        // Début de validité
        uint256 endTime;          // Fin de validité
        bool isActive;            // Actif/inactif
        string rewardType;        // "quiz", "social", "contest", etc.
        string requirements;      // JSON des requirements
    }
    
    struct UserProgress {
        mapping(bytes32 => bool) completedRewards;
        mapping(bytes32 => uint256) progressData; // Pour quiz, scores, etc.
        uint256 totalSpecialClaimed;
    }
    
    // Rewards configurés par l'admin
    mapping(bytes32 => SpecialReward) public specialRewards;
    
    // Progression utilisateur
    mapping(address => UserProgress) public userProgress;
    
    // Functions principales
    function createSpecialReward(
        bytes32 rewardId,
        uint256 amount,
        uint256 startTime,
        uint256 endTime,
        string memory rewardType,
        string memory requirements
    ) external onlyOwner;
    
    function claimSpecialReward(bytes32 rewardId) external nonReentrant;
    
    function validateQuizAnswers(
        bytes32 rewardId, 
        string[] memory answers
    ) external;
    
    function validateSocialAction(
        bytes32 rewardId,
        string memory proof
    ) external;
    
    // View functions
    function getAvailableRewards(address user) external view returns (bytes32[] memory);
    function getUserProgress(address user, bytes32 rewardId) external view returns (uint256);
    function canClaimReward(address user, bytes32 rewardId) external view returns (bool);
}
```

## 🎮 Types de Special Rewards

### 1. Base Batches 002 Bonus
```typescript
{
  id: "base_batches_002",
  name: "Base Batches 002 Builder Bonus",
  amount: "50",
  type: "contest",
  requirements: {
    type: "one_time",
    description: "Participate in Base Batches 002"
  },
  startDate: "2024-01-01",
  endDate: "2024-12-31"
}
```

### 2. Quiz Reward
```typescript
{
  id: "aptitudex_quiz_001",
  name: "AptitudeX Knowledge Quiz",
  amount: "25",
  type: "quiz",
  requirements: {
    type: "quiz",
    questions: [
      {
        question: "What blockchain is AptitudeX built on?",
        options: ["Ethereum", "Base", "Polygon", "Arbitrum"],
        correct: 1
      },
      // ... plus de questions
    ],
    minScore: 80
  }
}
```

### 3. Social Action Reward
```typescript
{
  id: "devfolio_like",
  name: "Support us on Devfolio",
  amount: "15",
  type: "social",
  requirements: {
    type: "social_action",
    action: "like_devfolio",
    url: "https://devfolio.co/projects/kudos-protocol-d7e4",
    verification: "self_declared" // ou "api_verification"
  }
}
```

## 🔧 Plan d'Implémentation

### Phase 1: Réorganisation Pages (Immédiat)
1. **Déplacer de Rewards → Claim:**
   - `Your Claim Statistics` module
   - `Contract Balance` du ClaimDistributor
   
2. **Nettoyer la page Rewards:**
   - Garder uniquement le contenu lié aux special rewards
   - Préparer l'espace pour les nouvelles fonctionnalités

### Phase 2: Smart Contract SpecialRewards
1. **Créer le smart contract `SpecialRewardsDistributor.sol`**
2. **Déployer sur Base testnet puis mainnet**
3. **Configuration ABI et adresses**

### Phase 3: Frontend Integration
1. **Hook `useSpecialRewards`**
2. **Composants pour chaque type de reward:**
   - `QuizCard.tsx`
   - `SocialActionCard.tsx` 
   - `ContestCard.tsx`
3. **Service de validation et tracking**

### Phase 4: UX/UI Special Rewards
1. **Quiz interface avec questions/réponses**
2. **Social action verification flow**
3. **Progress tracking et badges**
4. **Admin panel pour créer de nouveaux rewards**

## 🎨 UX Flow Exemple - Quiz

```typescript
// Workflow Quiz
1. User sees quiz card in Rewards page
2. Clicks "Start Quiz" → QuizModal opens
3. Answers questions → Frontend validates
4. Score ≥ minScore → Calls smart contract
5. Smart contract validates + transfers APX
6. Success toast + card shows "Completed"
```

## 📊 Structure des Données

### Frontend State (Zustand Store)
```typescript
interface SpecialRewardsStore {
  availableRewards: SpecialReward[]
  completedRewards: string[]
  userProgress: Record<string, any>
  specialRewardsBalance: string // Contract balance
  
  // Actions
  loadSpecialRewards: () => Promise<void>
  claimSpecialReward: (rewardId: string) => Promise<void>
  updateProgress: (rewardId: string, progress: any) => void
}
```

### localStorage Backup
```typescript
// Pour éviter de perdre le progress en cas de refresh
interface LocalProgress {
  [walletAddress: string]: {
    [rewardId: string]: {
      completed: boolean
      progress: any
      claimedAt?: number
    }
  }
}
```

## 🔐 Sécurité et Validation

### Frontend Validation
- ✅ Quiz answers validation côté client
- ✅ Social action self-declaration
- ✅ Rate limiting (localStorage)

### Smart Contract Validation  
- ✅ One-time claim per reward per user
- ✅ Time-based validity (start/end dates)
- ✅ Owner-only reward creation
- ✅ Reentrancy protection

### Admin Controls
- ✅ Pause/unpause individual rewards
- ✅ Emergency withdraw funds
- ✅ Update reward parameters
- ✅ View analytics and stats

## 🚀 Roadmap

### Semaine 1: Réorganisation
- [ ] Move claim statistics to Claim page
- [ ] Clean up Rewards page structure
- [ ] Prepare infrastructure

### Semaine 2: Smart Contract
- [ ] Develop SpecialRewardsDistributor.sol
- [ ] Unit tests and security audit
- [ ] Deploy to testnet

### Semaine 3: Frontend Core
- [ ] useSpecialRewards hook
- [ ] Basic reward cards
- [ ] Contract integration

### Semaine 4: Advanced Features
- [ ] Quiz interface
- [ ] Social action validation
- [ ] Admin dashboard

### Semaine 5: Polish & Launch
- [ ] UX improvements
- [ ] Deploy to mainnet
- [ ] Launch Base Batches 002 reward
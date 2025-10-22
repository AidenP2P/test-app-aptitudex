# 🎯 TypeScript Types Specification - Benefits System

## Overview

Cette spécification définit tous les types TypeScript nécessaires pour l'intégration frontend du système de Benefits, incluant les interfaces, types, utilitaires et configurations.

## 🏗️ Core Types

### Benefit Interface

```typescript
// Interface principale pour un bénéfice
export interface Benefit {
  id: string                    // bytes32 converti en string hex
  title: string                 // "1:1 with the Creator (Aiden P2P)"
  description: string           // Phrase de valeur (pourquoi c'est utile)
  mechanics: string             // Mécanique en 1 ligne (comment on le débloque)
  guardrails: string            // Garde-fous (limites, cap par wallet, délai)
  tokenomics: string            // Badge tokenomics (ex. "100% burn", "gasless")
  priceAPX: string              // Prix formaté en APX (ex: "5000")
  iconName: string              // Nom de l'icône Lucide React
  colorClass: string            // Classes CSS pour la couleur
  isActive: boolean             // Bénéfice disponible pour achat
  totalRedeemed: number         // Nombre total de rachats
  maxRedemptions: number        // Limite globale (0 = illimité)
  createdAt: Date               // Date de création
  
  // États calculés côté frontend
  canRedeem: boolean            // Calculé : utilisateur peut-il racheter ?
  isRedeemed: boolean           // Utilisateur a-t-il déjà racheté ?
  isAvailable: boolean          // Bénéfice disponible (limite non atteinte)
  remainingSlots?: number       // Slots restants si limite définie
}

// Type pour la création d'un bénéfice (admin)
export interface CreateBenefitData {
  id: string
  title: string
  description: string
  mechanics: string
  guardrails: string
  tokenomics: string
  priceAPX: string
  iconName: string
  colorClass: string
  maxRedemptions: number
}

// Type pour la mise à jour d'un bénéfice
export interface UpdateBenefitData {
  id: string
  priceAPX?: string
  title?: string
  description?: string
  isActive?: boolean
}
```

### Redemption Interface

```typescript
// Interface pour un rachat de bénéfice
export interface BenefitRedemption {
  orderId: string               // ID unique de commande (BEN-timestamp-counter)
  benefitId: string             // ID du bénéfice racheté
  benefitTitle: string          // Titre du bénéfice (pour affichage)
  user: string                  // Adresse wallet de l'utilisateur
  apxBurned: string             // Montant APX brûlé (formaté)
  timestamp: Date               // Date de rachat
  txHash: string                // Hash de la transaction
  isProcessed: boolean          // Traité par l'équipe
  contactSubmitted: boolean     // Contact email soumis
  contactHash?: string          // Hash du contact (si soumis)
  
  // États calculés
  status: RedemptionStatus      // Statut calculé
  timeAgo: string               // "2 hours ago", "1 day ago"
}

// Statuts possibles d'un rachat
export type RedemptionStatus = 
  | 'pending_contact'   // En attente de soumission du contact
  | 'pending_process'   // Contact soumis, en attente de traitement
  | 'processing'        // En cours de traitement par l'équipe
  | 'fulfilled'         // Traité et livré
  | 'expired'           // Expiré (si applicable)

// Données de contact pour un rachat
export interface BenefitContact {
  orderId: string
  email: string
  benefitTitle: string
  benefitId: string
  timestamp: Date
  status: ContactStatus
  notes?: string                // Notes optionnelles
}

export type ContactStatus = 'submitted' | 'processing' | 'fulfilled'
```

### Transaction Types

```typescript
// Interface pour les transactions liées aux bénéfices
export interface BenefitTransaction {
  id: string
  type: 'benefit_redeem' | 'benefit_burn'
  orderId: string
  benefitId: string
  benefitTitle: string
  amount: string                // APX brûlé
  date: string                  // ISO date
  tx: string                    // Transaction hash
  description: string
  status: 'pending' | 'confirmed' | 'failed'
  
  // Données spécifiques aux bénéfices
  benefitIcon?: string
  benefitColor?: string
}
```

## 🔧 Configuration Types

### Contract Configuration

```typescript
// Configuration du Smart Contract BenefitsManagement
export interface BenefitsManagementConfig {
  contractAddress: Address
  abi: readonly unknown[]
  adminWallet: Address
  chainId: number
}

// ABI spécialisée avec types stricts
export const BenefitsManagementABI = [
  // Read functions
  {
    name: 'benefits',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'benefitId', type: 'bytes32' }],
    outputs: [
      { name: 'priceAPX', type: 'uint256' },
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'mechanics', type: 'string' },
      { name: 'guardrails', type: 'string' },
      { name: 'tokenomics', type: 'string' },
      { name: 'iconName', type: 'string' },
      { name: 'colorClass', type: 'string' },
      { name: 'isActive', type: 'bool' },
      { name: 'totalRedeemed', type: 'uint256' },
      { name: 'maxRedemptions', type: 'uint256' },
      { name: 'createdAt', type: 'uint256' }
    ],
  },
  {
    name: 'redemptions',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'orderId', type: 'string' }],
    outputs: [
      { name: 'user', type: 'address' },
      { name: 'benefitId', type: 'bytes32' },
      { name: 'apxBurned', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'orderId', type: 'string' },
      { name: 'contactHash', type: 'bytes32' },
      { name: 'isProcessed', type: 'bool' },
      { name: 'contactSubmitted', type: 'bool' }
    ],
  },
  
  // Write functions
  {
    name: 'redeemBenefit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'benefitId', type: 'bytes32' }],
    outputs: [{ name: 'orderId', type: 'string' }],
  },
  {
    name: 'submitContactHash',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'orderId', type: 'string' },
      { name: 'contactHash', type: 'bytes32' }
    ],
    outputs: [],
  },
  
  // View functions
  {
    name: 'getActiveBenefits',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32[]' }],
  },
  {
    name: 'canRedeemBenefit',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'benefitId', type: 'bytes32' }
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'getUserRedemptions',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'string[]' }],
  },
  
  // Events
  {
    name: 'BenefitRedeemed',
    type: 'event',
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'benefitId', type: 'bytes32' },
      { name: 'apxBurned', type: 'uint256' },
      { name: 'orderId', type: 'string' },
      { name: 'timestamp', type: 'uint256' }
    ],
  },
  {
    name: 'ContactSubmitted',
    type: 'event',
    inputs: [
      { indexed: true, name: 'orderId', type: 'string' },
      { name: 'contactHash', type: 'bytes32' },
      { indexed: true, name: 'user', type: 'address' }
    ],
  }
] as const
```

### Predefined Benefits

```typescript
// Types pour les bénéfices prédéfinis
export interface PredefinedBenefit {
  id: string
  title: string
  description: string
  mechanics: string
  guardrails: string
  tokenomics: string
  priceAPX: string
  iconName: string
  colorClass: string
  maxRedemptions: number
  category: BenefitCategory
}

export type BenefitCategory = 'premium' | 'access' | 'reward' | 'contest'

// Configuration des bénéfices prédéfinis
export const PREDEFINED_BENEFITS = {
  CREATOR_1ON1: {
    id: '0x316f6e31000000000000000000000000000000000000000000000000000000',
    title: '1:1 with the Creator (Aiden P2P)',
    description: 'A 30–45 min private session to discuss product, token design, Base integration, or GTM.',
    mechanics: 'Redeem with APX → on-chain receipt → booking link sent.',
    guardrails: 'Limit: 1 per wallet, expires in 30 days',
    tokenomics: '100% burn',
    priceAPX: '5000',
    iconName: 'UserCheck',
    colorClass: 'bg-gradient-to-r from-purple-500 to-pink-500',
    maxRedemptions: 10,
    category: 'premium' as const
  },
  
  BETA_ACCESS: {
    id: '0x6265746161636365737300000000000000000000000000000000000000000000',
    title: 'Early Access to the Beta',
    description: 'Priority access to the next product release.',
    mechanics: 'Redeem with APX → allowlist your wallet for Beta features.',
    guardrails: 'Limit: 1 per wallet, permanent access',
    tokenomics: '100% burn + gasless',
    priceAPX: '1000',
    iconName: 'Zap',
    colorClass: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    maxRedemptions: 100,
    category: 'access' as const
  },
  
  USDC_VOUCHER: {
    id: '0x757364637663686572000000000000000000000000000000000000000000000',
    title: '10 USDC Voucher',
    description: 'A 10 USDC credit delivered to your wallet.',
    mechanics: 'Redeem with APX → on-chain event → USDC payout (server-fulfilled) within 24–48h.',
    guardrails: 'Limit: 1 per wallet, payout within 48h',
    tokenomics: '100% burn + gasless',
    priceAPX: '2000',
    iconName: 'DollarSign',
    colorClass: 'bg-gradient-to-r from-green-500 to-emerald-500',
    maxRedemptions: 50,
    category: 'reward' as const
  },
  
  LUCKY_DRAW: {
    id: '0x6c75636b796472617700000000000000000000000000000000000000000000',
    title: 'Lucky Draw — Win 100 USDC',
    description: 'Entry into a raffle for 100 USDC.',
    mechanics: 'Redeem with APX → on-chain entry logged; transparent draw (tx hash / VRF if added).',
    guardrails: 'Limit: 1 per wallet, draw monthly',
    tokenomics: '100% burn + gasless',
    priceAPX: '500',
    iconName: 'Gift',
    colorClass: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    maxRedemptions: 0,
    category: 'contest' as const
  }
} as const

export type PredefinedBenefitKey = keyof typeof PREDEFINED_BENEFITS
```

## 🎨 UI Component Types

### Component Props

```typescript
// Props pour BenefitCard
export interface BenefitCardProps {
  benefit: Benefit
  onRedeem: (benefitId: string) => Promise<void>
  onViewDetails?: (benefit: Benefit) => void
  disabled?: boolean
  className?: string
}

// Props pour BenefitModal (détails)
export interface BenefitModalProps {
  benefit: Benefit | null
  isOpen: boolean
  onClose: () => void
  onRedeem: (benefitId: string) => Promise<void>
  isRedeeming?: boolean
}

// Props pour PostRedemptionModal (collecte email)
export interface PostRedemptionModalProps {
  orderId: string
  benefitTitle: string
  isOpen: boolean
  onSubmit: (email: string) => Promise<void>
  onClose: () => void
  isSubmitting?: boolean
}

// Props pour RedemptionHistoryItem
export interface RedemptionHistoryItemProps {
  redemption: BenefitRedemption
  onViewDetails?: (redemption: BenefitRedemption) => void
  onSubmitContact?: (orderId: string) => void
  showContactAction?: boolean
}

// Props pour BenefitsList
export interface BenefitsListProps {
  benefits: Benefit[]
  isLoading?: boolean
  onRedeem: (benefitId: string) => Promise<void>
  filterCategory?: BenefitCategory
  sortBy?: 'price' | 'popularity' | 'newest'
  className?: string
}
```

### State Management Types

```typescript
// State pour le store Benefits
export interface BenefitsState {
  benefits: Benefit[]
  userRedemptions: BenefitRedemption[]
  contacts: BenefitContact[]
  isLoading: boolean
  error: string | null
  
  // Cache et optimisations
  lastFetched: Date | null
  cachedBalanceAPX: string
}

// Actions pour le store Benefits
export interface BenefitsActions {
  // Data fetching
  fetchBenefits: () => Promise<void>
  fetchUserRedemptions: () => Promise<void>
  
  // Redemption actions
  redeemBenefit: (benefitId: string) => Promise<{ orderId: string; txHash: string }>
  submitContact: (orderId: string, email: string) => Promise<void>
  
  // State management
  setBenefits: (benefits: Benefit[]) => void
  addRedemption: (redemption: BenefitRedemption) => void
  addContact: (contact: BenefitContact) => void
  clearError: () => void
  setLoading: (loading: boolean) => void
}

// Store complet
export interface BenefitsStore extends BenefitsState, BenefitsActions {}
```

## 🛠️ Utility Types

### Helper Types

```typescript
// Résultat d'une opération de rachat
export interface RedeemResult {
  success: boolean
  orderId?: string
  txHash?: string
  error?: string
}

// Résultat de soumission de contact
export interface ContactSubmitResult {
  success: boolean
  error?: string
}

// Statistiques pour l'admin
export interface BenefitsStats {
  totalBenefits: number
  activeBenefits: number
  totalRedemptions: number
  totalAPXBurned: string
  topBenefit: {
    title: string
    redemptions: number
  }
  recentActivity: BenefitRedemption[]
}

// Filtre pour les bénéfices
export interface BenefitsFilter {
  category?: BenefitCategory
  priceRange?: {
    min: number
    max: number
  }
  availableOnly?: boolean
  userCanRedeem?: boolean
}

// Options de tri
export type BenefitsSortOption = 
  | 'price_asc'
  | 'price_desc'
  | 'popularity'
  | 'newest'
  | 'ending_soon'
```

### Contract Interaction Types

```typescript
// Paramètres pour les appels contract
export interface ContractCallParams {
  address: Address
  abi: readonly unknown[]
  functionName: string
  args?: readonly unknown[]
  account?: Address
}

// Résultat d'appel contract
export interface ContractCallResult<T = unknown> {
  data: T
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

// Hook configuration
export interface UseBenefitsConfig {
  autoRefresh?: boolean
  refreshInterval?: number
  cacheTime?: number
}
```

## 🔗 Integration Types

### API Types (pour contact storage)

```typescript
// Request pour stocker un contact
export interface StoreContactRequest {
  orderId: string
  email: string
  benefitId: string
  walletAddress: string
  signature?: string  // Optionnel pour vérification
}

// Response de l'API
export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

// Contact export pour admin
export interface ContactExport {
  orderId: string
  email: string
  benefitTitle: string
  walletAddress: string
  apxBurned: string
  timestamp: string
  status: ContactStatus
  txHash: string
}
```

### Paymaster Integration

```typescript
// Configuration Paymaster Coinbase
export interface PaymasterConfig {
  url: string
  apiKey?: string
  sponsorEnabled: boolean
  gasPolicy?: 'user_pays' | 'sponsor_pays' | 'hybrid'
}

// Transaction avec Paymaster
export interface PaymasterTransaction {
  to: Address
  data: `0x${string}`
  value?: bigint
  gasLimit?: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
}
```

## 📊 Export des Types Principaux

```typescript
// Export principal pour utilisation dans l'app
export type {
  // Core types
  Benefit,
  BenefitRedemption,
  BenefitContact,
  CreateBenefitData,
  UpdateBenefitData,
  
  // UI types
  BenefitCardProps,
  BenefitModalProps,
  PostRedemptionModalProps,
  BenefitsListProps,
  
  // State types
  BenefitsState,
  BenefitsActions,
  BenefitsStore,
  
  // Utility types
  RedeemResult,
  ContactSubmitResult,
  BenefitsStats,
  BenefitsFilter,
  BenefitsSortOption,
  
  // Categories
  BenefitCategory,
  RedemptionStatus,
  ContactStatus,
  
  // Configuration
  BenefitsManagementConfig,
  PaymasterConfig
}

// Export des constantes
export {
  PREDEFINED_BENEFITS,
  BenefitsManagementABI
}
```

Cette spécification TypeScript complète fournit tous les types nécessaires pour une intégration robuste et type-safe du système de Benefits dans le frontend React.

# 🎯 TypeScript Types Specification - Benefits System

## Overview

This specification defines all necessary TypeScript types for the frontend integration of the Benefits system, including interfaces, types, utilities, and configurations.

## 🏗️ Core Types

### Benefit Interface

```typescript
// Main interface for a benefit
export interface Benefit {
  id: string                    // bytes32 converted to hex string
  title: string                 // "1:1 with the Creator (Aiden P2P)"
  description: string           // Value proposition (why it's useful)
  mechanics: string             // 1-line mechanics (how to unlock it)
  guardrails: string            // Guardrails (limits, per wallet cap, deadline)
  tokenomics: string            // Tokenomics badge (e.g., "", "gasless")
  priceAPX: string              // Price formatted in APX (e.g: "5000")
  iconName: string              // Lucide React icon name
  colorClass: string            // CSS classes for color
  isActive: boolean             // Benefit available for purchase
  totalRedeemed: number         // Total number of redemptions
  maxRedemptions: number        // Global limit (0 = unlimited)
  createdAt: Date               // Date of creation
  
  // Calculated states on the frontend
  canRedeem: boolean            // Calculated: can the user redeem?
  isRedeemed: boolean           // Has the user already redeemed?
  isAvailable: boolean          // Benefit available (limit not reached)
  remainingSlots?: number       // Remaining slots if limit is set
}

// Type for creating a benefit (admin)
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

// Type for updating a benefit
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
// Interface for a benefit redemption
export interface BenefitRedemption {
  orderId: string               // Unique order ID (BEN-timestamp-counter)
  benefitId: string             // ID of the redeemed benefit
  benefitTitle: string          // Benefit title (for display)
  user: string                  // Wallet address of the user
  apxBurned: string             // Amount of APX burned (formatted)
  timestamp: Date               // Date of redemption
  txHash: string                // Transaction hash
  isProcessed: boolean          // Processed by the team
  contactSubmitted: boolean     // Contact email submitted
  contactHash?: string          // Contact hash (if submitted)
  
  // Calculated states
  status: RedemptionStatus      // Calculated status
  timeAgo: string               // "2 hours ago", "1 day ago"
}

// Possible statuses for a redemption
export type RedemptionStatus = 
  | 'pending_contact'   // Awaiting contact submission
  | 'pending_process'   // Contact submitted, awaiting team processing
  | 'processing'        // Currently being processed by the team
  | 'fulfilled'         // Processed and delivered
  | 'expired'           // Expired (if applicable)

// Contact data for a redemption
export interface BenefitContact {
  orderId: string
  email: string
  benefitTitle: string
  benefitId: string
  timestamp: Date
  status: ContactStatus
  notes?: string                // Optional notes
}

export type ContactStatus = 'submitted' | 'processing' | 'fulfilled'
```

### Transaction Types

```typescript
// Interface for benefit-related transactions
export interface BenefitTransaction {
  id: string
  type: 'benefit_redeem' | 'benefit_burn'
  orderId: string
  benefitId: string
  benefitTitle: string
  amount: string                // APX burned
  date: string                  // ISO date
  tx: string                    // Transaction hash
  description: string
  status: 'pending' | 'confirmed' | 'failed'
  
  // Benefit-specific data
  benefitIcon?: string
  benefitColor?: string
}
```

## 🔧 Configuration Types

### Contract Configuration

```typescript
// Configuration for the BenefitsManagement Smart Contract
export interface BenefitsManagementConfig {
  contractAddress: Address
  abi: readonly unknown[]
  adminWallet: Address
  chainId: number
}

// Specialized ABI with strict types
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
// Types for predefined benefits
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

// Predefined benefits configuration
export const PREDEFINED_BENEFITS = {
  CREATOR_1ON1: {
    id: '0x316f6e31000000000000000000000000000000000000000000000000000000',
    title: '1:1 with the Creator (Aiden P2P)',
    description: 'A 30–45 min private session to discuss product, token design, Base integration, or GTM.',
    mechanics: 'Redeem with APX → on-chain receipt → booking link sent.',
    guardrails: 'Limit: 1 per wallet, expires in 30 days',
    tokenomics: '',
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
    tokenomics: '',
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
    tokenomics: '',
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
    tokenomics: '',
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
// Props for BenefitCard
export interface BenefitCardProps {
  benefit: Benefit
  onRedeem: (benefitId: string) => Promise<void>
  onViewDetails?: (benefit: Benefit) => void
  disabled?: boolean
  className?: string
}

// Props for BenefitModal (details)
export interface BenefitModalProps {
  benefit: Benefit | null
  isOpen: boolean
  onClose: () => void
  onRedeem: (benefitId: string) => Promise<void>
  isRedeeming?: boolean
}

// Props for PostRedemptionModal (email collection)
export interface PostRedemptionModalProps {
  orderId: string
  benefitTitle: string
  isOpen: boolean
  onSubmit: (email: string) => Promise<void>
  onClose: () => void
  isSubmitting?: boolean
}

// Props for RedemptionHistoryItem
export interface RedemptionHistoryItemProps {
  redemption: BenefitRedemption
  onViewDetails?: (redemption: BenefitRedemption) => void
  onSubmitContact?: (orderId: string) => void
  showContactAction?: boolean
}

// Props for BenefitsList
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
// State for the Benefits store
export interface BenefitsState {
  benefits: Benefit[]
  userRedemptions: BenefitRedemption[]
  contacts: BenefitContact[]
  isLoading: boolean
  error: string | null
  
  // Cache and optimizations
  lastFetched: Date | null
  cachedBalanceAPX: string
}

// Actions for the Benefits store
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

// Complete Store
export interface BenefitsStore extends BenefitsState, BenefitsActions {}
```

## 🛠️ Utility Types

### Helper Types

```typescript
// Result of a benefit redemption operation
export interface RedeemResult {
  success: boolean
  orderId?: string
  txHash?: string
  error?: string
}

// Contact submission result
export interface ContactSubmitResult {
  success: boolean
  error?: string
}

// Statistics for admin
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

// Filter for benefits
export interface BenefitsFilter {
  category?: BenefitCategory
  priceRange?: {
    min: number
    max: number
  }
  availableOnly?: boolean
  userCanRedeem?: boolean
}

// Sort options
export type BenefitsSortOption = 
  | 'price_asc'
  | 'price_desc'
  | 'popularity'
  | 'newest'
  | 'ending_soon'
```

### Contract Interaction Types

```typescript
// Parameters for contract calls
export interface ContractCallParams {
  address: Address
  abi: readonly unknown[]
  functionName: string
  args?: readonly unknown[]
  account?: Address
}

// Contract call result
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

### API Types (for contact storage)

```typescript
// Request to store a contact
export interface StoreContactRequest {
  orderId: string
  email: string
  benefitId: string
  walletAddress: string
  signature?: string  // Optional for verification
}

// API Response
export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

// Contact export for admin
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
// Coinbase Paymaster Configuration
export interface PaymasterConfig {
  url: string
  apiKey?: string
  sponsorEnabled: boolean
  gasPolicy?: 'user_pays' | 'sponsor_pays' | 'hybrid'
}

// Transaction with Paymaster
export interface PaymasterTransaction {
  to: Address
  data: `0x${string}`
  value?: bigint
  gasLimit?: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
}
```

## 📊 Export of Main Types

```typescript
// Main export for application use
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

// Export constants
export {
  PREDEFINED_BENEFITS,
  BenefitsManagementABI
}
```

This comprehensive TypeScript specification provides all necessary types for robust and type-safe integration of the Benefits system into the React frontend.

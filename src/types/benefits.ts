import type { Address } from 'viem'

// Types pour les bénéfices
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
  category?: BenefitCategory    // Catégorie du bénéfice
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

// Catégories de bénéfices
export type BenefitCategory = 'premium' | 'access' | 'reward' | 'contest'

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

// Types pour les données brutes du contract
export interface BenefitContractData {
  priceAPX: bigint
  title: string
  description: string
  mechanics: string
  guardrails: string
  tokenomics: string
  iconName: string
  colorClass: string
  isActive: boolean
  totalRedeemed: bigint
  maxRedemptions: bigint
}

export interface RedemptionContractData {
  user: Address
  benefitId: string
  apxBurned: bigint
  timestamp: bigint
  isProcessed: boolean
  contactSubmitted: boolean
}

// Types pour les composants UI
export interface BenefitCardProps {
  benefit: Benefit
  onRedeem: (benefitId: string) => Promise<void>
  onViewDetails?: (benefit: Benefit) => void
  disabled?: boolean
  className?: string
}

export interface BenefitModalProps {
  benefit: Benefit | null
  isOpen: boolean
  onClose: () => void
  onRedeem: (benefitId: string) => Promise<void>
  isRedeeming?: boolean
}

export interface PostRedemptionModalProps {
  orderId: string
  benefitTitle: string
  isOpen: boolean
  onSubmit: (email: string) => Promise<void>
  onClose: () => void
  isSubmitting?: boolean
}

export interface RedemptionHistoryItemProps {
  redemption: BenefitRedemption
  onViewDetails?: (redemption: BenefitRedemption) => void
  onSubmitContact?: (orderId: string) => void
  showContactAction?: boolean
}

export interface BenefitsListProps {
  benefits: Benefit[]
  isLoading?: boolean
  onRedeem: (benefitId: string) => Promise<void>
  filterCategory?: BenefitCategory
  sortBy?: BenefitsSortOption
  className?: string
}

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
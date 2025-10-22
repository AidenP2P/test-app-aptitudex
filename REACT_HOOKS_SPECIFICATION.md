
# ⚛️ React Hooks Specification - Benefits System

## Overview

Cette spécification définit tous les hooks React nécessaires pour l'interaction avec le système de Benefits, incluant les appels au Smart Contract, la gestion d'état, et l'intégration avec les APIs existantes.

## 🏗️ Architecture des Hooks

### Design Patterns

Les hooks Benefits suivent les mêmes patterns que l'architecture existante :
- **Wagmi/Viem** pour les interactions blockchain
- **Zustand** pour la gestion d'état globale
- **React Query** pour le cache et synchronisation
- **Toast notifications** avec Sonner
- **Error handling** unifié

## 🔄 Core Hooks

### 1. useBenefitsManagement - Hook Principal

Hook principal pour toutes les interactions utilisateur avec les bénéfices.

```typescript
// src/hooks/useBenefitsManagement.ts
import { useState, useEffect, useCallback } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { toast } from 'sonner'
import {
  BENEFITS_MANAGEMENT_CONFIG,
  BenefitsUtils,
  PREDEFINED_BENEFITS,
  type Benefit,
  type BenefitRedemption,
  type RedeemResult,
  type ContactSubmitResult
} from '@/config/benefitsManagement'
import { base } from 'viem/chains'
import { parseEventLogs } from 'viem'

/**
 * Hook principal pour les interactions Benefits côté utilisateur
 */
export function useBenefitsManagement() {
  const { address, isConnected } = useAccount()
  const { writeContract, data: txHash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // États locaux
  const [isLoading, setIsLoading] = useState(false)
  const [lastActivity, setLastActivity] = useState<string | null>(null)

  // ===== LECTURE DES DONNÉES CONTRACT =====

  // Liste des bénéfices actifs
  const { data: activeBenefitIds, refetch: refetchActiveBenefits } = useReadContract({
    address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
    abi: BENEFITS_MANAGEMENT_CONFIG.abi,
    functionName: 'getActiveBenefits',
    query: { enabled: isConnected }
  })

  // Balance APX de l'utilisateur
  const { data: userAPXBalance, refetch: refetchBalance } = useReadContract({
    address: BENEFITS_MANAGEMENT_CONFIG.apxTokenAddress,
    abi: BENEFITS_MANAGEMENT_CONFIG.apxTokenAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && Boolean(address) }
  })

  // Rachats de l'utilisateur
  const { data: userOrderIds, refetch: refetchUserOrders } = useReadContract({
    address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
    abi: BENEFITS_MANAGEMENT_CONFIG.abi,
    functionName: 'getUserRedemptions',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && Boolean(address) }
  })

  // ===== FONCTIONS UTILITAIRES =====

  /**
   * Récupérer les détails d'un bénéfice depuis le contract
   */
  const getBenefitDetails = useCallback(async (benefitId: string) => {
    if (!isConnected) return null

    try {
      // Appel au contract pour récupérer les détails
      const details = await readContract({
        address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        abi: BENEFITS_MANAGEMENT_CONFIG.abi,
        functionName: 'getBenefitDetails',
        args: [benefitId as `0x${string}`]
      })

      // Conversion vers format Benefit
      return BenefitsUtils.parseBenefitFromContract(benefitId, details)
    } catch (error) {
      console.error('Error fetching benefit details:', error)
      return null
    }
  }, [isConnected])

  /**
   * Vérifier si un utilisateur peut racheter un bénéfice
   */
  const canUserRedeem = useCallback(async (benefitId: string): Promise<boolean> => {
    if (!address || !isConnected) return false

    try {
      const canRedeem = await readContract({
        address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        abi: BENEFITS_MANAGEMENT_CONFIG.abi,
        functionName: 'canRedeemBenefit',
        args: [address, benefitId as `0x${string}`]
      })
      return Boolean(canRedeem)
    } catch (error) {
      console.error('Error checking redeem eligibility:', error)
      return false
    }
  }, [address, isConnected])

  /**
   * Récupérer tous les bénéfices disponibles avec état utilisateur
   */
  const getAvailableBenefits = useCallback(async (): Promise<Benefit[]> => {
    if (!isConnected || !address) return []

    try {
      console.log('🔍 Fetching available benefits...')
      
      const allBenefits: Benefit[] = []
      
      // Récupérer les IDs des bénéfices actifs
      const activeIds = activeBenefitIds as string[] || []
      
      // Pour chaque bénéfice actif, récupérer les détails
      for (const benefitId of activeIds) {
        const details = await getBenefitDetails(benefitId)
        if (details) {
          // Vérifier si l'utilisateur peut racheter
          const canRedeem = await canUserRedeem(benefitId)
          const userBalance = userAPXBalance ? BenefitsUtils.formatTokenAmount(BigInt(userAPXBalance)) : '0'
          const hasEnoughBalance = parseInt(userBalance) >= parseInt(details.priceAPX)
          
          // Vérifier si déjà racheté
          const isRedeemed = await isUserRedeemed(benefitId)
          
          const benefit: Benefit = {
            ...details,
            canRedeem: canRedeem && hasEnoughBalance && !isRedeemed,
            isRedeemed,
            isAvailable: details.maxRedemptions === 0 || details.totalRedeemed < details.maxRedemptions,
            remainingSlots: details.maxRedemptions > 0 ? details.maxRedemptions - details.totalRedeemed : undefined
          }
          
          allBenefits.push(benefit)
        }
      }

      console.log('🎯 Available benefits:', allBenefits)
      return allBenefits
      
    } catch (error) {
      console.error('❌ Error fetching benefits:', error)
      return []
    }
  }, [isConnected, address, activeBenefitIds, userAPXBalance, getBenefitDetails, canUserRedeem])

  /**
   * Vérifier si un utilisateur a déjà racheté un bénéfice
   */
  const isUserRedeemed = useCallback(async (benefitId: string): Promise<boolean> => {
    if (!address || !isConnected) return false

    try {
      const isRedeemed = await readContract({
        address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        abi: BENEFITS_MANAGEMENT_CONFIG.abi,
        functionName: 'userRedeemed',
        args: [address, benefitId as `0x${string}`]
      })
      return Boolean(isRedeemed)
    } catch (error) {
      console.error('Error checking redemption status:', error)
      return false
    }
  }, [address, isConnected])

  /**
   * Récupérer l'historique des rachats de l'utilisateur
   */
  const getUserRedemptions = useCallback(async (): Promise<BenefitRedemption[]> => {
    if (!address || !isConnected || !userOrderIds) return []

    try {
      const redemptions: BenefitRedemption[] = []
      
      for (const orderId of userOrderIds as string[]) {
        const details = await readContract({
          address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
          abi: BENEFITS_MANAGEMENT_CONFIG.abi,
          functionName: 'getRedemptionDetails',
          args: [orderId]
        })
        
        if (details) {
          const redemption = BenefitsUtils.parseRedemptionFromContract(orderId, details)
          redemptions.push(redemption)
        }
      }
      
      // Trier par date (plus récent en premier)
      redemptions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      
      return redemptions
    } catch (error) {
      console.error('Error fetching user redemptions:', error)
      return []
    }
  }, [address, isConnected, userOrderIds])

  // ===== FONCTIONS D'ACTION =====

  /**
   * Racheter un bénéfice
   */
  const redeemBenefit = useCallback(async (benefitId: string): Promise<RedeemResult> => {
    if (!address || !isConnected) {
      toast.error('Wallet not connected')
      return { success: false, error: 'Wallet not connected' }
    }

    setIsLoading(true)

    try {
      // Vérifications préliminaires
      const canRedeem = await canUserRedeem(benefitId)
      if (!canRedeem) {
        toast.error('Cannot redeem this benefit')
        return { success: false, error: 'Cannot redeem benefit' }
      }

      // Appel au smart contract
      const result = await writeContract({
        address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        abi: BENEFITS_MANAGEMENT_CONFIG.abi,
        functionName: 'redeemBenefit',
        args: [benefitId as `0x${string}`],
        chain: base,
        account: address
      })

      // Toast de succès immédiat
      toast.success('Benefit redemption initiated!', {
        description: 'Please wait for transaction confirmation'
      })
      
      setLastActivity(`redeem_${benefitId}`)
      
      // Le orderId sera récupéré via les events de transaction
      return { success: true, txHash: result }

    } catch (error) {
      console.error('Benefit redemption failed:', error)
      toast.error('Failed to redeem benefit')
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected, writeContract, canUserRedeem])

  /**
   * Soumettre les informations de contact
   */
  const submitContactInfo = useCallback(async (orderId: string, email: string): Promise<ContactSubmitResult> => {
    if (!address || !isConnected) {
      return { success: false, error: 'Wallet not connected' }
    }

    try {
      // Générer le hash de contact
      const contactHash = BenefitsUtils.generateContactHash(email, orderId)
      
      // Stocker localement d'abord
      BenefitsContactStorage.save({
        orderId,
        email,
        benefitTitle: 'Benefit', // À améliorer avec le vrai titre
        benefitId: '', // À récupérer
        timestamp: new Date(),
        status: 'submitted'
      })

      // Soumettre le hash au contract (optionnel)
      await writeContract({
        address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        abi: BENEFITS_MANAGEMENT_CONFIG.abi,
        functionName: 'submitContactHash',
        args: [orderId, contactHash],
        chain: base,
        account: address
      })

      toast.success('Contact information submitted!', {
        description: 'Our team will contact you within 24-48h'
      })

      return { success: true }

    } catch (error) {
      console.error('Contact submission failed:', error)
      toast.error('Failed to submit contact information')
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }, [address, isConnected, writeContract])

  /**
   * Force le rechargement de toutes les données
   */
  const refresh = useCallback(() => {
    refetchActiveBenefits()
    refetchBalance()
    refetchUserOrders()
  }, [refetchActiveBenefits, refetchBalance, refetchUserOrders])

  // ===== EFFECTS =====

  // Gestion du succès des transactions
  useEffect(() => {
    if (isConfirmed && lastActivity) {
      if (lastActivity.startsWith('redeem_')) {
        toast.success('Benefit redemption confirmed!')
        
        // Extraire l'orderId des events de transaction
        if (txHash) {
          extractOrderIdFromTransaction(txHash).then(orderId => {
            if (orderId) {
              // Trigger modal de contact
              // Cette logique sera gérée par le composant parent
            }
          })
        }
      }
      
      // Refresh des données
      refresh()
      setLastActivity(null)
    }
  }, [isConfirmed, lastActivity, refresh, txHash])

  // Gestion des erreurs de transaction
  useEffect(() => {
    if (error) {
      console.error('Transaction error:', error)
      toast.error('Transaction failed')
      setLastActivity(null)
    }
  }, [error])

  /**
   * Extraire l'Order ID des events de transaction
   */
  const extractOrderIdFromTransaction = useCallback(async (txHash: string): Promise<string | null> => {
    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` })
      const logs = parseEventLogs({
        abi: BENEFITS_MANAGEMENT_CONFIG.abi,
        logs: receipt.logs,
      })
      
      const redemptionEvent = logs.find(log => log.eventName === 'BenefitRedeemed')
      if (redemptionEvent && redemptionEvent.args) {
        return redemptionEvent.args.orderId as string
      }
      
      return null
    } catch (error) {
      console.error('Error extracting order ID:', error)
      return null
    }
  }, [])

  return {
    // ===== DONNÉES =====
    userBalance: userAPXBalance ? BenefitsUtils.formatTokenAmount(BigInt(userAPXBalance)) : '0',
    isConnected,
    
    // ===== ÉTATS =====
    isLoading: isLoading || isPending || isConfirming,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    txHash,
    
    // ===== ACTIONS =====
    getAvailableBenefits,
    getUserRedemptions,
    redeemBenefit,
    submitContactInfo,
    refresh,
    
    // ===== UTILITAIRES =====
    formatTokenAmount: BenefitsUtils.formatTokenAmount,
    parseTokenAmount: BenefitsUtils.parseTokenAmount,
    canUserRedeem,
    getBenefitDetails
  }
}
```

### 2. useBenefitsAdmin - Hook Admin

Hook pour les fonctionnalités d'administration des bénéfices.

```typescript
// src/hooks/useBenefitsAdmin.ts
import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { toast } from 'sonner'
import { 
  BENEFITS_MANAGEMENT_CONFIG,
  BenefitsUtils,
  type CreateBenefitData,
  type UpdateBenefitData,
  type BenefitsStats
} from '@/config/benefitsManagement'
import { base } from 'viem/chains'
import { isAPXAdmin } from '@/config/apxToken'

/**
 * Hook pour les fonctionnalités admin du système Benefits
 */
export function useBenefitsAdmin() {
  const { address, isConnected } = useAccount()
  const { writeContract, data: txHash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const [isLoading, setIsLoading] = useState(false)
  const isAdmin = isConnected && address && isAPXAdmin(address)

  /**
   * Créer un nouveau bénéfice
   */
  const createBenefit = useCallback(async (benefitData: CreateBenefitData): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('Admin access required')
      return false
    }

    setIsLoading(true)

    try {
      const priceInWei = BenefitsUtils.parseTokenAmount(benefitData.priceAPX)
      
      await writeContract({
        address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        abi: BENEFITS_MANAGEMENT_CONFIG.abi,
        functionName: 'createBenefit',
        args: [
          benefitData.id as `0x${string}`,
          priceInWei,
          benefitData.title,
          benefitData.description,
          benefitData.mechanics,
          benefitData.guardrails,
          benefitData.tokenomics,
          benefitData.iconName,
          benefitData.colorClass,
          BigInt(benefitData.maxRedemptions)
        ],
        chain: base,
        account: address
      })

      toast.success('Benefit created successfully!')
      return true

    } catch (error) {
      console.error('Failed to create benefit:', error)
      toast.error('Failed to create benefit')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin, address, writeContract])

  /**
   * Mettre à jour un bénéfice existant
   */
  const updateBenefit = useCallback(async (benefitData: UpdateBenefitData): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('Admin access required')
      return false
    }

    setIsLoading(true)

    try {
      const priceInWei = benefitData.priceAPX ? BenefitsUtils.parseTokenAmount(benefitData.priceAPX) : 0n
      
      await writeContract({
        address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        abi: BENEFITS_MANAGEMENT_CONFIG.abi,
        functionName: 'updateBenefit',
        args: [
          benefitData.id as `0x${string}`,
          priceInWei,
          benefitData.title || '',
          benefitData.description || '',
          benefitData.isActive ?? true
        ],
        chain: base,
        account: address
      })

      toast.success('Benefit updated successfully!')
      return true

    } catch (error) {
      console.error('Failed to update benefit:', error)
      toast.error('Failed to update benefit')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin, address, writeContract])

  /**
   * Marquer un rachat comme traité
   */
  const markAsProcessed = useCallback(async (orderId: string): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('Admin access required')
      return false
    }

    try {
      await writeContract({
        address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        abi: BENEFITS_MANAGEMENT_CONFIG.abi,
        functionName: 'markAsProcessed',
        args: [orderId],
        chain: base,
        account: address
      })

      toast.success('Order marked as processed!')
      return true

    } catch (error) {
      console.error('Failed to mark order as processed:', error)
      toast.error('Failed to update order status')
      return false
    }
  }, [isAdmin, address, writeContract])

  /**
   * Récupérer toutes les commandes pour admin
   */
  const getAllRedemptions = useCallback(async () => {
    if (!isAdmin) return []

    try {
      // Cette fonction nécessiterait des améliorations au contract
      // Pour l'instant, on peut utiliser les events
      console.log('Fetching all redemptions for admin...')
      return []
    } catch (error) {
      console.error('Error fetching all redemptions:', error)
      return []
    }
  }, [isAdmin])

  /**
   * Exporter les contacts pour traitement manuel
   */
  const exportContacts = useCallback(() => {
    if (!isAdmin) {
      toast.error('Admin access required')
      return
    }

    try {
      const contacts = BenefitsContactStorage.getAll()
      const csv = BenefitsContactStorage.exportCSV()
      
      // Télécharger le CSV
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.setAttribute('hidden', '')
      a.setAttribute('href', url)
      a.setAttribute('download', `benefits-contacts-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      toast.success(`Exported ${contacts.length} contacts`)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export contacts')
    }
  }, [isAdmin])

  /**
   * Récupérer les statistiques pour le dashboard admin
   */
  const getStats = useCallback(async (): Promise<BenefitsStats | null> => {
    if (!isAdmin) return null

    try {
      const stats = await readContract({
        address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        abi: BENEFITS_MANAGEMENT_CONFIG.abi,
        functionName: 'getGlobalStats'
      })

      return BenefitsUtils.parseStatsFromContract(stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
      return null
    }
  }, [isAdmin])

  /**
   * Initialiser les bénéfices prédéfinis
   */
  const initializePredefinedBenefits = useCallback(async (): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('Admin access required')
      return false
    }

    try {
      await writeContract({
        address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        abi: BENEFITS_MANAGEMENT_CONFIG.abi,
        functionName: 'initializePredefinedBenefits',
        args: [],
        chain: base,
        account: address
      })

      toast.success('Predefined benefits initialized!')
      return true

    } catch (error) {
      console.error('Failed to initialize benefits:', error)
      toast.error('Failed to initialize benefits')
      return false
    }
  }, [isAdmin, address, writeContract])

  return {
    // ===== ÉTATS =====
    isAdmin,
    isLoading: isLoading || isPending || isConfirming,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    
    // ===== ACTIONS =====
    createBenefit,
    updateBenefit,
    markAsProcessed,
    getAllRedemptions,
    exportContacts,
    getStats,
    initializePredefinedBenefits
  }
}
```

### 3. useBenefitsContactStorage - Hook pour Stockage Local

Hook pour gérer le stockage local des contacts.

```typescript
// src/hooks/useBenefitsContactStorage.ts
import { useState, useEffect, useCallback } from 'react'
import type { BenefitContact } from '@/types/benefits'

/**
 * Service de stockage des contacts Benefits
 */
export class BenefitsContactStorage {
  private static readonly STORAGE_KEY = 'benefits_contacts'

  static save(contact: BenefitContact): void {
    const contacts = this.getAll()
    const existingIndex = contacts.findIndex(c => c.orderId === contact.orderId)
    
    if (existingIndex >= 0) {
      contacts[existingIndex] = contact
    } else {
      contacts.push(contact)
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(contacts))
  }

  static getAll(): BenefitContact[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading contacts from storage:', error)
      return []
    }
  }

  static getByOrderId(orderId: string): BenefitContact | null {
    const contacts = this.getAll()
    return contacts.find(c => c.orderId === orderId) || null
  }

  static remove(orderId: string): void {
    const contacts = this.getAll()
    const filtered = contacts.filter(c => c.orderId !== orderId)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
  }

  static clear(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  static exportCSV(): string {
    const contacts = this.getAll()
    if (contacts.length === 0) return ''

    const headers = ['Order ID', 'Email', 'Benefit Title', 'Timestamp', 'Status']
    const rows = contacts.map(contact => [
      contact.orderId,
      contact.email,
      contact.benefitTitle,
      contact.timestamp.toISOString(),
      contact.status
    ])

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
  }
}

/**
 * Hook pour interagir avec le stockage des contacts
 */
export function useBenefitsContactStorage() {
  const [contacts, setContacts] = useState<BenefitContact[]>([])

  const loadContacts = useCallback(() => {
    const storedContacts = BenefitsContactStorage.getAll()
    setContacts(storedContacts)
  }, [])

  const saveContact = useCallback((contact: BenefitContact) => {
    BenefitsContactStorage.save(contact)
    loadContacts() // Refresh state
  }, [loadContacts])

  const removeContact = useCallback((orderId: string) => {
    BenefitsContactStorage.remove(orderId)
    loadContacts() // Refresh state
  }, [loadContacts])

  const getContactByOrderId = useCallback((orderId: string) => {
    return BenefitsContactStorage.getByOrderId(orderId)
  }, [])

  const exportToCSV = useCallback(() => {
    return BenefitsContactStorage.exportCSV()
  }, [])

  const clearAll = useCallback(() => {
    BenefitsContactStorage.clear()
    setContacts([])
  }, [])

  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  return {
    contacts,
    saveContact,
    removeContact,
    getContactByOrderId,
    exportToCSV,
    clearAll,
    refresh: loadContacts
  }
}
```

### 4. useBenefitsStore - Store Zustand

Store global pour la gestion d'état des Benefits.

```typescript
// src/store/useBenefitsStore.ts
import { create } from 'zustand'
import type { 
  Benefit, 
  BenefitRedemption, 
  BenefitContact,
  BenefitsStats
} from '@/types/benefits'

interface BenefitsState {
  // Data
  benefits: Benefit[]
  userRedemptions: BenefitRedemption[]
  contacts: BenefitContact[]
  stats: BenefitsStats | null
  
  // UI State
  isLoading: boolean
  error: string | null
  lastFetched: Date | null
  
  // Cache
  cachedUserBalance: string
}

interface BenefitsActions {
  // Data setters
  setBenefits: (benefits: Benefit[]) => void
  setUserRedemptions: (redemptions: BenefitRedemption[]) => void
  setContacts: (contacts: BenefitContact[]) => void
  setStats: (stats: BenefitsStats | null) => void
  
  // Individual item updates
  addBenefit: (benefit: Benefit) => void
  updateBenefit: (benefitId: string, updates: Partial<Benefit>) => void
  addRedemption: (redemption: BenefitRedemption) => void
  updateRedemption: (orderId: string, updates: Partial<BenefitRedemption>) => void
  addContact: (contact: BenefitContact) => void
  updateContact: (orderId: string, updates: Partial<BenefitContact>) => void
  
  // UI state management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  setLastFetched: (date: Date) => void
  
  // Cache management
  setCachedUserBalance: (balance: string) => void
  
  // Bulk actions
  clearAll: () => void
  refresh: () => void
}

export const useBenefitsStore = create<BenefitsState & BenefitsActions>((set, get) => ({
  // ===== INITIAL STATE =====
  benefits: [],
  userRedemptions: [],
  contacts: [],
  stats: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  cachedUserBalance: '0',

  // ===== DATA SETTERS =====
  setBenefits: (benefits) => {
    set({ benefits, lastFetched: new Date() })
  },

  setUserRedemptions: (userRedemptions) => {
    set({ userRedemptions })
  },

  setContacts: (contacts) => {
    set({ contacts })
  },

  setStats: (stats) => {
    set({ stats })
  },

  // ===== INDIVIDUAL UPDATES =
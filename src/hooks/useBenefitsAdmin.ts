import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { toast } from 'sonner'
import { base } from 'viem/chains'
import { 
  BENEFITS_MANAGEMENT_CONFIG,
  BenefitsUtils,
  PREDEFINED_BENEFITS
} from '@/config/benefitsManagement'
import { isAPXAdmin } from '@/config/apxToken'
import type { 
  CreateBenefitData,
  UpdateBenefitData,
  BenefitsStats,
  BenefitContact
} from '@/types/benefits'

/**
 * Hook pour les fonctionnalités admin du système Benefits
 */
export function useBenefitsAdmin() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
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
      // Si le contract n'est pas déployé, simuler la création
      if (BENEFITS_MANAGEMENT_CONFIG.contractAddress === '0x0000000000000000000000000000000000000000') {
        console.log('Demo: Creating benefit', benefitData)
        toast.success('Demo benefit created successfully!', {
          description: 'This is a demo creation. In production, the benefit would be stored on-chain.'
        })
        return true
      }

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
      // Si le contract n'est pas déployé, simuler la mise à jour
      if (BENEFITS_MANAGEMENT_CONFIG.contractAddress === '0x0000000000000000000000000000000000000000') {
        console.log('Demo: Updating benefit', benefitData)
        toast.success('Demo benefit updated successfully!')
        return true
      }

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
      // Si le contract n'est pas déployé, marquer localement
      if (BENEFITS_MANAGEMENT_CONFIG.contractAddress === '0x0000000000000000000000000000000000000000') {
        console.log('Demo: Marking order as processed', orderId)
        toast.success('Demo order marked as processed!')
        return true
      }

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
      // Si le contract n'est pas déployé, récupérer les données de démo
      if (BENEFITS_MANAGEMENT_CONFIG.contractAddress === '0x0000000000000000000000000000000000000000') {
        // Récupérer toutes les redemptions stockées localement
        const allRedemptions = []
        
        // Parcourir tous les utilisateurs possibles (simulation)
        const demoUsers = ['0x1234', '0x5678', '0x9abc'] // Simuler quelques utilisateurs
        
        for (const user of demoUsers) {
          const userKey = `benefit_redemptions_${user}`
          const userRedemptions = JSON.parse(localStorage.getItem(userKey) || '[]')
          allRedemptions.push(...userRedemptions)
        }
        
        return allRedemptions
      }

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
      const contactsKey = 'benefit_contacts'
      const storedContacts = localStorage.getItem(contactsKey)
      const contacts: BenefitContact[] = storedContacts ? JSON.parse(storedContacts) : []
      
      if (contacts.length === 0) {
        toast.info('No contacts to export')
        return
      }

      // Créer le CSV
      const headers = ['Order ID', 'Email', 'Benefit Title', 'Timestamp', 'Status']
      const csvContent = [
        headers.join(','),
        ...contacts.map(contact => [
          contact.orderId,
          contact.email,
          contact.benefitTitle,
          contact.timestamp.toISOString(),
          contact.status
        ].map(field => `"${field}"`).join(','))
      ].join('\n')
      
      // Télécharger le CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `benefits-contacts-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
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
      // Si le contract n'est pas déployé, créer des stats de démo
      if (BENEFITS_MANAGEMENT_CONFIG.contractAddress === '0x0000000000000000000000000000000000000000') {
        const contactsKey = 'benefit_contacts'
        const contacts: BenefitContact[] = JSON.parse(localStorage.getItem(contactsKey) || '[]')
        
        // Statistiques simulées
        return {
          totalBenefits: Object.keys(PREDEFINED_BENEFITS).length,
          activeBenefits: Object.keys(PREDEFINED_BENEFITS).length,
          totalRedemptions: contacts.length,
          totalAPXBurned: (contacts.length * 1500).toString(), // Moyenne de 1500 APX par rachat
          topBenefit: {
            title: '1:1 with the Creator',
            redemptions: Math.floor(contacts.length * 0.4)
          },
          recentActivity: []
        }
      }

      // Récupérer les vraies stats du contract
      const stats = await publicClient?.readContract({
        address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        abi: BENEFITS_MANAGEMENT_CONFIG.abi,
        functionName: 'getGlobalStats'
      } as any)

      if (stats) {
        return BenefitsUtils.parseStatsFromContract(stats as any[])
      }
      return null
    } catch (error) {
      console.error('Error fetching stats:', error)
      return null
    }
  }, [isAdmin, publicClient])

  /**
   * Initialiser les bénéfices prédéfinis
   */
  const initializePredefinedBenefits = useCallback(async (): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('Admin access required')
      return false
    }

    try {
      // Si le contract n'est pas déployé, simuler l'initialisation
      if (BENEFITS_MANAGEMENT_CONFIG.contractAddress === '0x0000000000000000000000000000000000000000') {
        console.log('Demo: Initializing predefined benefits')
        toast.success('Demo predefined benefits initialized!', {
          description: 'In production, 4 benefits would be created on-chain.'
        })
        return true
      }

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

  /**
   * Nettoyer les données locales (utilitaire admin)
   */
  const clearLocalData = useCallback(() => {
    if (!isAdmin) {
      toast.error('Admin access required')
      return
    }

    try {
      // Nettoyer toutes les données Benefits du localStorage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('benefit_') || key.includes('benefits'))) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      toast.success(`Cleared ${keysToRemove.length} local data entries`)
    } catch (error) {
      console.error('Failed to clear local data:', error)
      toast.error('Failed to clear local data')
    }
  }, [isAdmin])

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
    initializePredefinedBenefits,
    clearLocalData
  }
}

/**
 * Hook simplifié pour les statistiques admin uniquement
 */
export function useBenefitsStats() {
  const { getStats, isAdmin } = useBenefitsAdmin()
  
  return {
    getStats,
    isAdmin
  }
}
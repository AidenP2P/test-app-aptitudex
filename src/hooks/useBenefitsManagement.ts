import { useState, useEffect, useCallback } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { toast } from 'sonner'
import { parseEventLogs } from 'viem'
import { base } from 'viem/chains'
import {
  BENEFITS_MANAGEMENT_CONFIG,
  BenefitsUtils,
  PREDEFINED_BENEFITS,
} from '@/config/benefitsManagement'
import { APX_TOKEN_CONFIG, APX_TOKEN_ABI } from '@/config/apxToken'
import type { 
  Benefit, 
  BenefitRedemption, 
  RedeemResult, 
  ContactSubmitResult 
} from '@/types/benefits'

/**
 * Hook principal pour les interactions Benefits côté utilisateur
 */
export function useBenefitsManagement() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
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
    query: { enabled: isConnected && BENEFITS_MANAGEMENT_CONFIG.contractAddress !== '0x0000000000000000000000000000000000000000' }
  })

  // Balance APX de l'utilisateur
  const { data: userAPXBalance, refetch: refetchBalance } = useReadContract({
    address: APX_TOKEN_CONFIG.address,
    abi: APX_TOKEN_ABI,
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
    query: { enabled: isConnected && Boolean(address) && BENEFITS_MANAGEMENT_CONFIG.contractAddress !== '0x0000000000000000000000000000000000000000' }
  })

  // ===== FONCTIONS UTILITAIRES =====

  /**
   * Récupérer les détails d'un bénéfice depuis le contract
   */
  const getBenefitDetails = useCallback(async (benefitId: string) => {
    if (!isConnected || !publicClient) return null

    try {
      // Si le contract n'est pas déployé, utiliser les bénéfices prédéfinis
      if (BENEFITS_MANAGEMENT_CONFIG.contractAddress === '0x0000000000000000000000000000000000000000') {
        const predefined = Object.values(PREDEFINED_BENEFITS).find(b => b.id === benefitId)
        if (predefined) {
          return {
            ...predefined,
            totalRedeemed: 0,
            createdAt: new Date(),
            isActive: true
          }
        }
        return null
      }

      // Appel au contract pour récupérer les détails
      const details = await publicClient.readContract({
        address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        abi: BENEFITS_MANAGEMENT_CONFIG.abi,
        functionName: 'getBenefitDetails',
        args: [benefitId as `0x${string}`]
      } as any) as readonly [bigint, string, string, string, string, string, string, string, boolean, bigint, bigint]

      // Conversion vers format Benefit
      return BenefitsUtils.parseBenefitFromContract(benefitId, Array.from(details))
    } catch (error) {
      console.error('Error fetching benefit details:', error)
      return null
    }
  }, [isConnected, publicClient])

  /**
   * Vérifier si un utilisateur peut racheter un bénéfice
   */
  const canUserRedeem = useCallback(async (benefitId: string): Promise<boolean> => {
    if (!address || !isConnected) return false

    try {
      // Si le contract n'est pas déployé, vérifier juste le balance
      if (BENEFITS_MANAGEMENT_CONFIG.contractAddress === '0x0000000000000000000000000000000000000000') {
        const predefined = Object.values(PREDEFINED_BENEFITS).find(b => b.id === benefitId)
        if (!predefined) return false
        
        const userBalance = userAPXBalance ? BenefitsUtils.formatTokenAmount(BigInt(userAPXBalance)) : '0'
        return parseInt(userBalance) >= parseInt(predefined.priceAPX)
      }

      const canRedeem = await publicClient?.readContract({
        address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        abi: BENEFITS_MANAGEMENT_CONFIG.abi,
        functionName: 'canRedeemBenefit',
        args: [address, benefitId as `0x${string}`]
      } as any)
      return Boolean(canRedeem)
    } catch (error) {
      console.error('Error checking redeem eligibility:', error)
      return false
    }
  }, [address, isConnected, publicClient, userAPXBalance])

  /**
   * Vérifier si un utilisateur a déjà racheté un bénéfice
   */
  const isUserRedeemed = useCallback(async (benefitId: string): Promise<boolean> => {
    if (!address || !isConnected) return false

    try {
      // Si le contract n'est pas déployé, vérifier le localStorage
      if (BENEFITS_MANAGEMENT_CONFIG.contractAddress === '0x0000000000000000000000000000000000000000') {
        const localKey = `benefit_redeemed_${benefitId}_${address}`
        return localStorage.getItem(localKey) === 'true'
      }

      const isRedeemed = await publicClient?.readContract({
        address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        abi: BENEFITS_MANAGEMENT_CONFIG.abi,
        functionName: 'userRedeemed',
        args: [address, benefitId as `0x${string}`]
      } as any)
      return Boolean(isRedeemed)
    } catch (error) {
      console.error('Error checking redemption status:', error)
      return false
    }
  }, [address, isConnected, publicClient])

  /**
   * Récupérer tous les bénéfices disponibles avec état utilisateur
   */
  const getAvailableBenefits = useCallback(async (): Promise<Benefit[]> => {
    if (!isConnected || !address) return []

    try {
      console.log('🔍 Fetching available benefits...')
      
      const allBenefits: Benefit[] = []
      
      // Si le contract n'est pas déployé, utiliser les bénéfices prédéfinis
      if (BENEFITS_MANAGEMENT_CONFIG.contractAddress === '0x0000000000000000000000000000000000000000') {
        for (const [key, predefined] of Object.entries(PREDEFINED_BENEFITS)) {
          const canRedeem = await canUserRedeem(predefined.id)
          const isRedeemed = await isUserRedeemed(predefined.id)
          
          const benefit: Benefit = {
            ...predefined,
            totalRedeemed: 0,
            createdAt: new Date(),
            isActive: true,
            canRedeem: canRedeem && !isRedeemed,
            isRedeemed,
            isAvailable: true,
            remainingSlots: predefined.maxRedemptions > 0 ? predefined.maxRedemptions : undefined
          }
          
          allBenefits.push(benefit)
        }
      } else {
        // Récupérer les IDs des bénéfices actifs du contract
        const activeIds = (activeBenefitIds as string[]) || []
        
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
      }

      console.log('🎯 Available benefits:', allBenefits)
      return allBenefits
      
    } catch (error) {
      console.error('❌ Error fetching benefits:', error)
      return []
    }
  }, [isConnected, address, activeBenefitIds, userAPXBalance, getBenefitDetails, canUserRedeem, isUserRedeemed])

  /**
   * Récupérer l'historique des rachats de l'utilisateur
   */
  const getUserRedemptions = useCallback(async (): Promise<BenefitRedemption[]> => {
    if (!address || !isConnected) return []

    try {
      // Si le contract n'est pas déployé, récupérer du localStorage
      if (BENEFITS_MANAGEMENT_CONFIG.contractAddress === '0x0000000000000000000000000000000000000000') {
        const localKey = `benefit_redemptions_${address}`
        const stored = localStorage.getItem(localKey)
        return stored ? JSON.parse(stored) : []
      }

      if (!userOrderIds) return []

      const redemptions: BenefitRedemption[] = []
      
      for (const orderId of userOrderIds as string[]) {
        const details = await publicClient?.readContract({
          address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
          abi: BENEFITS_MANAGEMENT_CONFIG.abi,
          functionName: 'getRedemptionDetails',
          args: [orderId]
        } as any) as readonly [`0x${string}`, `0x${string}`, bigint, bigint, boolean, boolean]
        
        if (details) {
          const redemption = BenefitsUtils.parseRedemptionFromContract(orderId, Array.from(details))
          
          // Ajouter des données enrichies
          const benefitDetails = await getBenefitDetails(redemption.benefitId)
          
          const enrichedRedemption: BenefitRedemption = {
            ...redemption,
            benefitTitle: benefitDetails?.title || 'Unknown Benefit',
            txHash: '', // À récupérer depuis les events
            status: redemption.isProcessed ? 'fulfilled' : 
                   redemption.contactSubmitted ? 'pending_process' : 'pending_contact',
            timeAgo: BenefitsUtils.getTimeAgo(redemption.timestamp)
          }
          
          redemptions.push(enrichedRedemption)
        }
      }
      
      // Trier par date (plus récent en premier)
      redemptions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      
      return redemptions
    } catch (error) {
      console.error('Error fetching user redemptions:', error)
      return []
    }
  }, [address, isConnected, userOrderIds, publicClient, getBenefitDetails])

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

      // Si le contract n'est pas déployé, simuler le rachat
      if (BENEFITS_MANAGEMENT_CONFIG.contractAddress === '0x0000000000000000000000000000000000000000') {
        // Marquer comme racheté dans localStorage
        const localKey = `benefit_redeemed_${benefitId}_${address}`
        localStorage.setItem(localKey, 'true')
        
        // Générer un orderId simulé
        const orderId = `BEN-DEMO-${Date.now()}`
        
        // Stocker la redemption
        const redemption: BenefitRedemption = {
          orderId,
          benefitId,
          benefitTitle: Object.values(PREDEFINED_BENEFITS).find(b => b.id === benefitId)?.title || 'Demo Benefit',
          user: address,
          apxBurned: Object.values(PREDEFINED_BENEFITS).find(b => b.id === benefitId)?.priceAPX || '0',
          timestamp: new Date(),
          txHash: `0x${'demo'.repeat(16)}`,
          isProcessed: false,
          contactSubmitted: false,
          status: 'pending_contact',
          timeAgo: 'Just now'
        }
        
        const localRedemptionsKey = `benefit_redemptions_${address}`
        const existingRedemptions = JSON.parse(localStorage.getItem(localRedemptionsKey) || '[]')
        existingRedemptions.unshift(redemption)
        localStorage.setItem(localRedemptionsKey, JSON.stringify(existingRedemptions))
        
        toast.success('Demo benefit redeemed!', {
          description: 'This is a demo redemption. In production, APX tokens would be burned.'
        })
        
        return { success: true, orderId, txHash: redemption.txHash }
      }

      // Appel au smart contract réel
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
      return { success: true, txHash: 'pending' }

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
      // Stocker localement d'abord
      const contact = {
        orderId,
        email,
        benefitTitle: 'Benefit', // À améliorer avec le vrai titre
        benefitId: '', // À récupérer
        timestamp: new Date(),
        status: 'submitted' as const
      }
      
      const contactsKey = `benefit_contacts`
      const existingContacts = JSON.parse(localStorage.getItem(contactsKey) || '[]')
      existingContacts.push(contact)
      localStorage.setItem(contactsKey, JSON.stringify(existingContacts))

      // Si le contract est déployé, soumettre le hash
      if (BENEFITS_MANAGEMENT_CONFIG.contractAddress !== '0x0000000000000000000000000000000000000000') {
        // Générer le hash de contact
        const contactHash = BenefitsUtils.generateContactHash(email, orderId)
        
        await writeContract({
          address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
          abi: BENEFITS_MANAGEMENT_CONFIG.abi,
          functionName: 'submitContactHash',
          args: [orderId, contactHash as `0x${string}`],
          chain: base,
          account: address
        })
      }

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

  /**
   * Extraire l'Order ID des events de transaction
   */
  const extractOrderIdFromTransaction = useCallback(async (txHash: string): Promise<string | null> => {
    if (!publicClient) return null
    
    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` })
      const logs = parseEventLogs({
        abi: BENEFITS_MANAGEMENT_CONFIG.abi,
        logs: receipt.logs,
      })
      
      const redemptionEvent = logs.find(log => log.eventName === 'BenefitRedeemed')
      if (redemptionEvent && redemptionEvent.args) {
        return (redemptionEvent.args as any).orderId as string
      }
      
      return null
    } catch (error) {
      console.error('Error extracting order ID:', error)
      return null
    }
  }, [publicClient])

  // ===== EFFECTS =====

  // Gestion du succès des transactions
  useEffect(() => {
    if (isConfirmed && lastActivity && txHash) {
      if (lastActivity.startsWith('redeem_')) {
        toast.success('Benefit redemption confirmed!')
        
        // Extraire l'orderId des events de transaction
        extractOrderIdFromTransaction(txHash).then(orderId => {
          if (orderId) {
            // Trigger modal de contact via event custom
            window.dispatchEvent(new CustomEvent('benefitRedeemed', { 
              detail: { orderId, benefitId: lastActivity.replace('redeem_', '') }
            }))
          }
        })
      }
      
      // Refresh des données
      refresh()
      setLastActivity(null)
    }
  }, [isConfirmed, lastActivity, refresh, txHash, extractOrderIdFromTransaction])

  // Gestion des erreurs de transaction
  useEffect(() => {
    if (error) {
      console.error('Transaction error:', error)
      toast.error('Transaction failed')
      setLastActivity(null)
    }
  }, [error])

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

/**
 * Hook simplifié pour les composants qui ont juste besoin des données
 */
export function useBenefitsData() {
  const { 
    userBalance,
    isConnected,
    isLoading,
    getAvailableBenefits,
    refresh
  } = useBenefitsManagement()
  
  return {
    userBalance,
    isConnected,
    isLoading,
    getAvailableBenefits,
    refresh
  }
}
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Zap, Gift } from 'lucide-react'
import { BenefitCard } from './BenefitCard'
import { PostRedemptionModal } from './PostRedemptionModal'
import { useBenefitsManagement } from '@/hooks/useBenefitsManagement'
import { useAppStore } from '@/store/useAppStore'
import type { Benefit } from '@/types/benefits'

interface BenefitsSectionProps {
  className?: string
}

export function BenefitsSection({ className = '' }: BenefitsSectionProps) {
  const { isConnected } = useAppStore()
  const {
    getAvailableBenefits,
    redeemBenefit,
    submitContactInfo,
    isLoading
  } = useBenefitsManagement()

  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [showContactModal, setShowContactModal] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState('')
  const [currentBenefitTitle, setCurrentBenefitTitle] = useState('')
  const [isSubmittingContact, setIsSubmittingContact] = useState(false)

  // Charger les bénéfices au montage
  useEffect(() => {
    if (isConnected) {
      loadBenefits()
    }
  }, [isConnected])

  // Écouter l'événement de rachat réussi
  useEffect(() => {
    const handleBenefitRedeemed = (event: CustomEvent) => {
      const { orderId, benefitId } = event.detail
      const benefit = benefits.find(b => b.id === benefitId)
      if (benefit && orderId) {
        setCurrentOrderId(orderId)
        setCurrentBenefitTitle(benefit.title)
        setShowContactModal(true)
      }
    }

    window.addEventListener('benefitRedeemed', handleBenefitRedeemed as EventListener)
    return () => window.removeEventListener('benefitRedeemed', handleBenefitRedeemed as EventListener)
  }, [benefits])

  const loadBenefits = async () => {
    try {
      const availableBenefits = await getAvailableBenefits()
      setBenefits(availableBenefits)
    } catch (error) {
      console.error('Failed to load benefits:', error)
    }
  }

  const handleRedeem = async (benefitId: string) => {
    try {
      console.log('🎯 Redeeming benefit:', benefitId)
      const result = await redeemBenefit(benefitId)
      if (result.success) {
        console.log('✅ Redemption successful:', result)
        // Reload benefits to update states
        await loadBenefits()
        
        // If we got an orderId immediately (demo mode), show modal
        if (result.orderId && result.orderId !== 'pending') {
          const benefit = benefits.find(b => b.id === benefitId)
          setCurrentOrderId(result.orderId)
          setCurrentBenefitTitle(benefit?.title || 'Benefit')
          setShowContactModal(true)
        }
      }
    } catch (error) {
      console.error('Failed to redeem benefit:', error)
    }
  }

  const handleContactSubmit = async (email: string) => {
    setIsSubmittingContact(true)
    try {
      await submitContactInfo(currentOrderId, email)
    } catch (error) {
      console.error('Failed to submit contact:', error)
      throw error
    } finally {
      setIsSubmittingContact(false)
    }
  }

  const handleCloseModal = () => {
    setShowContactModal(false)
    setCurrentOrderId('')
    setCurrentBenefitTitle('')
  }

  const availableCount = benefits.filter(b => b.canRedeem).length
  const totalCount = benefits.length

  if (!isConnected) {
    return (
      <div id="my-benefits" className={`mt-8 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">My Benefits</h3>
          <Badge variant="secondary" className="text-xs">
            Connect wallet
          </Badge>
        </div>

        <div className="text-center py-8">
          <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Connect your wallet to view available benefits
          </p>
        </div>
      </div>
    )
  }

  return (
    <div id="my-benefits" className={`mt-8 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">My Benefits</h3>
        <Badge variant="secondary" className="text-xs">
          {availableCount} available / {totalCount} total
        </Badge>
      </div>

      {/* About Benefits */}
      <div className="mb-6 p-4 bg-card border rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-foreground mb-2">About Your Benefits</h4>
            <p className="text-sm text-muted-foreground">
              Exchange your APX tokens for exclusive benefits. Each benefit can only be 
              redeemed once per wallet and tokens are permanently burned upon redemption.
            </p>
          </div>
        </div>
      </div>

      {/* Alpha Note */}
      <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg dark:bg-purple-950/20 dark:border-purple-900">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
              Alpha Version - Manual Processing
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
              During our alpha launch, benefits are processed manually by our team 
              within 24-48 hours after contact submission.
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
              Full automation coming soon! 🚀
            </p>
          </div>
        </div>
      </div>

      {/* Benefits List */}
      {isLoading ? (
        <div className="space-y-4">
          {/* Loading skeletons */}
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-6 rounded-xl border bg-card animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-xl"></div>
                <div className="flex-1">
                  <div className="w-48 h-5 bg-muted rounded mb-2"></div>
                  <div className="w-64 h-4 bg-muted rounded mb-4"></div>
                  <div className="w-24 h-8 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : benefits.length === 0 ? (
        <div className="text-center py-8">
          <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No benefits available at the moment
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {benefits.map(benefit => (
            <BenefitCard
              key={benefit.id}
              benefit={benefit}
              onRedeem={handleRedeem}
              isRedeeming={isLoading}
            />
          ))}
        </div>
      )}

      {/* Terms Note */}
      <div className="mt-6 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
        <strong>Terms:</strong> Benefits are non-refundable. APX tokens are permanently burned upon redemption. 
        Processing times may vary. Limited quantities available.
      </div>

      {/* Contact Modal */}
      <PostRedemptionModal
        orderId={currentOrderId}
        benefitTitle={currentBenefitTitle}
        isOpen={showContactModal}
        onSubmit={handleContactSubmit}
        onClose={handleCloseModal}
        isSubmitting={isSubmittingContact}
      />
    </div>
  )
}
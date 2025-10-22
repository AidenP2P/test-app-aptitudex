
# 🎨 UI Components Specification - Benefits System

## Overview

Cette spécification définit tous les composants UI nécessaires pour le système de Benefits, en s'appuyant sur le design system existant et les composants Shadcn/UI déjà présents dans le projet.

## 🏗️ Component Architecture

### Design System Integration

Le système de Benefits s'intègre parfaitement avec l'architecture UI existante :
- **Base** : Shadcn/UI components (Button, Card, Dialog, Badge, etc.)
- **Styling** : Tailwind CSS avec classes personnalisées
- **Icons** : Lucide React
- **Layout** : Responsive design mobile-first
- **Theme** : Support du dark/light mode

## 📱 Core Components

### 1. BenefitCard Component

Composant principal pour afficher un bénéfice individuel dans la liste.

```typescript
// src/components/BenefitCard.tsx
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  UserCheck, Zap, DollarSign, Gift, 
  CheckCircle, Clock, AlertCircle 
} from 'lucide-react'
import type { Benefit } from '@/types/benefits'

interface BenefitCardProps {
  benefit: Benefit
  onRedeem: (benefitId: string) => Promise<void>
  onViewDetails?: (benefit: Benefit) => void
  disabled?: boolean
  className?: string
  isRedeeming?: boolean
}

export function BenefitCard({ 
  benefit, 
  onRedeem, 
  onViewDetails, 
  disabled = false,
  className = '',
  isRedeeming = false 
}: BenefitCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  // Dynamic icon mapping
  const getIcon = () => {
    const iconMap = {
      UserCheck, Zap, DollarSign, Gift
    }
    const IconComponent = iconMap[benefit.iconName as keyof typeof iconMap] || Gift
    return IconComponent
  }
  
  const handleRedeem = async () => {
    if (disabled || !benefit.canRedeem) return
    
    setIsLoading(true)
    try {
      await onRedeem(benefit.id)
    } finally {
      setIsLoading(false)
    }
  }
  
  const Icon = getIcon()
  
  return (
    <Card className={`${benefit.colorClass} border-primary/20 overflow-hidden ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
                {benefit.title}
              </h3>
              <p className="text-white/80 text-sm leading-relaxed line-clamp-2">
                {benefit.description}
              </p>
            </div>

            {/* Mechanics & Guardrails */}
            <div className="mb-4 space-y-2">
              <div className="text-white/70 text-xs">
                <strong>How:</strong> {benefit.mechanics}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs bg-white/10 text-white/90 border-white/20">
                  {benefit.guardrails}
                </Badge>
                <Badge variant="outline" className="text-xs bg-white/5 text-white/80 border-white/30">
                  {benefit.tokenomics}
                </Badge>
              </div>
            </div>

            {/* Availability Info */}
            {benefit.maxRedemptions > 0 && (
              <div className="mb-4 text-white/70 text-xs">
                {benefit.totalRedeemed}/{benefit.maxRedemptions} claimed
                {benefit.remainingSlots && benefit.remainingSlots <= 10 && (
                  <span className="text-yellow-200 ml-2">
                    Only {benefit.remainingSlots} left!
                  </span>
                )}
              </div>
            )}

            {/* Action Area */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              {/* Price Display */}
              <div className="text-white text-center sm:text-left">
                <span className="text-lg sm:text-2xl font-bold">{benefit.priceAPX}</span>
                <span className="text-white/80 ml-1 text-sm sm:text-base">APX</span>
              </div>

              {/* Action Button */}
              {benefit.isRedeemed ? (
                <Button
                  disabled
                  className="bg-green-500/20 text-green-200 hover:bg-green-500/30 cursor-not-allowed border border-green-500/30 text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto sm:h-10 flex-shrink-0"
                >
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Redeemed ✓
                </Button>
              ) : !benefit.isAvailable ? (
                <Button
                  disabled
                  className="bg-red-500/20 text-red-200 hover:bg-red-500/30 cursor-not-allowed border border-red-500/30 text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto sm:h-10 flex-shrink-0"
                >
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Sold Out
                </Button>
              ) : !benefit.canRedeem ? (
                <Button
                  disabled
                  className="bg-white/10 text-white/50 cursor-not-allowed text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto sm:h-10 flex-shrink-0"
                >
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Insufficient APX</span>
                  <span className="sm:hidden">No APX</span>
                </Button>
              ) : (
                <Button
                  onClick={handleRedeem}
                  disabled={disabled || isLoading || isRedeeming}
                  className="bg-white text-primary hover:bg-white/90 font-medium text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto sm:h-10 flex-shrink-0"
                >
                  {isLoading || isRedeeming ? (
                    <>
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                      <span className="hidden sm:inline">Redeeming...</span>
                      <span className="sm:hidden">Redeeming</span>
                    </>
                  ) : (
                    <>
                      <Gift className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Redeem</span>
                      <span className="sm:hidden">Redeem</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 2. BenefitsList Component

Container pour afficher tous les bénéfices avec filtres et tri.

```typescript
// src/components/BenefitsList.tsx
import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Gift, Filter, SortAsc } from 'lucide-react'
import { BenefitCard } from './BenefitCard'
import type { Benefit, BenefitCategory, BenefitsSortOption } from '@/types/benefits'

interface BenefitsListProps {
  benefits: Benefit[]
  isLoading?: boolean
  onRedeem: (benefitId: string) => Promise<void>
  filterCategory?: BenefitCategory
  sortBy?: BenefitsSortOption
  className?: string
}

export function BenefitsList({
  benefits,
  isLoading = false,
  onRedeem,
  filterCategory,
  sortBy = 'newest',
  className = ''
}: BenefitsListProps) {
  const [selectedCategory, setSelectedCategory] = useState<BenefitCategory | 'all'>('all')
  const [selectedSort, setSelectedSort] = useState<BenefitsSortOption>(sortBy)

  // Filter and sort benefits
  const processedBenefits = useMemo(() => {
    let filtered = benefits

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(benefit => benefit.category === selectedCategory)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'price_asc':
          return parseInt(a.priceAPX) - parseInt(b.priceAPX)
        case 'price_desc':
          return parseInt(b.priceAPX) - parseInt(a.priceAPX)
        case 'popularity':
          return b.totalRedeemed - a.totalRedeemed
        case 'ending_soon':
          if (a.maxRedemptions === 0) return 1
          if (b.maxRedemptions === 0) return -1
          const aRemaining = a.maxRedemptions - a.totalRedeemed
          const bRemaining = b.maxRedemptions - b.totalRedeemed
          return aRemaining - bRemaining
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return filtered
  }, [benefits, selectedCategory, selectedSort])

  const availableCount = processedBenefits.filter(b => b.canRedeem).length
  const totalCount = processedBenefits.length

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Loading skeletons */}
        {[1, 2, 3].map(i => (
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
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Available Benefits</h3>
          <Badge variant="secondary" className="text-xs">
            {availableCount} available / {totalCount} total
          </Badge>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="access">Access</SelectItem>
              <SelectItem value="reward">Rewards</SelectItem>
              <SelectItem value="contest">Contests</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSort} onValueChange={setSelectedSort}>
            <SelectTrigger className="w-full sm:w-48">
              <SortAsc className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="popularity">Most Popular</SelectItem>
              <SelectItem value="ending_soon">Ending Soon</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Benefits Grid */}
      {processedBenefits.length === 0 ? (
        <div className="text-center py-12">
          <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {selectedCategory === 'all' 
              ? 'No benefits available' 
              : `No ${selectedCategory} benefits available`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {processedBenefits.map(benefit => (
            <BenefitCard
              key={benefit.id}
              benefit={benefit}
              onRedeem={onRedeem}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

### 3. PostRedemptionModal Component

Modal pour collecter l'email après un rachat réussi.

```typescript
// src/components/PostRedemptionModal.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Mail, Info, ExternalLink } from 'lucide-react'

interface PostRedemptionModalProps {
  orderId: string
  benefitTitle: string
  isOpen: boolean
  onSubmit: (email: string) => Promise<void>
  onClose: () => void
  isSubmitting?: boolean
}

export function PostRedemptionModal({
  orderId,
  benefitTitle,
  isOpen,
  onSubmit,
  onClose,
  isSubmitting = false
}: PostRedemptionModalProps) {
  const [email, setEmail] = useState('')
  const [isValid, setIsValid] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    setIsValid(validateEmail(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || isSubmitting) return

    try {
      await onSubmit(email)
      setSubmitted(true)
      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose()
        setSubmitted(false)
        setEmail('')
      }, 3000)
    } catch (error) {
      console.error('Failed to submit contact:', error)
    }
  }

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Contact Submitted!</h3>
            <p className="text-muted-foreground mb-4">
              Our team will contact you at <strong>{email}</strong> to arrange your benefit.
            </p>
            <div className="bg-muted p-3 rounded-lg text-sm">
              <strong>Order ID:</strong> {orderId}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Contact Information Required
          </DialogTitle>
          <DialogDescription>
            To receive your <strong>{benefitTitle}</strong>, please provide your email address.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={isValid ? 'border-green-500' : ''}
              required
            />
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Manual Process:</strong> Our team will manually process your benefit 
              within 24-48h and contact you via email with next steps.
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
            <div><strong>Order ID:</strong> {orderId}</div>
            <div><strong>Benefit:</strong> {benefitTitle}</div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Skip for Now
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-transparent border-t-current" />
                  Submitting...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Submit Contact
                </>
              )}
            </Button>
          </div>

          <div className="text-center">
            <Button variant="link" size="sm" className="text-xs text-muted-foreground">
              <ExternalLink className="w-3 h-3 mr-1" />
              Terms & Privacy Policy
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### 4. RedemptionHistoryItem Component

Composant pour afficher un historique de rachat dans la liste.

```typescript
// src/components/RedemptionHistoryItem.tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  CheckCircle, Clock, Mail, ExternalLink, 
  UserCheck, Zap, DollarSign, Gift 
} from 'lucide-react'
import type { BenefitRedemption } from '@/types/benefits'

interface RedemptionHistoryItemProps {
  redemption: BenefitRedemption
  onViewDetails?: (redemption: BenefitRedemption) => void
  onSubmitContact?: (orderId: string) => void
  showContactAction?: boolean
}

export function RedemptionHistoryItem({
  redemption,
  onViewDetails,
  onSubmitContact,
  showContactAction = true
}: RedemptionHistoryItemProps) {
  
  const getIcon = () => {
    // Map benefit types to icons based on title or benefitId
    if (redemption.benefitTitle.includes('1:1')) return UserCheck
    if (redemption.benefitTitle.includes('Beta')) return Zap
    if (redemption.benefitTitle.includes('USDC')) return DollarSign
    if (redemption.benefitTitle.includes('Lucky')) return Gift
    return Gift
  }

  const getStatusColor = () => {
    switch (redemption.status) {
      case 'fulfilled':
        return 'bg-green-500'
      case 'processing':
        return 'bg-blue-500'
      case 'pending_process':
        return 'bg-yellow-500'
      case 'pending_contact':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (redemption.status) {
      case 'fulfilled':
        return 'Completed'
      case 'processing':
        return 'Processing'
      case 'pending_process':
        return 'Pending Review'
      case 'pending_contact':
        return 'Contact Required'
      default:
        return 'Unknown'
    }
  }

  const Icon = getIcon()

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Benefit Icon */}
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium text-foreground line-clamp-1">
                  {redemption.benefitTitle}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Order #{redemption.orderId}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-foreground">
                  -{redemption.apxBurned} APX
                </div>
                <div className="text-xs text-muted-foreground">
                  {redemption.timeAgo}
                </div>
              </div>
            </div>

            {/* Status and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                <Badge variant="secondary" className="text-xs">
                  {getStatusText()}
                </Badge>
              </div>

              <div className="flex gap-2">
                {/* Contact Action */}
                {showContactAction && 
                 redemption.status === 'pending_contact' && 
                 onSubmitContact && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSubmitContact(redemption.orderId)}
                    className="text-xs"
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    Add Contact
                  </Button>
                )}

                {/* View Transaction */}
                {redemption.txHash && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(`https://basescan.org/tx/${redemption.txHash}`, '_blank')}
                    className="text-xs"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Tx
                  </Button>
                )}

                {/* View Details */}
                {onViewDetails && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewDetails(redemption)}
                    className="text-xs"
                  >
                    Details
                  </Button>
                )}
              </div>
            </div>

            {/* Additional Info */}
            {redemption.status === 'pending_contact' && (
              <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">
                    Please provide your contact information to receive this benefit
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 5. BenefitsSection Integration

Composant principal à intégrer dans la page Rewards existante.

```typescript
// src/components/BenefitsSection.tsx
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Zap, Gift } from 'lucide-react'
import { BenefitsList } from './BenefitsList'
import { PostRedemptionModal } from './PostRedemptionModal'
import { useBenefitsManagement } from '@/hooks/useBenefitsManagement'
import { useAppStore } from '@/store/useAppStore'

interface BenefitsSectionProps {
  className?: string
}

export function BenefitsSection({ className = '' }: BenefitsSectionProps) {
  const { isConnected } = useAppStore()
  const {
    benefits,
    userRedemptions,
    isLoading,
    redeemBenefit,
    submitContactInfo
  } = useBenefitsManagement()

  const [showContactModal, setShowContactModal] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState('')
  const [currentBenefitTitle, setCurrentBenefitTitle] = useState('')

  const availableCount = benefits.filter(b => b.canRedeem).length
  const totalCount = benefits.length

  const handleRedeem = async (benefitId: string) => {
    try {
      const result = await redeemBenefit(benefitId)
      if (result.success && result.orderId) {
        const benefit = benefits.find(b => b.id === benefitId)
        setCurrentOrderId(result.orderId)
        setCurrentBenefitTitle(benefit?.title || 'Benefit')
        setShowContactModal(true)
      }
    } catch (error) {
      console.error('Redemption failed:', error)
    }
  }

  const handleContactSubmit = async (email: string) => {
    try {
      await submitContactInfo(currentOrderId, email)
    } catch (error) {
      console.error('Contact submission failed:', error)
      throw error
    }
  }

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
              During our alpha launch, benefits are processe
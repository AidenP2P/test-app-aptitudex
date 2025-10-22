
# 📊 Events & Transaction History Specification - Benefits System

## Overview

This specification defines the integration of Benefits events with the existing transaction history system, allowing tracking and displaying complete benefit purchase history in the user interface.

## 🏗️ Events Architecture

### Integration with existing system

The Benefits system integrates with existing [`useTransactionHistory`](src/hooks/useTransactionHistory.ts:1) by adding new activity types and listening to BenefitsManagement contract events.

## 📋 Benefits Event Types

### Activity Types Extension

```typescript
// Extension of src/store/useAppStore.ts
export interface Activity {
  id: string;
  type: 'claim' | 'earn' | 'issue' | 'daily_claim' | 'weekly_claim' | 'streak_bonus' | 'send' | 'burn' |
        'benefit_redeem' | 'benefit_contact_submit' | 'benefit_process'; // New types
  amount: string;
  date: string;
  tx?: string;
  description?: string;
  
  // Existing fields
  streakDay?: number;
  isStreakBonus?: boolean;
  frequency?: 'daily' | 'weekly';
  fromAddress?: string;
  toAddress?: string;
  
  // New fields for Benefits
  benefitId?: string;
  benefitTitle?: string;
  orderId?: string;
  benefitIcon?: string;
  benefitColor?: string;
  contactSubmitted?: boolean;
  isProcessed?: boolean;
}
```

### Benefits Smart Contract Events

```typescript
// Extension of events to listen to
export const BENEFITS_EVENTS = {
  BenefitRedeemed: {
    signature: 'BenefitRedeemed(address,bytes32,uint256,string,uint256)',
    abi: {
      name: 'BenefitRedeemed',
      type: 'event',
      inputs: [
        { indexed: true, name: 'user', type: 'address' },
        { indexed: true, name: 'benefitId', type: 'bytes32' },
        { name: 'apxBurned', type: 'uint256' },
        { name: 'orderId', type: 'string' },
        { name: 'timestamp', type: 'uint256' }
      ]
    }
  },
  
  ContactSubmitted: {
    signature: 'ContactSubmitted(string,bytes32,address)',
    abi: {
      name: 'ContactSubmitted',
      type: 'event',
      inputs: [
        { indexed: true, name: 'orderId', type: 'string' },
        { name: 'contactHash', type: 'bytes32' },
        { indexed: true, name: 'user', type: 'address' }
      ]
    }
  },
  
  BenefitProcessed: {
    signature: 'BenefitProcessed(string,address,uint256)',
    abi: {
      name: 'BenefitProcessed',
      type: 'event',
      inputs: [
        { indexed: true, name: 'orderId', type: 'string' },
        { indexed: true, name: 'processor', type: 'address' },
        { name: 'timestamp', type: 'uint256' }
      ]
    }
  },
  
  APXBurned: {
    signature: 'APXBurned(address,uint256,string)',
    abi: {
      name: 'APXBurned',
      type: 'event',
      inputs: [
        { indexed: true, name: 'user', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'reason', type: 'string' }
      ]
    }
  }
} as const
```

## 🔄 useTransactionHistory Hook Extension

### Existing hook modification

```typescript
// Extension of src/hooks/useTransactionHistory.ts
import { BENEFITS_MANAGEMENT_CONFIG } from '@/config/benefitsManagement'
import { BENEFITS_EVENTS } from '@/config/benefitsEvents'

export function useTransactionHistory() {
  // ... existing code ...

  // Helper function to determine Benefits transaction type
  const getBenefitTransactionType = (eventName: string): Activity['type'] => {
    switch (eventName) {
      case 'BenefitRedeemed':
        return 'benefit_redeem'
      case 'ContactSubmitted':
        return 'benefit_contact_submit'
      case 'BenefitProcessed':
        return 'benefit_process'
      case 'APXBurned':
        return 'burn'
      default:
        return 'earn'
    }
  }

  // Extension of fetchTransactionHistory to include Benefits events
  const fetchTransactionHistory = async (fromBlock?: bigint) => {
    if (!address || !publicClient) return []

    try {
      setIsLoading(true)
      setError(null)

      const currentBlock = await publicClient.getBlockNumber()
      const startBlock = fromBlock || currentBlock - 10000n

      console.log(`📊 Fetching transaction history including Benefits from block ${startBlock} to ${currentBlock}`)

      // 1. Existing APX Transfer events (existing code)
      // ... existing code for transferLogs and receivedLogs ...

      // 2. Existing Claims events (existing code)
      // ... existing code for dailyClaimLogs and weeklyClaimLogs ...

      // 3. NEW: Benefits events
      const benefitRedeemedLogs = await publicClient.getLogs({
        address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        event: BENEFITS_EVENTS.BenefitRedeemed.abi,
        args: {
          user: address as any,
        },
        fromBlock: startBlock,
        toBlock: currentBlock,
      })

      const contactSubmittedLogs = await publicClient.getLogs({
        address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        event: BENEFITS_EVENTS.ContactSubmitted.abi,
        args: {
          user: address as any,
        },
        fromBlock: startBlock,
        toBlock: currentBlock,
      })

      const benefitProcessedLogs = await publicClient.getLogs({
        address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        event: BENEFITS_EVENTS.BenefitProcessed.abi,
        fromBlock: startBlock,
        toBlock: currentBlock,
      })

      console.log(`📊 Found ${benefitRedeemedLogs.length} benefit redemptions, ${contactSubmittedLogs.length} contact submissions, ${benefitProcessedLogs.length} processed benefits`)

      const activities: Activity[] = []

      // 4. Benefits events processing
      
      // Process Benefit Redeemed events
      for (const log of benefitRedeemedLogs) {
        try {
          const block = await publicClient.getBlock({ blockHash: log.blockHash })
          const parsedLog = parseEventLogs({
            abi: [BENEFITS_EVENTS.BenefitRedeemed.abi],
            logs: [log],
          })[0]

          if (parsedLog?.eventName === 'BenefitRedeemed') {
            const { benefitId, apxBurned, orderId } = parsedLog.args
            const formattedAmount = formatAPXAmount(apxBurned)
            
            // Get benefit details for display
            const benefitDetails = await getBenefitDisplayInfo(benefitId)

            activities.push({
              id: `benefit-redeem-${log.transactionHash}-${log.logIndex}`,
              type: 'benefit_redeem',
              amount: formattedAmount,
              date: new Date(Number(block.timestamp) * 1000).toISOString(),
              tx: log.transactionHash,
              description: `Redeemed ${benefitDetails.title}`,
              benefitId: benefitId,
              benefitTitle: benefitDetails.title,
              orderId: orderId,
              benefitIcon: benefitDetails.icon,
              benefitColor: benefitDetails.color,
              contactSubmitted: false, // Will be updated with contact events
              isProcessed: false // Will be updated with processed events
            })
          }
        } catch (err) {
          console.warn('Failed to process benefit redeemed log:', err)
        }
      }

      // Process Contact Submitted events
      for (const log of contactSubmittedLogs) {
        try {
          const block = await publicClient.getBlock({ blockHash: log.blockHash })
          const parsedLog = parseEventLogs({
            abi: [BENEFITS_EVENTS.ContactSubmitted.abi],
            logs: [log],
          })[0]

          if (parsedLog?.eventName === 'ContactSubmitted') {
            const { orderId } = parsedLog.args

            // Update corresponding activity or create a new one
            const existingActivity = activities.find(a => a.orderId === orderId)
            if (existingActivity) {
              existingActivity.contactSubmitted = true
            } else {
              // Create contact-only activity
              activities.push({
                id: `benefit-contact-${log.transactionHash}-${log.logIndex}`,
                type: 'benefit_contact_submit',
                amount: '0',
                date: new Date(Number(block.timestamp) * 1000).toISOString(),
                tx: log.transactionHash,
                description: 'Contact information submitted',
                orderId: orderId,
                contactSubmitted: true
              })
            }
          }
        } catch (err) {
          console.warn('Failed to process contact submitted log:', err)
        }
      }

      // Process Benefit Processed events
      for (const log of benefitProcessedLogs) {
        try {
          const block = await publicClient.getBlock({ blockHash: log.blockHash })
          const parsedLog = parseEventLogs({
            abi: [BENEFITS_EVENTS.BenefitProcessed.abi],
            logs: [log],
          })[0]

          if (parsedLog?.eventName === 'BenefitProcessed') {
            const { orderId } = parsedLog.args

            // Update corresponding activity
            const existingActivity = activities.find(a => a.orderId === orderId)
            if (existingActivity) {
              existingActivity.isProcessed = true
              existingActivity.description = `${existingActivity.description} (Processed)`
            } else {
              // Create processed-only activity
              activities.push({
                id: `benefit-processed-${log.transactionHash}-${log.logIndex}`,
                type: 'benefit_process',
                amount: '0',
                date: new Date(Number(block.timestamp) * 1000).toISOString(),
                tx: log.transactionHash,
                description: 'Benefit processed by admin',
                orderId: orderId,
                isProcessed: true
              })
            }
          }
        } catch (err) {
          console.warn('Failed to process benefit processed log:', err)
        }
      }

      // ... processing other existing events ...

      // Sort all activities by date (most recent first)
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      console.log(`📊 Processed ${activities.length} total activities including Benefits`)
      setLastBlockFetched(currentBlock)
      
      return activities

    } catch (err) {
      console.error('Failed to fetch transaction history:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction history')
      return []
    } finally {
      setIsLoading(false)
    }
  }

  // Helper to get benefit display info
  const getBenefitDisplayInfo = async (benefitId: string) => {
    try {
      // Try first with predefined benefits
      const predefined = Object.values(PREDEFINED_BENEFITS).find(b => b.id === benefitId)
      if (predefined) {
        return {
          title: predefined.title,
          icon: predefined.iconName,
          color: predefined.colorClass
        }
      }

      // Otherwise, get from contract
      const details = await publicClient.readContract({
        address: BENEFITS_MANAGEMENT_CONFIG.contractAddress,
        abi: BENEFITS_MANAGEMENT_CONFIG.abi,
        functionName: 'getBenefitDetails',
        args: [benefitId]
      })

      return {
        title: details[1] || 'Unknown Benefit',
        icon: details[6] || 'Gift',
        color: details[7] || 'bg-gray-500'
      }
    } catch (error) {
      console.error('Error fetching benefit display info:', error)
      return {
        title: 'Unknown Benefit',
        icon: 'Gift',
        color: 'bg-gray-500'
      }
    }
  }

  // The rest of the hook remains identical...
  return {
    isLoading,
    error,
    refreshHistory,
    fetchNewTransactions,
    lastBlockFetched: lastBlockFetched ? Number(lastBlockFetched) : null,
  }
}
```

## 🎨 Composants d'Affichage des Activités Benefits

### Extension d'ActivityItem

```typescript
// Extension de src/components/ActivityItem.tsx
import { 
  Trophy, ExternalLink, Calendar, Users, CheckCircle, Clock, 
  UserCheck, Zap, DollarSign, Gift, Mail, Settings 
} from 'lucide-react'

export function ActivityItem({ activity }: { activity: Activity }) {
  // Helper pour récupérer l'icône selon le type d'activité
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'benefit_redeem':
        return getBenefitIcon(activity.benefitIcon || 'Gift')
      case 'benefit_contact_submit':
        return Mail
      case 'benefit_process':
        return Settings
      case 'daily_claim':
      case 'weekly_claim':
        return Trophy
      case 'burn':
        return CheckCircle
      case 'send':
        return ExternalLink
      default:
        return Trophy
    }
  }

  const getBenefitIcon = (iconName: string) => {
    const iconMap = { UserCheck, Zap, DollarSign, Gift }
    return iconMap[iconName as keyof typeof iconMap] || Gift
  }

  const getActivityColor = () => {
    switch (activity.type) {
      case 'benefit_redeem':
        return activity.benefitColor || 'bg-purple-500'
      case 'benefit_contact_submit':
        return 'bg-blue-500'
      case 'benefit_process':
        return 'bg-green-500'
      case 'daily_claim':
      case 'weekly_claim':
        return 'bg-gradient-primary'
      case 'burn':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getActivityDescription = () => {
    switch (activity.type) {
      case 'benefit_redeem':
        return `Redeemed: ${activity.benefitTitle || 'Benefit'}`
      case 'benefit_contact_submit':
        return 'Contact information submitted'
      case 'benefit_process':
        return 'Benefit processed by team'
      default:
        return activity.description || 'Activity'
    }
  }

  const getActivityAmount = () => {
    if (activity.type === 'benefit_redeem') {
      return `-${activity.amount} APX` // Afficher comme dépense
    }
    return `+${activity.amount} APX`
  }

  const Icon = getActivityIcon()
  const isDebit = activity.type === 'benefit_redeem'

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
      {/* Icon */}
      <div className={`w-10 h-10 rounded-lg ${getActivityColor()} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-foreground">
              {getActivityDescription()}
            </h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{new Date(activity.date).toLocaleDateString()}</span>
              
              {/* Informations spécifiques Benefits */}
              {activity.orderId && (
                <>
                  <span>•</span>
                  <span>Order #{activity.orderId.slice(-6)}</span>
                </>
              )}
              
              {activity.type === 'benefit_redeem' && (
                <>
                  {activity.contactSubmitted && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Contact Sent
                      </span>
                    </>
                  )}
                  {activity.isProcessed && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Processed
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className={`font-bold ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
              {getActivityAmount()}
            </div>
            {activity.tx && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`https://basescan.org/tx/${activity.tx}`, '_blank')}
                className="text-xs p-1 h-auto"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### BenefitsHistorySection

Specialized component for displaying benefits history.

```typescript
// src/components/BenefitsHistorySection.tsx
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Gift, Filter, ExternalLink, Mail } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { ActivityItem } from './ActivityItem'

type BenefitActivityFilter = 'all' | 'redeemed' | 'contacts' | 'processed'

export function BenefitsHistorySection() {
  const { activity } = useAppStore()
  const [filter, setFilter] = useState<BenefitActivityFilter>('all')

  // Filter Benefits activities
  const benefitActivities = useMemo(() => {
    const benefitTypes = ['benefit_redeem', 'benefit_contact_submit', 'benefit_process']
    let filtered = activity.filter(a => benefitTypes.includes(a.type))

    switch (filter) {
      case 'redeemed':
        filtered = filtered.filter(a => a.type === 'benefit_redeem')
        break
      case 'contacts':
        filtered = filtered.filter(a => a.type === 'benefit_contact_submit' || a.contactSubmitted)
        break
      case 'processed':
        filtered = filtered.filter(a => a.type === 'benefit_process' || a.isProcessed)
        break
    }

    return filtered
  }, [activity, filter])

  const stats = useMemo(() => {
    const redemptions = activity.filter(a => a.type === 'benefit_redeem')
    const totalSpent = redemptions.reduce((sum, a) => sum + parseFloat(a.amount), 0)
    const contactsSubmitted = activity.filter(a => a.contactSubmitted).length
    const processed = activity.filter(a => a.isProcessed).length

    return {
      totalRedemptions: redemptions.length,
      totalSpent: totalSpent.toFixed(0),
      contactsSubmitted,
      processed
    }
  }, [activity])

  if (benefitActivities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Benefits History
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No benefit activities yet. Redeem your first benefit to see history here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Benefits History
          </CardTitle>
          <div className="flex items-center gap-3">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="redeemed">Redeemed</SelectItem>
                <SelectItem value="contacts">Contacts</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-foreground">{stats.totalRedemptions}</div>
            <div className="text-xs text-muted-foreground">Redeemed</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.totalSpent}</div>
            <div className="text-xs text-muted-foreground">APX Spent</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.contactsSubmitted}</div>
            <div className="text-xs text-muted-foreground">Contacts</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.processed}</div>
            <div className="text-xs text-muted-foreground">Processed</div>
          </div>
        </div>

        {/* Activities List */}
        <div className="space-y-3">
          {benefitActivities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>

        {/* Load More / Export */}
        <div className="text-center pt-4">
          <Button variant="outline" className="text-sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            View All Transactions
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

## 🔄 Integration with App Store

### Store Extension

```typescript
// Extension de src/store/useAppStore.ts
interface AppStore {
  // ... existing properties ...
  
  // New actions for Benefits
  addBenefitActivity: (activity: Activity) => void
  updateBenefitActivity: (activityId: string, updates: Partial<Activity>) => void
  getBenefitActivities: () => Activity[]
  getBenefitStats: () => {
    totalRedemptions: number
    totalSpent: number
    contactsSubmitted: number
    processed: number
  }
}

// In the store implementation
export const useAppStore = create<AppStore>((set, get) => ({
  // ... existing state ...

  addBenefitActivity: (activity: Activity) => {
    set((state) => ({
      activity: [activity, ...state.activity]
    }))
  },

  updateBenefitActivity: (activityId: string, updates: Partial<Activity>) => {
    set((state) => ({
      activity: state.activity.map(a => 
        a.id === activityId ? { ...a, ...updates } : a
      )
    }))
  },

  getBenefitActivities: () => {
    const { activity } = get()
    const benefitTypes = ['benefit_redeem', 'benefit_contact_submit', 'benefit_process']
    return activity.filter(a => benefitTypes.includes(a.type))
  },

  getBenefitStats: () => {
    const { activity } = get()
    const redemptions = activity.filter(a => a.type === 'benefit_redeem')
    const totalSpent = redemptions.reduce((sum, a) => sum + parseFloat(a.amount), 0)
    const contactsSubmitted = activity.filter(a => a.contactSubmitted).length
    const processed = activity.filter(a => a.isProcessed).length

    return {
      totalRedemptions: redemptions.length,
      totalSpent,
      contactsSubmitted,
      processed
    }
  }
}))
```

## 📱 Integration in Pages

### Activity Page Extension

```typescript
// Extension of src/pages/Activity.tsx
import { BenefitsHistorySection } from '@/components/BenefitsHistorySection'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const Activity = () => {
  // ... existing code ...

  return (
    <>
      <Header title="Activity" subtitle="Your transaction history and activity" />
      
      <div className="px-6 pb-8">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Activity</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {/* Existing content - all activities */}
          </TabsContent>
          
          <TabsContent value="rewards" className="space-y-4">
            {/* Existing content - rewards activities only */}
          </TabsContent>
          
          <TabsContent value="benefits" className="space-y-4">
            <BenefitsHistorySection />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
```

### Rewards Page Extension

```typescript
// Extension of src/pages/Rewards.tsx - adding a history section
import { BenefitsHistorySection } from '@/components/BenefitsHistorySection'

// In the Rewards component, after the My Benefits section
{isConnected && (
  <div className="mt-8">
    <BenefitsHistorySection />
  </div>
)}
```

## 🔄 Real-time Updates

### WebSocket or Polling for real-time updates

```typescript
// src/hooks/useBenefitsRealtime.ts
import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useTransactionHistory } from './useTransactionHistory'

export function useBenefitsRealtime() {
  const { fetchNewTransactions } = useTransactionHistory()
  const { addBenefitActivity } = useAppStore()

  useEffect(() => {
    // Polling every 30 seconds for new transactions
    const interval = setInterval(() => {
      fetchNewTransactions()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchNewTransactions])

  // Listen to confirmed transaction events
  useEffect(() => {
    const handleTransactionConfirmed = (event: CustomEvent) => {
      const { type, txHash, orderId } = event.detail
      
      if (type === 'benefit_redeem') {
        // Update activity with Order ID
        setTimeout(() => {
          fetchNewTransactions()
        }, 5000) // Wait 5s for transaction to be indexed
      }
    }

    window.addEventListener('benefitTransactionConfirmed', handleTransactionConfirmed)
    return () => window.removeEventListener('benefitTransactionConfirmed', handleTransactionConfirmed)
  }, [fetchNewTransactions])
}
```

## 📊 Analytics and Metrics

### Benefits Analytics Service

```typescript
// src/services/benefitsAnalytics.ts
export class BenefitsAnalytics {
  static trackBenefitRedemption(benefitId: string, amount: string, orderId: string) {
    // Analytics for redemption
    if (typeof gtag !== 'undefined') {
      gtag('event', 'benefit_redeem', {
        benefit_id: benefitId,
        value: parseFloat(amount),
        order_id: orderId
      })
    }
  }

  static trackContactSubmission(orderId: string) {
    // Analytics for contact submission
    if (typeof gtag !== 'undefined') {
      gtag('event', 'benefit_contact_submit', {
        order_id: orderId
      })
    }
  }

  
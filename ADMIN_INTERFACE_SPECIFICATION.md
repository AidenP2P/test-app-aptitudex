
# 🛠️ Admin Interface Specification - Benefits System

## Overview

This specification defines the complete administration interface for the Benefits system, allowing administrators to manage benefits, track orders, export contacts, and monitor the system.

## 🏗️ Admin Architecture

### Access Control

Admin access is based on the wallet address configured in [`APX_TOKEN_CONFIG.adminWallet`](src/config/apxToken.ts:6). The interface integrates seamlessly with the existing Admin page.

```typescript
// Extension of existing src/pages/Admin.tsx
import { BenefitsAdminSection } from '@/components/admin/BenefitsAdminSection'

// In the existing Admin component, add:
{isAPXOwner && (
  <BenefitsAdminSection />
)}
```

## 📊 Admin Components

### 1. BenefitsAdminSection - Main Container

Main section to integrate into the existing Admin page.

```typescript
// src/components/admin/BenefitsAdminSection.tsx
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Gift, Users, DollarSign, TrendingUp, 
  Settings, Download, RefreshCw 
} from 'lucide-react'
import { BenefitsStats } from './BenefitsStats'
import { BenefitsManagement } from './BenefitsManagement'
import { OrdersManagement } from './OrdersManagement'
import { SystemMonitoring } from './SystemMonitoring'
import { useBenefitsAdmin } from '@/hooks/useBenefitsAdmin'

export function BenefitsAdminSection() {
  const { isAdmin, getStats, exportContacts } = useBenefitsAdmin()
  const [activeTab, setActiveTab] = useState('overview')

  if (!isAdmin) {
    return null // Do not display if not admin
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Benefits Administration</h2>
          <p className="text-muted-foreground">
            Manage benefits, orders, and system monitoring
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <Gift className="w-3 h-3 mr-1" />
          Admin Access
        </Badge>
      </div>

      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="benefits" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Benefits
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <BenefitsStats />
        </TabsContent>

        <TabsContent value="benefits" className="space-y-6">
          <BenefitsManagement />
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <OrdersManagement />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <SystemMonitoring />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### 2. BenefitsStats - Statistics Dashboard

Dashboard with key metrics of the Benefits system.

```typescript
// src/components/admin/BenefitsStats.tsx
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Gift, Users, DollarSign, TrendingUp, 
  Download, RefreshCw, Activity, Zap 
} from 'lucide-react'
import { useBenefitsAdmin } from '@/hooks/useBenefitsAdmin'
import { useBenefitsContactStorage } from '@/hooks/useBenefitsContactStorage'
import type { BenefitsStats as StatsType } from '@/types/benefits'

export function BenefitsStats() {
  const { getStats, exportContacts, isLoading } = useBenefitsAdmin()
  const { contacts } = useBenefitsContactStorage()
  const [stats, setStats] = useState<StatsType | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadStats = async () => {
    setIsRefreshing(true)
    try {
      const statsData = await getStats()
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const handleExportContacts = () => {
    exportContacts()
  }

  const pendingContacts = contacts.filter(c => c.status === 'submitted').length
  const processingContacts = contacts.filter(c => c.status === 'processing').length

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">System Overview</h3>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportContacts}
            disabled={contacts.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Contacts ({contacts.length})
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Benefits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Benefits</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalBenefits || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeBenefits || 0} active
            </p>
          </CardContent>
        </Card>

        {/* Total Redemptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalRedemptions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        {/* APX Burned */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">APX Burned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalAPXBurned || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total destroyed
            </p>
          </CardContent>
        </Card>

        {/* Pending Contacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pendingContacts}
            </div>
            <p className="text-xs text-muted-foreground">
              Contacts to process
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Benefit & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Benefit */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Most Popular Benefit</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.topBenefit ? (
              <div className="space-y-2">
                <div className="font-semibold">{stats.topBenefit.title}</div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {stats.topBenefit.redemptions} redemptions
                  </Badge>
                  <Badge variant="outline">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Contact Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Contact Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Submitted</span>
                <Badge variant="secondary">{pendingContacts}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Processing</span>
                <Badge variant="default">{processingContacts}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Completed</span>
                <Badge variant="outline">
                  {contacts.filter(c => c.status === 'fulfilled').length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <div className="font-medium text-sm">{activity.benefitTitle}</div>
                    <div className="text-xs text-muted-foreground">
                      {activity.user.slice(0, 6)}...{activity.user.slice(-4)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">-{activity.apxBurned} APX</div>
                    <div className="text-xs text-muted-foreground">{activity.timeAgo}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

### 3. BenefitsManagement - Benefits Management

Interface for creating and modifying benefits.

```typescript
// src/components/admin/BenefitsManagement.tsx
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, Edit, Trash2, Save, X, 
  UserCheck, Zap, DollarSign, Gift 
} from 'lucide-react'
import { useBenefitsAdmin } from '@/hooks/useBenefitsAdmin'
import { useBenefitsManagement } from '@/hooks/useBenefitsManagement'
import type { Benefit, CreateBenefitData } from '@/types/benefits'

const ICON_OPTIONS = [
  { value: 'UserCheck', label: 'User Check', icon: UserCheck },
  { value: 'Zap', label: 'Lightning', icon: Zap },
  { value: 'DollarSign', label: 'Dollar', icon: DollarSign },
  { value: 'Gift', label: 'Gift', icon: Gift }
]

const COLOR_OPTIONS = [
  { value: 'bg-gradient-to-r from-purple-500 to-pink-500', label: 'Purple to Pink' },
  { value: 'bg-gradient-to-r from-blue-500 to-cyan-500', label: 'Blue to Cyan' },
  { value: 'bg-gradient-to-r from-green-500 to-emerald-500', label: 'Green to Emerald' },
  { value: 'bg-gradient-to-r from-yellow-500 to-orange-500', label: 'Yellow to Orange' },
  { value: 'bg-gradient-to-r from-red-500 to-rose-500', label: 'Red to Rose' }
]

export function BenefitsManagement() {
  const { createBenefit, updateBenefit, initializePredefinedBenefits, isLoading } = useBenefitsAdmin()
  const { getAvailableBenefits } = useBenefitsManagement()
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null)
  const [formData, setFormData] = useState<CreateBenefitData>({
    id: '',
    title: '',
    description: '',
    mechanics: '',
    guardrails: '',
    tokenomics: '100% burn',
    priceAPX: '',
    iconName: 'Gift',
    colorClass: COLOR_OPTIONS[0].value,
    maxRedemptions: 0
  })

  const loadBenefits = async () => {
    try {
      const benefitsList = await getAvailableBenefits()
      setBenefits(benefitsList)
    } catch (error) {
      console.error('Failed to load benefits:', error)
    }
  }

  useEffect(() => {
    loadBenefits()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingBenefit) {
        await updateBenefit({
          id: editingBenefit.id,
          priceAPX: formData.priceAPX,
          title: formData.title,
          description: formData.description,
          isActive: true
        })
      } else {
        // Generate a unique ID for new benefit
        const benefitId = `0x${formData.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 31).padEnd(31, '0')}0`
        
        await createBenefit({
          ...formData,
          id: benefitId
        })
      }
      
      // Reset form and reload
      setFormData({
        id: '',
        title: '',
        description: '',
        mechanics: '',
        guardrails: '',
        tokenomics: '100% burn',
        priceAPX: '',
        iconName: 'Gift',
        colorClass: COLOR_OPTIONS[0].value,
        maxRedemptions: 0
      })
      setIsCreateDialogOpen(false)
      setEditingBenefit(null)
      await loadBenefits()
      
    } catch (error) {
      console.error('Failed to save benefit:', error)
    }
  }

  const handleEdit = (benefit: Benefit) => {
    setFormData({
      id: benefit.id,
      title: benefit.title,
      description: benefit.description,
      mechanics: benefit.mechanics,
      guardrails: benefit.guardrails,
      tokenomics: benefit.tokenomics,
      priceAPX: benefit.priceAPX,
      iconName: benefit.iconName,
      colorClass: benefit.colorClass,
      maxRedemptions: benefit.maxRedemptions
    })
    setEditingBenefit(benefit)
    setIsCreateDialogOpen(true)
  }

  const handleInitializePredefined = async () => {
    try {
      await initializePredefinedBenefits()
      await loadBenefits()
    } catch (error) {
      console.error('Failed to initialize predefined benefits:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Benefits Management</h3>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleInitializePredefined}
            disabled={isLoading}
          >
            Initialize Predefined
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Benefit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingBenefit ? 'Edit Benefit' : 'Create New Benefit'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="1:1 with the Creator"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="priceAPX">Price (APX)</Label>
                    <Input
                      id="priceAPX"
                      type="number"
                      value={formData.priceAPX}
                      onChange={(e) => setFormData(prev => ({ ...prev, priceAPX: e.target.value }))}
                      placeholder="5000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description (Value Proposition)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="A 30–45 min private session to discuss product, token design..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="mechanics">Mechanics (How it works)</Label>
                  <Input
                    id="mechanics"
                    value={formData.mechanics}
                    onChange={(e) => setFormData(prev => ({ ...prev, mechanics: e.target.value }))}
                    placeholder="Redeem with APX → on-chain receipt → booking link sent"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="guardrails">Guardrails (Limits & Rules)</Label>
                  <Input
                    id="guardrails"
                    value={formData.guardrails}
                    onChange={(e) => setFormData(prev => ({ ...prev, guardrails: e.target.value }))}
                    placeholder="Limit: 1 per wallet, expires in 30 days"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="tokenomics">Tokenomics Badge</Label>
                  <Input
                    id="tokenomics"
                    value={formData.tokenomics}
                    onChange={(e) => setFormData(prev => ({ ...prev, tokenomics: e.target.value }))}
                    placeholder="100% burn + gasless"
                    required
                  />
                </div>

                {/* Visual Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="iconName">Icon</Label>
                    <Select 
                      value={formData.iconName} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, iconName: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select icon" />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map(option => {
                          const IconComponent = option.icon
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="w-4 h-4" />
                                {option.label}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="maxRedemptions">Max Redemptions (0 = unlimited)</Label>
                    <Input
                      id="maxRedemptions"
                      type="number"
                      value={formData.maxRedemptions}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxRedemptions: parseInt(e.target.value) || 0 }))}
                      placeholder="10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="colorClass">Color Theme</Label>
                  <Select 
                    value={formData.colorClass} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, colorClass: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select color theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${option.value}`} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false)
                      setEditingBenefit(null)
                    }}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    {editingBenefit ? 'Update' : 'Create'} Benefit
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Benefits List */}
      {benefits.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Benefits Created</h3>
            <p className="text-muted-foreground mb-4">
              Create your first benefit or initialize predefined ones to get started.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Benefit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {benefits.map((benefit) => {
            const IconComponent = ICON_OPTIONS.find(opt => opt.value === benefit.iconName)?.icon || Gift
            
            return (
              <Card key={benefit.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl ${benefit.colorClass} flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold mb-1">{benefit.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{benefit.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="secondary">
                            {benefit.priceAPX} APX
                          </Badge>
                          <Badge variant="outline">
                            {benefit.totalRedeemed}
                            {benefit.maxRedemptions > 0 && `/${benefit.maxRedemptions}`} redeemed
                          </Badge>
                          <Badge variant={benefit.isActive ? 'default' : 'secondary'}>
                            {benefit.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div><strong>How:</strong> {benefit.mechanics}</div>
                          <div><strong>Limits:</strong> {benefit.guardrails}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(benefit)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

### 4. OrdersManagement - Order Management

Interface for viewing and managing all benefit orders.

```typescript
// src/components/admin/OrdersManagement.tsx
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Search, Filter, ExternalLink, CheckCircle, 
  Clock, Mail, User, DollarSign, Calendar 
} from 'lucide-react'
import { useBenefitsAdmin } from '@/hooks/useBenefitsAdmin'
import { useBenefitsContactStorage } from '@/hooks/useBenefitsContactStorage'
import type { BenefitContact, Re
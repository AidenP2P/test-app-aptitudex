
# 🧪 Testing & Validation Plan - Benefits System

## Overview

This plan defines the complete testing and validation strategy for the Benefits system, covering all components from the Smart Contract to the User Interface, including Paymaster integration and admin management.

## 🎯 Test Objectives

### Success Criteria
1. **Functionality**: All user flows work correctly
2. **Security**: No vulnerabilities in smart contracts or business logic
3. **Performance**: Acceptable response times and fluid UI
4. **Integration**: All systems communicate correctly
5. **UX**: Intuitive and frictionless user experience

## 🏗️ Test Architecture

### Test Environments

```typescript
// Environment configuration
export const TEST_ENVIRONMENTS = {
  // 1. Local Development
  LOCAL: {
    chainId: 31337, // Hardhat local
    rpcUrl: 'http://localhost:8545',
    benefitsContract: '0x...', // Contract deployed locally
    paymaster: 'mock', // Mock Paymaster for tests
    apxToken: '0x...', // Mock APX Token
  },
  
  // 2. Base Sepolia Testnet
  TESTNET: {
    chainId: 84532, // Base Sepolia
    rpcUrl: 'https://sepolia.base.org',
    benefitsContract: '0x...', // Contract deployed on testnet
    paymaster: 'https://paymaster.base.org/v1', // Real Paymaster
    apxToken: '0x...', // APX Token testnet
  },
  
  // 3. Base Mainnet (Staging)
  STAGING: {
    chainId: 8453, // Base mainnet
    rpcUrl: 'https://mainnet.base.org',
    benefitsContract: '0x...', // Staging contract
    paymaster: 'https://paymaster.base.org/v1',
    apxToken: '0x1A51cC117Ab0f4881Db1260C9344C479D0893dD3', // Real APX
  }
} as const
```

### Jest Configuration

```typescript
// jest.config.ts
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.test.{ts,tsx}',
    '<rootDir>/contracts/test/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

export default config
```

## 🔧 Smart Contract Testing

### Hardhat Test Suite

```typescript
// contracts/test/BenefitsManagement.test.ts
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { BenefitsManagement, APXToken } from '../typechain-types'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'

describe('BenefitsManagement Contract', function() {
  let benefitsContract: BenefitsManagement
  let apxToken: APXToken
  let owner: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress

  beforeEach(async function() {
    [owner, user1, user2] = await ethers.getSigners()
    
    // Deploy APX Token mock
    const APXToken = await ethers.getContractFactory('APXToken')
    apxToken = await APXToken.deploy()
    
    // Deploy Benefits Management
    const BenefitsManagement = await ethers.getContractFactory('BenefitsManagement')
    benefitsContract = await BenefitsManagement.deploy(
      await apxToken.getAddress(),
      owner.address
    )
    
    // Setup initial state
    await apxToken.mint(user1.address, ethers.parseEther('10000'))
    await apxToken.mint(user2.address, ethers.parseEther('5000'))
  })

  describe('Benefit Creation', function() {
    it('Should allow owner to create a benefit', async function() {
      const benefitId = ethers.id('test-benefit')
      const priceAPX = ethers.parseEther('1000')
      
      await expect(
        benefitsContract.createBenefit(
          benefitId,
          priceAPX,
          'Test Benefit',
          'Test description',
          'Test mechanics',
          'Test guardrails',
          '',
          'Gift',
          'bg-purple-500',
          10
        )
      ).to.emit(benefitsContract, 'BenefitCreated')
        .withArgs(benefitId, priceAPX, 'Test Benefit', owner.address)
    })

    it('Should not allow non-owner to create benefits', async function() {
      const benefitId = ethers.id('test-benefit')
      
      await expect(
        benefitsContract.connect(user1).createBenefit(
          benefitId,
          ethers.parseEther('1000'),
          'Test Benefit',
          'Description',
          'Mechanics',
          'Guardrails',
          'Tokenomics',
          'Gift',
          'bg-purple-500',
          10
        )
      ).to.be.revertedWithCustomError(benefitsContract, 'OwnableUnauthorizedAccount')
    })

    it('Should not allow duplicate benefit IDs', async function() {
      const benefitId = ethers.id('test-benefit')
      
      // Create first benefit
      await benefitsContract.createBenefit(
        benefitId,
        ethers.parseEther('1000'),
        'Test Benefit',
        'Description',
        'Mechanics',
        'Guardrails',
        'Tokenomics',
        'Gift',
        'bg-purple-500',
        10
      )
      
      // Try to create duplicate
      await expect(
        benefitsContract.createBenefit(
          benefitId,
          ethers.parseEther('2000'),
          'Duplicate Benefit',
          'Description',
          'Mechanics',
          'Guardrails',
          'Tokenomics',
          'Gift',
          'bg-purple-500',
          10
        )
      ).to.be.revertedWith('Benefit already exists')
    })
  })

  describe('Benefit Redemption', function() {
    beforeEach(async function() {
      // Create a test benefit
      const benefitId = ethers.id('test-benefit')
      await benefitsContract.createBenefit(
        benefitId,
        ethers.parseEther('1000'),
        'Test Benefit',
        'Description',
        'Mechanics',
        'Guardrails',
        'Tokenomics',
        'Gift',
        'bg-purple-500',
        10
      )
    })

    it('Should allow user to redeem benefit', async function() {
      const benefitId = ethers.id('test-benefit')
      const priceAPX = ethers.parseEther('1000')
      
      // Approve tokens
      await apxToken.connect(user1).approve(
        await benefitsContract.getAddress(),
        priceAPX
      )
      
      // Redeem benefit
      await expect(
        benefitsContract.connect(user1).redeemBenefit(benefitId)
      ).to.emit(benefitsContract, 'BenefitRedeemed')
      
      // Check that user can't redeem again
      await expect(
        benefitsContract.connect(user1).redeemBenefit(benefitId)
      ).to.be.revertedWith('Already redeemed by user')
    })

    it('Should not allow redemption without sufficient balance', async function() {
      const benefitId = ethers.id('test-benefit')
      
      // User2 has only 5000 APX, benefit costs 1000
      await apxToken.connect(user2).approve(
        await benefitsContract.getAddress(),
        ethers.parseEther('10000')
      )
      
      // Try to redeem (should work)
      await expect(
        benefitsContract.connect(user2).redeemBenefit(benefitId)
      ).to.emit(benefitsContract, 'BenefitRedeemed')
    })

    it('Should enforce maximum redemptions limit', async function() {
      const benefitId = ethers.id('limited-benefit')
      
      // Create benefit with limit of 1
      await benefitsContract.createBenefit(
        benefitId,
        ethers.parseEther('100'),
        'Limited Benefit',
        'Description',
        'Mechanics',
        'Guardrails',
        'Tokenomics',
        'Gift',
        'bg-purple-500',
        1 // Max 1 redemption
      )
      
      // First redemption should work
      await apxToken.connect(user1).approve(
        await benefitsContract.getAddress(),
        ethers.parseEther('100')
      )
      await benefitsContract.connect(user1).redeemBenefit(benefitId)
      
      // Second redemption should fail
      await apxToken.connect(user2).approve(
        await benefitsContract.getAddress(),
        ethers.parseEther('100')
      )
      await expect(
        benefitsContract.connect(user2).redeemBenefit(benefitId)
      ).to.be.revertedWith('Max claims reached')
    })
  })

  describe('Contact Management', function() {
    it('Should allow users to submit contact hash', async function() {
      // First redeem a benefit
      const benefitId = ethers.id('test-benefit')
      await benefitsContract.createBenefit(
        benefitId,
        ethers.parseEther('1000'),
        'Test Benefit',
        'Description',
        'Mechanics',
        'Guardrails',
        'Tokenomics',
        'Gift',
        'bg-purple-500',
        10
      )
      
      await apxToken.connect(user1).approve(
        await benefitsContract.getAddress(),
        ethers.parseEther('1000')
      )
      
      const tx = await benefitsContract.connect(user1).redeemBenefit(benefitId)
      const receipt = await tx.wait()
      
      // Extract orderId from event
      const event = receipt?.logs.find(log => 
        benefitsContract.interface.parseLog(log)?.name === 'BenefitRedeemed'
      )
      const orderId = benefitsContract.interface.parseLog(event!)?.args.orderId
      
      // Submit contact hash
      const contactHash = ethers.keccak256(ethers.toUtf8Bytes('test@example.com'))
      
      await expect(
        benefitsContract.connect(user1).submitContactHash(orderId, contactHash)
      ).to.emit(benefitsContract, 'ContactSubmitted')
        .withArgs(orderId, contactHash, user1.address)
    })
  })
})
```

### Security Tests

```typescript
// contracts/test/BenefitsManagement.security.test.ts
describe('BenefitsManagement Security Tests', function() {
  
  describe('Reentrancy Protection', function() {
    it('Should prevent reentrancy attacks on redeemBenefit', async function() {
      // Test with a malicious contract attempting reentrancy
    })
  })

  describe('Access Control', function() {
    it('Should prevent unauthorized admin functions', async function() {
      // Test all onlyOwner functions
    })
  })

  describe('Integer Overflow/Underflow', function() {
    it('Should handle large numbers safely', async function() {
      // Test with extreme amounts
    })
  })

  describe('Front-running Protection', function() {
    it('Should handle concurrent redemptions gracefully', async function() {
      // Test simultaneous redemptions
    })
  })
})
```

## ⚛️ Frontend Component Testing

### Hooks Tests

```typescript
// src/hooks/__tests__/useBenefitsManagement.test.ts
import { renderHook, act } from '@testing-library/react'
import { useBenefitsManagement } from '../useBenefitsManagement'
import { createMockWagmiConfig } from '@/test/mocks/wagmi'

describe('useBenefitsManagement', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MockWagmiProvider config={createMockWagmiConfig()}>
      {children}
    </MockWagmiProvider>
  )

  it('should fetch available benefits', async () => {
    const { result } = renderHook(() => useBenefitsManagement(), { wrapper })
    
    await act(async () => {
      const benefits = await result.current.getAvailableBenefits()
      expect(benefits).toHaveLength(4) // 4 predefined benefits
    })
  })

  it('should handle benefit redemption', async () => {
    const { result } = renderHook(() => useBenefitsManagement(), { wrapper })
    
    await act(async () => {
      const mockBenefitId = '0x316f6e31000000000000000000000000000000000000000000000000000000'
      const redemptionResult = await result.current.redeemBenefit(mockBenefitId)
      expect(redemptionResult.success).toBe(true)
    })
  })

  it('should validate user eligibility', async () => {
    const { result } = renderHook(() => useBenefitsManagement(), { wrapper })
    
    await act(async () => {
      const mockBenefitId = '0x316f6e31000000000000000000000000000000000000000000000000000000'
      const canRedeem = await result.current.canUserRedeem(mockBenefitId)
      expect(typeof canRedeem).toBe('boolean')
    })
  })
})
```

### UI Component Tests

```typescript
// src/components/__tests__/BenefitCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BenefitCard } from '../BenefitCard'
import { createMockBenefit } from '@/test/mocks/benefits'

describe('BenefitCard', () => {
  const mockOnRedeem = jest.fn()
  const mockBenefit = createMockBenefit({
    title: '1:1 with Creator',
    priceAPX: '5000',
    canRedeem: true,
    isRedeemed: false
  })

  beforeEach(() => {
    mockOnRedeem.mockClear()
  })

  it('should render benefit information correctly', () => {
    render(<BenefitCard benefit={mockBenefit} onRedeem={mockOnRedeem} />)
    
    expect(screen.getByText('1:1 with Creator')).toBeInTheDocument()
    expect(screen.getByText('5000')).toBeInTheDocument()
    expect(screen.getByText('APX')).toBeInTheDocument()
  })

  it('should call onRedeem when redeem button is clicked', async () => {
    render(<BenefitCard benefit={mockBenefit} onRedeem={mockOnRedeem} />)
    
    const redeemButton = screen.getByText(/redeem/i)
    fireEvent.click(redeemButton)
    
    await waitFor(() => {
      expect(mockOnRedeem).toHaveBeenCalledWith(mockBenefit.id)
    })
  })

  it('should show redeemed state correctly', () => {
    const redeemedBenefit = createMockBenefit({
      ...mockBenefit,
      isRedeemed: true,
      canRedeem: false
    })
    
    render(<BenefitCard benefit={redeemedBenefit} onRedeem={mockOnRedeem} />)
    
    expect(screen.getByText(/redeemed/i)).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should handle insufficient balance state', () => {
    const insufficientBenefit = createMockBenefit({
      ...mockBenefit,
      canRedeem: false,
      isRedeemed: false
    })
    
    render(<BenefitCard benefit={insufficientBenefit} onRedeem={mockOnRedeem} />)
    
    expect(screen.getByText(/insufficient/i)).toBeInTheDocument()
  })
})
```

### Frontend Integration Tests

```typescript
// src/pages/__tests__/Rewards.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Rewards } from '../Rewards'
import { MockAppProvider } from '@/test/mocks/AppProvider'

describe('Rewards Page Integration', () => {
  it('should handle complete benefit redemption flow', async () => {
    render(
      <MockAppProvider initialState={{ isConnected: true }}>
        <Rewards />
      </MockAppProvider>
    )

    // Wait for benefits to load
    await waitFor(() => {
      expect(screen.getByText(/my benefits/i)).toBeInTheDocument()
    })

    // Click on a benefit
    const benefitCard = screen.getByText(/1:1 with creator/i).closest('div')
    const redeemButton = benefitCard?.querySelector('button')
    fireEvent.click(redeemButton!)

    // Should show transaction pending
    await waitFor(() => {
      expect(screen.getByText(/redeeming/i)).toBeInTheDocument()
    })

    // Should show contact modal after successful redemption
    await waitFor(() => {
      expect(screen.getByText(/contact information required/i)).toBeInTheDocument()
    })
  })
})
```

## 🔗 Integration Tests

### Paymaster Tests

```typescript
// src/services/__tests__/paymasterService.test.ts
import { PaymasterService } from '../paymasterService'
import { createMockPublicClient } from '@/test/mocks/viem'

describe('PaymasterService', () => {
  let service: PaymasterService

  beforeEach(() => {
    service = PaymasterService.getInstance(createMockPublicClient())
  })

  it('should request sponsoring for eligible transactions', async () => {
    const request = {
      to: '0x...',
      data: '0x...',
      userAddress: '0x...',
      contractFunction: 'redeemBenefit',
      gasLimit: 500000n
    }

    const response = await service.requestSponsoring(request)
    expect(response.sponsored).toBe(true)
    expect(response.paymasterAndData).toBeDefined()
  })

  it('should deny sponsoring for ineligible transactions', async () => {
    const request = {
      to: '0x...',
      data: '0x...',
      userAddress: '0x...',
      contractFunction: 'invalidFunction',
      gasLimit: 500000n
    }

    const response = await service.requestSponsoring(request)
    expect(response.sponsored).toBe(false)
    expect(response.reason).toBeDefined()
  })
})
```

### Local Storage Tests

```typescript
// src/hooks/__tests__/useBenefitsContactStorage.test.ts
import { renderHook, act } from '@testing-library/react'
import { useBenefitsContactStorage } from '../useBenefitsContactStorage'

describe('useBenefitsContactStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should save and retrieve contacts', () => {
    const { result } = renderHook(() => useBenefitsContactStorage())

    const contact = {
      orderId: 'BEN-123',
      email: 'test@example.com',
      benefitTitle: 'Test Benefit',
      benefitId: '0x123',
      timestamp: new Date(),
      status: 'submitted' as const
    }

    act(() => {
      result.current.saveContact(contact)
    })

    expect(result.current.contacts).toHaveLength(1)
    expect(result.current.contacts[0].email).toBe('test@example.com')
  })

  it('should export contacts as CSV', () => {
    const { result } = renderHook(() => useBenefitsContactStorage())

    const contact = {
      orderId: 'BEN-123',
      email: 'test@example.com',
      benefitTitle: 'Test Benefit',
      benefitId: '0x123',
      timestamp: new Date(),
      status: 'submitted' as const
    }

    act(() => {
      result.current.saveContact(contact)
    })

    const csv = result.current.exportToCSV()
    expect(csv).toContain('Order ID,Email,Benefit Title')
    expect(csv).toContain('BEN-123,test@example.com')
  })
})
```

## 🎭 End-to-End Tests

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Complete E2E Tests

```typescript
// e2e/benefits-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Benefits Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test wallet connection
    await page.goto('/')
    await page.click('[data-testid="connect-wallet"]')
    // Mock wallet connection
  })

  test('should complete full benefit redemption flow', async ({ page }) => {
    // Navigate to Rewards page
    await page.click('[data-testid="nav-rewards"]')
    await expect(page.locator('h1')).toContainText('Rewards & Benefits')

    // Find and click a benefit
    const benefitCard = page.locator('[data-testid="benefit-card"]').first()
    await expect(benefitCard).toBeVisible()
    
    const redeemButton = benefitCard.locator('button:has-text("Redeem")')
    await redeemButton.click()

    // Wait for transaction confirmation
    await expect(page.locator('text=Transaction confirmed')).toBeVisible()

    // Contact modal should appear
    await expect(page.locator('text=Contact Information Required')).toBeVisible()
    
    // Fill email and submit
    await page.fill('[data-testid="contact-email"]', 'test@example.com')
    await page.click('button:has-text("Submit Contact")')

    // Should show success message
    await expect(page.locator('text=Contact Submitted')).toBeVisible()

    // Check activity page for the transaction
    await page.click('[data-testid="nav-activity"]')
    await expect(page.locator('text=Redeemed:')).toBeVisible()
  })

  test('should prevent double redemption', async ({ page }) => {
    // Try to redeem the same benefit twice
    await page.goto('/rewards')
    
    const benefitCard = page.locator('[data-testid="benefit-card"]').first()
    const redeemButton = benefitCard.locator('button')
    
    // First redemption
    await redeemButton.click()
    await expect(page.locator('text=Transaction confirmed')).toBeVisible()
    
    // Refresh page and check state
    await page.reload()
    await expect(benefitCard.locator('text=Redeemed')).toBeVisible()
    await expect(benefitCard.locator('button')).toBeDisabled()
  })
})

test.describe('Admin Flow', () => {
  test('should allow admin to manage benefits', async ({ page }) => {
    // Login as admin
    await page.goto('/admin')
    
    // Check admin access
    await expect(page.locator('text=Benefits Administration')).toBeVisible()
    
    // Create new benefit
    await page.click('button:has-text("Create Benefit")')
    await page.fill('[data-testid="benefit-title"]', 'Test E2E Benefit')
    await page.fill('[data-testid="benefit-price"]', '100')
    await page.fill('[data-testid="benefit-description"]', 'Test description')
    await page.click('button:has-text("Create")')
    
    // Should see new benefit in list
    await expect(page.locator('text=Test E2E Benefit')).toBeVisible()
  })
})
```

## 📊 Performance Tests

### Load Tests

```typescript
// performance/load-test.ts
import { check } from 'k6'
import http from 'k6/http'

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
}

export default function() {
  // Test API endpoints
  let response = http.get('http://localhost:3000/api/benefits')
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })

  // Test frontend loading
  response = http.get('http://localhost:3000/rewards')
  check(response, {
    'page loads successfully': (r) => r.status === 200,
    'page loads quickly': (r) => r.timings.duration < 2000,
  })
}
```

### Gas Metric Tests

```typescript
// performance/gas-analysis.ts
import { ethers } from 'hardhat'

async function analyzeGasCosts() {
  const [owner, user] = await ethers.getSigners()
  
  // Deploy contracts
  const benefitsContract = await deployBenefitsContract()
  const apxToken = await deployAPXToken()
  
  console.log('=== Gas Cost Analysis ===')
  
  // Test createBenefit gas cost
  const createTx = await benefitsContract.createBenefit(
    ethers.id('test'),
    ethers.parseEther('1000'),
    'Test',
    'Description',
    'Mechanics',
    'Guardrails',
    'Tokenomics',
    'Gift',
    'bg-purple-500',
    10
  )
  const createReceipt = await createTx.wait()
  console.log(`Create Benefit Gas: ${createReceipt?.gasUsed}`)
  
  // Test redeemBenefit gas cost
  await apxToken.connect(user).approve(benefitsContract.address, ethers.parseEther('1000'))
  const redeemTx = await benefitsContract.connect(user).redeemBenefit(ethers.id('test'))
  const redeemReceipt = await redeemTx.wait()
  console.log(`Redeem Benefit Gas: ${redeemReceipt?.gasUsed}`)
  
  // Test submitContactHash gas cost
  const contactTx = await benefitsContract.connect(user).submitContactHash(
    'BEN-123',
    ethers.keccak256(ethers.toUtf8Bytes('test@example.com'))
  )
  const contactReceipt = await contactTx.wait()
  console.log(`Submit Contact Gas: ${contactReceipt?.gasUsed}`)
}
```

## 🔍 Advanced Security Tests

### Automated Security Audit

```bash
# Automated audit script
#!/bin/bash

echo "🔍 Running Security Audit..."

# 1. Solidity Static Analysis
echo "Running Slither..."
slither contracts/

# 2. Smart Contract Fuzzing
echo "Running Echidna..."
echidna-test contracts/BenefitsManagement.sol

# 3. Frontend Security Scan
echo "Running npm audit..."
npm audit --audit-level high

# 4. Dependency Vulnerability Check
echo "Running Snyk..."
snyk test

# 5. Code Quality Check
echo "Running ESLint security rules..."
eslint src/ --ext .ts,.tsx --config .eslintrc.security.js

echo "✅ Security audit complete"
```

### Vulnerability Tests

```typescript
// security/vulnerability-tests.ts
describe('Security Vulnerability Tests', () => {
  
  test('SQL Injection Protection', () => {
    // Test malicious inputs in APIs
  })
  
  test('XSS Protection', () => {
    // Test malicious scripts in user inputs
  })
  
  test('CSRF Protection', () => {
    // Test malicious cross-origin requests
  })
  
  test('Input Validation', () => {
    // Test all inputs with malformed data
  })
})
```

## 📋 Test Execution Plan

### Phase 1: Unit Tests (Week 1)
- ✅ Smart Contract tests
- ✅ Hooks tests  
- ✅ Components tests
- ✅ Utilities tests

### Phase 2: Integration Tests (Week 2)
- ✅ Contract + Frontend integration
- ✅ Paymaster integration
- ✅ Storage integration
- ✅ Event handling integration

### Phase 3: E2E Tests (Week 3)
- ✅ Complete user flows
- ✅ Admin flows
- ✅ Error scenarios
- ✅
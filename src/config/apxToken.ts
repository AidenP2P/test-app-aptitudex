import { type Address } from 'viem'

// APX Token Contract Configuration
export const APX_TOKEN_CONFIG = {
  address: '0x1A51cC117Ab0f4881Db1260C9344C479D0893dD3' as Address,
  adminWallet: '0xF35EeFB35B13d908497BF51Fbc3f0f798f9f93f4' as Address,
  chainId: 8453, // Base mainnet
  name: 'AptitudeX',
  symbol: 'APX',
  decimals: 18,
} as const

// APX Token ABI - Complete interface based on the contract
export const APX_TOKEN_ABI = [
  // Standard ERC20 functions
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'transferFrom',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  
  // Owner/Admin functions
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [],
  },
  {
    name: 'pause',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'unpause',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'paused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  
  // Burnable functions
  {
    name: 'burn',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'value', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'burnFrom',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    outputs: [],
  },
  
  // Permit functions (EIP-2612)
  {
    name: 'permit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' }
    ],
    outputs: [],
  },
  {
    name: 'nonces',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  
  // Votes functions
  {
    name: 'getVotes',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getPastVotes',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'timepoint', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'delegate',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'delegatee', type: 'address' }],
    outputs: [],
  },
  {
    name: 'delegates',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'address' }],
  },
  
  // Events
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' }
    ],
  },
  {
    name: 'Approval',
    type: 'event',
    inputs: [
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: true, name: 'spender', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' }
    ],
  },
  {
    name: 'Paused',
    type: 'event',
    inputs: [{ indexed: false, name: 'account', type: 'address' }],
  },
  {
    name: 'Unpaused',
    type: 'event',
    inputs: [{ indexed: false, name: 'account', type: 'address' }],
  },
  {
    name: 'OwnershipTransferred',
    type: 'event',
    inputs: [
      { indexed: true, name: 'previousOwner', type: 'address' },
      { indexed: true, name: 'newOwner', type: 'address' }
    ],
  },
] as const

// Type definitions for better TypeScript support
export type APXTokenFunctions = {
  // Read functions
  name: () => Promise<string>
  symbol: () => Promise<string>
  decimals: () => Promise<number>
  totalSupply: () => Promise<bigint>
  balanceOf: (account: Address) => Promise<bigint>
  allowance: (owner: Address, spender: Address) => Promise<bigint>
  owner: () => Promise<Address>
  paused: () => Promise<boolean>
  getVotes: (account: Address) => Promise<bigint>
  delegates: (account: Address) => Promise<Address>
  nonces: (owner: Address) => Promise<bigint>
  
  // Write functions
  transfer: (to: Address, value: bigint) => Promise<`0x${string}`>
  approve: (spender: Address, value: bigint) => Promise<`0x${string}`>
  transferFrom: (from: Address, to: Address, value: bigint) => Promise<`0x${string}`>
  
  // Admin functions
  mint: (to: Address, amount: bigint) => Promise<`0x${string}`>
  pause: () => Promise<`0x${string}`>
  unpause: () => Promise<`0x${string}`>
  
  // User functions
  burn: (value: bigint) => Promise<`0x${string}`>
  burnFrom: (account: Address, value: bigint) => Promise<`0x${string}`>
  delegate: (delegatee: Address) => Promise<`0x${string}`>
}

// Helper function to check if an address is the admin
export const isAPXAdmin = (address: Address | undefined): boolean => {
  return address?.toLowerCase() === APX_TOKEN_CONFIG.adminWallet.toLowerCase()
}

// Helper function to format APX token amounts
export const formatAPXAmount = (amount: bigint, decimals: number = APX_TOKEN_CONFIG.decimals): string => {
  const divisor = BigInt(10 ** decimals)
  const quotient = amount / divisor
  const remainder = amount % divisor
  
  if (remainder === 0n) {
    return quotient.toString()
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0').replace(/0+$/, '')
  return `${quotient}.${remainderStr}`
}

// Helper function to parse APX token amounts
export const parseAPXAmount = (amount: string, decimals: number = APX_TOKEN_CONFIG.decimals): bigint => {
  const [integer, decimal = ''] = amount.split('.')
  const integerPart = BigInt(integer)
  const decimalPart = BigInt(decimal.padEnd(decimals, '0').slice(0, decimals))
  
  return integerPart * BigInt(10 ** decimals) + decimalPart
}
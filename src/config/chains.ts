import { base } from 'viem/chains'

export const defaultChain = base

export const chains = [base]

export const getDefaultConfig = () => ({
  chains: [base],
  defaultChainId: Number(import.meta.env.VITE_CHAIN_ID) || base.id,
  rpcUrl: import.meta.env.VITE_RPC_URL || base.rpcUrls.default.http[0],
})
import { useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { parseEventLogs, getAddress, zeroAddress } from 'viem'
import { APX_TOKEN_CONFIG, APX_TOKEN_ABI, formatAPXAmount } from '@/config/apxToken'
import { CLAIM_DISTRIBUTOR_CONFIG } from '@/config/claimDistributor'
import { useAppStore, type Activity } from '@/store/useAppStore'

export function useTransactionHistory() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { addTransaction, setActivity, clearActivity } = useAppStore()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastBlockFetched, setLastBlockFetched] = useState<bigint | null>(null)

  // Helper function to determine transaction type
  const getTransactionType = (from: string, to: string, userAddress: string): Activity['type'] => {
    const isUserSender = from.toLowerCase() === userAddress.toLowerCase()
    const isUserReceiver = to.toLowerCase() === userAddress.toLowerCase()
    const isBurn = to.toLowerCase() === zeroAddress.toLowerCase()
    const isClaimDistributor = from.toLowerCase() === CLAIM_DISTRIBUTOR_CONFIG.contractAddress.toLowerCase()

    if (isBurn && isUserSender) return 'burn'
    if (isClaimDistributor && isUserReceiver) return 'daily_claim' // Will be refined by claim events
    if (isUserSender && !isUserReceiver) return 'send'
    return 'earn' // Default for received tokens
  }

  // Fetch transaction history from blockchain
  const fetchTransactionHistory = async (fromBlock?: bigint) => {
    if (!address || !publicClient) return []

    try {
      setIsLoading(true)
      setError(null)

      const currentBlock = await publicClient.getBlockNumber()
      const startBlock = fromBlock || currentBlock - 10000n // Last ~10k blocks (~2 days on Base)

      console.log(`📊 Fetching transaction history from block ${startBlock} to ${currentBlock}`)

      // 1. Fetch APX Token Transfer events
      const transferLogs = await publicClient.getLogs({
        address: APX_TOKEN_CONFIG.address,
        event: {
          type: 'event',
          name: 'Transfer',
          inputs: [
            { indexed: true, name: 'from', type: 'address' },
            { indexed: true, name: 'to', type: 'address' },
            { indexed: false, name: 'value', type: 'uint256' }
          ],
        },
        args: {
          from: address as any,
        },
        fromBlock: startBlock,
        toBlock: currentBlock,
      })

      const receivedLogs = await publicClient.getLogs({
        address: APX_TOKEN_CONFIG.address,
        event: {
          type: 'event',
          name: 'Transfer',
          inputs: [
            { indexed: true, name: 'from', type: 'address' },
            { indexed: true, name: 'to', type: 'address' },
            { indexed: false, name: 'value', type: 'uint256' }
          ],
        },
        args: {
          to: address as any,
        },
        fromBlock: startBlock,
        toBlock: currentBlock,
      })

      // 2. Fetch Claim events
      const dailyClaimLogs = await publicClient.getLogs({
        address: CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
        event: {
          type: 'event',
          name: 'DailyClaimed',
          inputs: [
            { indexed: true, name: 'user', type: 'address' },
            { indexed: false, name: 'amount', type: 'uint256' },
            { indexed: false, name: 'streak', type: 'uint256' },
            { indexed: false, name: 'bonusPercent', type: 'uint256' }
          ],
        },
        args: {
          user: address as any,
        },
        fromBlock: startBlock,
        toBlock: currentBlock,
      })

      const weeklyClaimLogs = await publicClient.getLogs({
        address: CLAIM_DISTRIBUTOR_CONFIG.contractAddress,
        event: {
          type: 'event',
          name: 'WeeklyClaimed',
          inputs: [
            { indexed: true, name: 'user', type: 'address' },
            { indexed: false, name: 'amount', type: 'uint256' },
            { indexed: false, name: 'streak', type: 'uint256' },
            { indexed: false, name: 'bonusPercent', type: 'uint256' }
          ],
        },
        args: {
          user: address as any,
        },
        fromBlock: startBlock,
        toBlock: currentBlock,
      })

      console.log(`📊 Found ${transferLogs.length} sent transfers, ${receivedLogs.length} received transfers, ${dailyClaimLogs.length} daily claims, ${weeklyClaimLogs.length} weekly claims`)

      // 3. Process all logs and convert to Activity[]
      const activities: Activity[] = []

      // Process transfer events
      const allTransferLogs = [...transferLogs, ...receivedLogs]
      const uniqueTransferLogs = allTransferLogs.filter((log, index, self) => 
        index === self.findIndex(l => l.transactionHash === log.transactionHash && l.logIndex === log.logIndex)
      )

      for (const log of uniqueTransferLogs) {
        try {
          const block = await publicClient.getBlock({ blockHash: log.blockHash })
          const parsedLog = parseEventLogs({
            abi: APX_TOKEN_ABI,
            logs: [log],
          })[0]

          if (parsedLog?.eventName === 'Transfer') {
            const { from, to, value } = parsedLog.args
            const formattedAmount = formatAPXAmount(value)
            const transactionType = getTransactionType(from, to, address)

            // Skip Transfer events from ClaimDistributor to avoid duplicates with Claim events
            const isFromClaimDistributor = from.toLowerCase() === CLAIM_DISTRIBUTOR_CONFIG.contractAddress.toLowerCase()
            if (isFromClaimDistributor) {
              continue // Skip this transfer as it will be captured by DailyClaimed/WeeklyClaimed events
            }

            activities.push({
              id: `${log.transactionHash}-${log.logIndex}`,
              type: transactionType,
              amount: formattedAmount,
              date: new Date(Number(block.timestamp) * 1000).toISOString(),
              tx: log.transactionHash,
              description: transactionType === 'burn' ? 'Tokens burned' :
                          transactionType === 'send' ? `Sent to ${to.slice(0, 6)}...${to.slice(-4)}` :
                          'Tokens received',
              fromAddress: from,
              toAddress: to,
            })
          }
        } catch (err) {
          console.warn('Failed to process transfer log:', err)
        }
      }

      // Process daily claim events
      for (const log of dailyClaimLogs) {
        try {
          const block = await publicClient.getBlock({ blockHash: log.blockHash })
          const parsedLog = parseEventLogs({
            abi: CLAIM_DISTRIBUTOR_CONFIG.abi,
            logs: [log],
          })[0]

          if (parsedLog?.eventName === 'DailyClaimed') {
            const { amount, streak, bonusPercent } = parsedLog.args
            const formattedAmount = formatAPXAmount(amount)

            activities.push({
              id: `daily-${log.transactionHash}-${log.logIndex}`,
              type: 'daily_claim',
              amount: formattedAmount,
              date: new Date(Number(block.timestamp) * 1000).toISOString(),
              tx: log.transactionHash,
              description: 'Daily reward claimed',
              streakDay: Number(streak),
              isStreakBonus: Number(bonusPercent) > 0,
              frequency: 'daily',
            })
          }
        } catch (err) {
          console.warn('Failed to process daily claim log:', err)
        }
      }

      // Process weekly claim events
      for (const log of weeklyClaimLogs) {
        try {
          const block = await publicClient.getBlock({ blockHash: log.blockHash })
          const parsedLog = parseEventLogs({
            abi: CLAIM_DISTRIBUTOR_CONFIG.abi,
            logs: [log],
          })[0]

          if (parsedLog?.eventName === 'WeeklyClaimed') {
            const { amount, streak, bonusPercent } = parsedLog.args
            const formattedAmount = formatAPXAmount(amount)

            activities.push({
              id: `weekly-${log.transactionHash}-${log.logIndex}`,
              type: 'weekly_claim',
              amount: formattedAmount,
              date: new Date(Number(block.timestamp) * 1000).toISOString(),
              tx: log.transactionHash,
              description: 'Weekly reward claimed',
              streakDay: Number(streak),
              isStreakBonus: Number(bonusPercent) > 0,
              frequency: 'weekly',
            })
          }
        } catch (err) {
          console.warn('Failed to process weekly claim log:', err)
        }
      }

      // Sort activities by date (newest first)
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      console.log(`📊 Processed ${activities.length} activities`)
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

  // Sync transaction history on account change
  useEffect(() => {
    if (address && publicClient) {
      fetchTransactionHistory().then(activities => {
        // Clear existing activities and set new ones
        clearActivity()
        setActivity(activities)
      })
    } else {
      // Clear activity when disconnected
      clearActivity()
    }
  }, [address, publicClient, clearActivity, setActivity])

  // Function to refresh history manually
  const refreshHistory = async () => {
    const activities = await fetchTransactionHistory()
    clearActivity()
    setActivity(activities)
  }

  // Function to fetch only new transactions since last update
  const fetchNewTransactions = async () => {
    if (lastBlockFetched) {
      const activities = await fetchTransactionHistory(lastBlockFetched + 1n)
      activities.forEach(activity => {
        addTransaction(activity)
      })
    }
  }

  return {
    isLoading,
    error,
    refreshHistory,
    fetchNewTransactions,
    lastBlockFetched: lastBlockFetched ? Number(lastBlockFetched) : null,
  }
}
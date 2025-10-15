import { Download, ArrowRight, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button, buttonVariants } from '@/components/ui/button'
import { useAppStore } from '@/store/useAppStore'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useKudos } from '@/hooks/useKudos'
import { useClaimRewards } from '@/hooks/useClaimRewards'
import { cn } from '@/lib/utils'

const Claim = () => {
  const { isConnected, pendingClaim } = useAppStore()
  const navigate = useNavigate()
  const { isLoading: isLoadingKudos } = useKudos()
  const { claimRewards, isPending, isSuccess } = useClaimRewards()
  
  const handleClaim = async () => {
    try {
      await claimRewards()
      toast.success('Claim complete! Kudos added to your wallet.', {
        duration: 3000,
      })
    } catch (error) {
      toast.error('Failed to claim rewards. Please try again.', {
        duration: 3000,
      })
    }
  }
  
  if (!isConnected) {
    return (
      <>
        <Header title="Claim Rewards" subtitle="Claim pending kudos" />
        <div className="px-6 py-12 text-center">
          <Download className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Connect your wallet to claim rewards
          </p>
        </div>
      </>
    )
  }
  
  const hasPending = Number(pendingClaim) > 0
  const isLoading = isLoadingKudos || isPending
  
  return (
    <>
      <Header title="Claim Rewards" subtitle="Claim pending kudos" />
      
      <div className="px-6 pb-8">
        <div className="p-6 bg-card rounded-xl border border-border mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              hasPending ? 'bg-brand' : 'bg-muted'
            }`}>
              <Download className={`w-6 h-6 ${hasPending ? 'text-white' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Claim</p>
              <p className={`text-3xl font-bold ${hasPending ? 'text-white' : 'text-muted-foreground'}`}>
                {isLoadingKudos ? '...' : pendingClaim}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleClaim}
            disabled={!hasPending || isLoading}
            className={cn(
              "w-full h-12 mb-3",
              buttonVariants({ variant: "default", size: "lg" })
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isPending ? 'Claiming...' : 'Loading...'}
              </>
            ) : hasPending ? (
              <>
                Claim Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              'No Pending Claims'
            )}
          </Button>
          
          <Button
            onClick={() => navigate('/activity')}
            className={cn(
              "w-full h-12",
              buttonVariants({ variant: "outline", size: "lg" })
            )}
          >
            View History
          </Button>
        </div>
        
        {!hasPending && !isLoading && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              All rewards claimed! Keep earning more kudos.
            </p>
          </div>
        )}
      </div>
    </>
  )
}

export default Claim

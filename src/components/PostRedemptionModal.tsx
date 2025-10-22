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

  const handleSkip = () => {
    onClose()
    setEmail('')
    setSubmitted(false)
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
              data-testid="contact-email"
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
              onClick={handleSkip}
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
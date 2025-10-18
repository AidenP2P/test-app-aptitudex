import { useState, useEffect } from 'react'
import { Clock, Timer, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CountdownTimerProps {
  targetDate: Date | null
  onComplete?: () => void
  className?: string
  variant?: 'default' | 'compact' | 'detailed'
  showIcon?: boolean
  showLabels?: boolean
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

export function CountdownTimer({
  targetDate,
  onComplete,
  className,
  variant = 'default',
  showIcon = true,
  showLabels = true
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const calculateTimeRemaining = (): TimeRemaining | null => {
    if (!targetDate) return null

    const now = new Date().getTime()
    const target = targetDate.getTime()
    const difference = target - now

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0
      }
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24))
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((difference % (1000 * 60)) / 1000)

    return {
      days,
      hours,
      minutes,
      seconds,
      total: difference
    }
  }

  useEffect(() => {
    const updateTimer = () => {
      const remaining = calculateTimeRemaining()
      setTimeRemaining(remaining)

      if (remaining && remaining.total <= 0 && !isComplete) {
        setIsComplete(true)
        onComplete?.()
      }
    }

    // Update immediately
    updateTimer()

    // Set up interval to update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [targetDate, onComplete, isComplete])

  if (!targetDate || !timeRemaining) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        {showIcon && <Clock className="w-4 h-4" />}
        <span className="text-sm">No timer active</span>
      </div>
    )
  }

  if (timeRemaining.total <= 0) {
    return (
      <div className={cn("flex items-center gap-2 text-green-600", className)}>
        {showIcon && <Timer className="w-4 h-4" />}
        <span className="text-sm font-medium">Available now!</span>
      </div>
    )
  }

  const formatTime = () => {
    const { days, hours, minutes, seconds } = timeRemaining

    switch (variant) {
      case 'compact':
        if (days > 0) return `${days}d ${hours}h`
        if (hours > 0) return `${hours}h ${minutes}m`
        return `${minutes}m ${seconds}s`

      case 'detailed':
        const parts = []
        if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`)
        if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`)
        if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`)
        if (days === 0 && hours === 0) parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`)
        return parts.join(', ')

      default:
        if (days > 0) return `${days}d ${hours}h ${minutes}m`
        if (hours > 0) return `${hours}h ${minutes}m`
        return `${minutes}m ${seconds}s`
    }
  }

  const getIcon = () => {
    if (!showIcon) return null
    
    if (timeRemaining.days > 0) {
      return <Calendar className="w-4 h-4" />
    } else {
      return <Clock className="w-4 h-4" />
    }
  }

  const getTextColor = () => {
    if (timeRemaining.total < 300000) { // Less than 5 minutes
      return "text-red-600"
    } else if (timeRemaining.total < 3600000) { // Less than 1 hour
      return "text-orange-600"
    } else {
      return "text-muted-foreground"
    }
  }

  return (
    <div className={cn("flex items-center gap-2", getTextColor(), className)}>
      {getIcon()}
      <span className="text-sm font-medium">{formatTime()}</span>
    </div>
  )
}

/**
 * Composant de timer circulaire pour les countdowns visuels
 */
export function CircularCountdownTimer({
  targetDate,
  size = 60,
  strokeWidth = 4,
  className
}: {
  targetDate: Date | null
  size?: number
  strokeWidth?: number
  className?: string
}) {
  const [progress, setProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)

  useEffect(() => {
    if (!targetDate) return

    const updateProgress = () => {
      const now = new Date().getTime()
      const target = targetDate.getTime()
      const difference = target - now

      if (difference <= 0) {
        setProgress(100)
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0
        })
        return
      }

      // Calculate progress based on 24 hours (for daily) or 7 days (for weekly)
      const totalDuration = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
      const elapsed = totalDuration - difference
      const progressPercent = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))

      setProgress(progressPercent)

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        total: difference
      })
    }

    updateProgress()
    const interval = setInterval(updateProgress, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  if (!targetDate || !timeRemaining) {
    return null
  }

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const getDisplayTime = () => {
    if (timeRemaining.days > 0) return `${timeRemaining.days}d`
    if (timeRemaining.hours > 0) return `${timeRemaining.hours}h`
    return `${timeRemaining.minutes}m`
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted-foreground/20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={timeRemaining.total < 3600000 ? "text-orange-500" : "text-blue-500"}
          style={{
            transition: 'stroke-dashoffset 1s ease-in-out'
          }}
        />
      </svg>
      {/* Time display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium">
          {timeRemaining.total <= 0 ? '✓' : getDisplayTime()}
        </span>
      </div>
    </div>
  )
}

/**
 * Hook pour obtenir le temps restant formaté
 */
export function useCountdown(targetDate: Date | null) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!targetDate) {
      setTimeRemaining(null)
      return
    }

    const updateTimer = () => {
      const now = new Date().getTime()
      const target = targetDate.getTime()
      const difference = target - now

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0
        })
        setIsComplete(true)
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        total: difference
      })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  return {
    timeRemaining,
    isComplete,
    formatCompact: () => {
      if (!timeRemaining || timeRemaining.total <= 0) return 'Available now!'
      const { days, hours, minutes } = timeRemaining
      if (days > 0) return `${days}d ${hours}h`
      if (hours > 0) return `${hours}h ${minutes}m`
      return `${minutes}m`
    },
    formatDetailed: () => {
      if (!timeRemaining || timeRemaining.total <= 0) return 'Available now!'
      const { days, hours, minutes, seconds } = timeRemaining
      const parts = []
      if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`)
      if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`)
      if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`)
      if (days === 0 && hours === 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`)
      return parts.join(', ')
    }
  }
}
interface FeedbackBannerProps {
  kind?: 'success' | 'error' | 'warning' | 'info'
  message: string
  compact?: boolean
}

export default function FeedbackBanner({ kind = 'info', message, compact = false }: FeedbackBannerProps) {
  if (!message.trim()) return null

  return (
    <div className={`feedback-banner feedback-${kind}${compact ? ' feedback-compact' : ''}`} role="status" aria-live="polite">
      {message}
    </div>
  )
}

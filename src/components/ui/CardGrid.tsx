import type { ReactNode } from 'react'

export interface CardGridProps {
  children: ReactNode
  columns?: number
  gap?: 'sm' | 'md' | 'lg'
}

export function CardGrid({ children, columns = 3, gap = 'md' }: CardGridProps) {
  const gapClass = {
    sm: 'gap-sm',
    md: 'gap-md',
    lg: 'gap-lg',
  }[gap]

  return (
    <div className={`card-grid card-grid-${columns} ${gapClass}`}>
      {children}
    </div>
  )
}

interface ItemCardProps {
  children: ReactNode
  onClick?: () => void
  className?: string
}

export function ItemCard({ children, onClick, className = '' }: ItemCardProps) {
  return (
    <div 
      className={`item-card ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}

interface ItemCardHeaderProps {
  children: ReactNode
  action?: ReactNode
}

export function ItemCardHeader({ children, action }: ItemCardHeaderProps) {
  return (
    <div className="item-card-header">
      <div className="item-card-title">{children}</div>
      {action && <div className="item-card-action">{action}</div>}
    </div>
  )
}

interface ItemCardContentProps {
  children: ReactNode
}

export function ItemCardContent({ children }: ItemCardContentProps) {
  return <div className="item-card-content">{children}</div>
}

interface ItemCardFooterProps {
  children: ReactNode
}

export function ItemCardFooter({ children }: ItemCardFooterProps) {
  return <div className="item-card-footer">{children}</div>
}

interface ItemCardFieldProps {
  label: string
  value: ReactNode
  truncate?: boolean
}

export function ItemCardField({ label, value, truncate = false }: ItemCardFieldProps) {
  return (
    <div className={`item-card-field ${truncate ? 'truncate' : ''}`}>
      <span className="item-card-label">{label}</span>
      <span className="item-card-value">{value}</span>
    </div>
  )
}

interface ItemCardActionsProps {
  children: ReactNode
}

export function ItemCardActions({ children }: ItemCardActionsProps) {
  return <div className="item-card-actions">{children}</div>
}

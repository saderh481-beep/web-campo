import { Loader2 } from 'lucide-react'

interface LoaderProps {
  text?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

export function Loader({ text = 'Cargando...', size = 'md', fullScreen = false }: LoaderProps) {
  const sizeMap = { sm: 16, md: 24, lg: 32 }
  const spinner = (
    <div className="loader-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Loader2 size={sizeMap[size]} className="spinner spinner-guinda" style={{ width: sizeMap[size], height: sizeMap[size] }} />
      <span>{text}</span>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="full-screen-loader">
        {spinner}
      </div>
    )
  }

  return spinner
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon">{icon}</div>}
      <h3 className="empty-title">{title}</h3>
      {description && <p className="empty-description">{description}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  )
}

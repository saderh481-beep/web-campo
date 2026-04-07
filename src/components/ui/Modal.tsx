import { X } from 'lucide-react'
import { type ReactNode } from 'react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, footer, wide, size = 'md' }: ModalProps) {
  if (!isOpen) return null

  const sizeClasses = {
    sm: '400px',
    md: '520px',
    lg: '720px',
    xl: '920px',
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal" style={{ maxWidth: wide ? 'min(920px, 96vw)' : sizeClasses[size] }}>
        <div className="modal-header">
          <h3 id="modal-title">{title}</h3>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  const variantClasses = {
    danger: 'btn-danger',
    warning: 'btn-primary',
    info: 'btn-primary',
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${variantClasses[variant]}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  )
}

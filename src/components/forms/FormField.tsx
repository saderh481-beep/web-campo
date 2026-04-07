import { type ReactNode } from 'react'

interface FormFieldProps {
  label: string
  children: ReactNode
  error?: string
  hint?: string
  required?: boolean
}

export function FormField({ label, children, error, hint, required }: FormFieldProps) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {required && <span className="required-mark">*</span>}
      </label>
      {children}
      {error && <span className="form-error">{error}</span>}
      {hint && !error && <span className="form-hint">{hint}</span>}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export function Input({ error, className = '', ...props }: InputProps) {
  return (
    <input
      className={`input ${error ? 'input-error' : ''} ${className}`}
      {...props}
    />
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>
  error?: string
  placeholder?: string
}

export function Select({ options, error, placeholder, className = '', ...props }: SelectProps) {
  return (
    <select
      className={`input ${error ? 'input-error' : ''} ${className}`}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export function TextArea({ error, className = '', ...props }: TextAreaProps) {
  return (
    <textarea
      className={`input textarea ${error ? 'input-error' : ''} ${className}`}
      {...props}
    />
  )
}

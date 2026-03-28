import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    void error
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error de render en la aplicación', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--gray-50)',
      }}>
        <div className="card" style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8, color: 'var(--gray-900)', fontSize: 22 }}>Se detectó un error en la pantalla</h2>
          <p style={{ color: 'var(--gray-500)', marginBottom: 16 }}>
            La vista falló al renderizar. Ya registramos el detalle en consola.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Recargar aplicación
          </button>
        </div>
      </div>
    )
  }
}

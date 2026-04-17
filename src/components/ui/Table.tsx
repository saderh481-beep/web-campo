import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export interface TableColumn<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

export interface PaginationConfig {
  page: number
  pageSize: number
  total: number
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  keyField: keyof T
  loading?: boolean
  emptyMessage?: string
  pagination?: PaginationConfig
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  renderActions?: (item: T) => React.ReactNode
}

const PAGE_SIZE_OPTIONS = [5, 10]

export function Table<T>({
  columns,
  data,
  keyField,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  pagination,
  onPageChange,
  onPageSizeChange,
  renderActions,
}: TableProps<T>) {
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1
  const maxPageSize = 5 // SaaS limit
  const startItem = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 1
  const endItem = pagination ? Math.min(pagination.page * pagination.pageSize, pagination.total) : data.length

  const goToPage = (page: number) => {
    if (pagination && onPageChange) {
      const validPage = Math.max(1, Math.min(page, totalPages))
      onPageChange(validPage)
    }
  }

  return (
    <div className="table-container">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} className={col.className}>
                  {col.header}
                </th>
              ))}
              {renderActions && <th className="actions-col">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (renderActions ? 1 : 0)} className="loading-cell">
                  <div className="loading-state">
                    <div className="spinner spinner-guinda" />
                    <span>Cargando...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (renderActions ? 1 : 0)} className="empty-cell">
                  <div className="empty-state">
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={String(item[keyField])}>
                  {columns.map((col) => (
                    <td key={String(col.key)} className={col.className}>
                      {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key as string] ?? '')}
                    </td>
                  ))}
                  {renderActions && <td className="actions-cell">{renderActions(item)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="table-pagination" role="navigation" aria-label="Paginación de tabla">
          <div className="pagination-info">
            <span>Mostrando</span>
            <strong>{startItem}-{endItem}</strong>
            <span>de</span>
            <strong>{pagination.total}</strong>
          </div>

          <div className="pagination-controls">
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => goToPage(1)}
              disabled={pagination.page === 1}
              aria-label="Primera página"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page === 1}
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="pagination-page-info">
              Página <strong>{pagination.page}</strong> de <strong>{totalPages}</strong>
            </span>

            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              aria-label="Página siguiente"
            >
              <ChevronRight size={16} />
            </button>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => goToPage(totalPages)}
              disabled={pagination.page >= totalPages}
              aria-label="Última página"
            >
              <ChevronsRight size={16} />
            </button>
          </div>

          <div className="pagination-size">
            <label htmlFor="page-size-select">Filas por página:</label>
            <select
              id="page-size-select"
              className="input"
              value={pagination.pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.filter(size => size <= maxPageSize).map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

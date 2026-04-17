import { useState, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X } from 'lucide-react'

export interface TableColumn<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
  truncate?: boolean
  tooltip?: boolean
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

interface TableCompactProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  keyField: keyof T
  loading?: boolean
  emptyMessage?: string
  pagination?: PaginationState
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  renderActions?: (item: T) => React.ReactNode
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  initialSearch?: string
  maxHeight?: string
}

const PAGE_SIZE_OPTIONS = [5, 10, 20]

export function TableCompact<T>({
  columns,
  data,
  keyField,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  pagination,
  onPageChange,
  onPageSizeChange,
  renderActions,
  searchable = false,
  searchPlaceholder = 'Buscar...',
  onSearch,
  initialSearch = '',
  maxHeight = '480px',
}: TableCompactProps<T>) {
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || !searchable) return data
    const query = searchQuery.toLowerCase()
    return data.filter((item) =>
      columns.some((col) => {
        const value = (item as Record<string, unknown>)[col.key as string]
        return value ? String(value).toLowerCase().includes(query) : false
      })
    )
  }, [data, searchQuery, columns, searchable])

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1
  const startItem = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 1
  const endItem = pagination ? Math.min(pagination.page * pagination.pageSize, pagination.total) : filteredData.length

  const goToPage = useCallback((page: number) => {
    if (pagination && onPageChange) {
      const validPage = Math.max(1, Math.min(page, totalPages))
      onPageChange(validPage)
    }
  }, [pagination, onPageChange, totalPages])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearch?.(value)
  }

  const clearSearch = () => {
    setSearchQuery('')
    onSearch?.('')
  }

  return (
    <div className="table-compact-container">
      {searchable && (
        <div className="table-compact-search">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="input search-input"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button className="search-clear" onClick={clearSearch} aria-label="Limpiar búsqueda">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="table-compact-wrapper" style={{ maxHeight }}>
        <table className="table-compact">
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
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (renderActions ? 1 : 0)} className="empty-cell">
                  <div className="empty-state">
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={String(item[keyField])}>
                  {columns.map((col) => (
                    <td 
                      key={String(col.key)} 
                      className={`${col.className || ''} ${col.truncate ? 'truncate' : ''}`}
                      title={col.tooltip ? String((item as Record<string, unknown>)[col.key as string] || '') : undefined}
                    >
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
        <div className="table-compact-pagination">
          <div className="pagination-info">
            <span>Mostrando</span>
            <strong>{startItem}-{endItem}</strong>
            <span>de</span>
            <strong>{pagination.total}</strong>
            {searchable && searchQuery && (
              <span className="pagination-filtered">
                ({filteredData.length} resultados)
              </span>
            )}
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
            <label htmlFor="page-size-select">Filas:</label>
            <select
              id="page-size-select"
              className="input"
              value={pagination.pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
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

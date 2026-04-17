import { useState, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X } from 'lucide-react'
import type { ReactNode } from 'react'

export interface TableColumn<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => ReactNode
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

interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  keyField: keyof T
  loading?: boolean
  emptyMessage?: string
  pageSize?: number
  initialPage?: number
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  initialSearch?: string
  maxHeight?: string
  renderActions?: (item: T) => ReactNode
}

const DEFAULT_PAGE_SIZE = 5

export function Table<T>({
  columns,
  data,
  keyField,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  pageSize = DEFAULT_PAGE_SIZE,
  initialPage = 1,
  searchable = false,
  searchPlaceholder = 'Buscar...',
  onSearch,
  initialSearch = '',
  maxHeight = '400px',
  renderActions,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(initialPage)
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

  const totalItems = filteredData.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const validPage = Math.min(Math.max(1, currentPage), totalPages)
  
  const startIndex = (validPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedData = filteredData.slice(startIndex, endIndex)

  const goToPage = useCallback((page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(targetPage)
  }, [totalPages])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setCurrentPage(1)
    onSearch?.(value)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setCurrentPage(1)
    onSearch?.('')
  }

  return (
    <div className="table-container">
      {searchable && (
        <div className="table-search">
          <div className="search-input-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center', maxWidth: 320 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, color: 'var(--gray-400)' }} />
            <input
              type="text"
              className="input"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              style={{ paddingLeft: 36, paddingRight: 32, width: '100%' }}
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={clearSearch} 
                style={{ 
                  position: 'absolute', 
                  right: 8, 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  color: 'var(--gray-400)',
                  padding: 4
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="table-wrap" style={{ maxHeight }}>
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
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (renderActions ? 1 : 0)} className="empty-cell">
                  <div className="empty-state">
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
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

      <div className="table-pagination" role="navigation" aria-label="Paginación de tabla">
        <div className="pagination-info">
          <span>Mostrando</span>
          <strong>{totalItems > 0 ? startIndex + 1 : 0}-{endIndex}</strong>
          <span>de</span>
          <strong>{totalItems}</strong>
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
            disabled={validPage === 1}
            aria-label="Primera página"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => goToPage(validPage - 1)}
            disabled={validPage === 1}
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="pagination-page-info">
            Página <strong>{validPage}</strong> de <strong>{totalPages}</strong>
          </span>

          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => goToPage(validPage + 1)}
            disabled={validPage >= totalPages}
            aria-label="Página siguiente"
          >
            <ChevronRight size={16} />
          </button>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => goToPage(totalPages)}
            disabled={validPage >= totalPages}
            aria-label="Última página"
          >
            <ChevronsRight size={16} />
          </button>
        </div>

        <div className="pagination-size">
          <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>
            {pageSize} por página
          </span>
        </div>
      </div>
    </div>
  )
}

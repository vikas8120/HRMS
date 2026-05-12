import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import StatusBadge from './StatusBadge'
import EmptyState from './EmptyState'

function DataTable({
  columns = [],
  rows = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  showViewAction = true,
  showEditAction = true,
  showDeleteAction = true,
  defaultSortKey = '',
  defaultSortDirection = 'asc',
  emptyTitle,
  emptyDescription
}) {
  const [sortConfig, setSortConfig] = useState({
    key: defaultSortKey,
    direction: defaultSortDirection
  })

  const sortableColumnMap = useMemo(
    () => Object.fromEntries(columns.map((column) => [column.key, column.sortable !== false])),
    [columns]
  )

  const sortedRows = useMemo(() => {
    if (!sortConfig.key || !sortableColumnMap[sortConfig.key]) return rows

    const sorted = [...rows].sort((a, b) => {
      const aRaw = a?.[sortConfig.key]
      const bRaw = b?.[sortConfig.key]
      const aValue = typeof aRaw === 'number' ? aRaw : String(aRaw ?? '').toLowerCase()
      const bValue = typeof bRaw === 'number' ? bRaw : String(bRaw ?? '').toLowerCase()

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [rows, sortConfig, sortableColumnMap])

  const handleSort = (key) => {
    if (!sortableColumnMap[key]) return
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' }
      return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
    })
  }

  const renderSortIcon = (key) => {
    if (!sortableColumnMap[key]) return null
    if (sortConfig.key !== key) return <ArrowUpDown size={14} />
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
  }

  if (!loading && rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="table-wrap">
      <div className="table-meta">
        <p>{sortedRows.length} record{sortedRows.length === 1 ? '' : 's'}</p>
      </div>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>
                {sortableColumnMap[column.key] ? (
                  <button type="button" className="table-sort-btn" onClick={() => handleSort(column.key)}>
                    <span>{column.label}</span>
                    {renderSortIcon(column.key)}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
            {showActions ? <th>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={`${row.id}-${column.key}`}>
                  {column.key === 'status' || column.key === 'severity'
                    ? <StatusBadge status={row[column.key]} />
                    : row[column.key]}
                </td>
              ))}
              {showActions ? (
                <td>
                  <div className="table-actions">
                    {showViewAction ? <button className="text-btn action-view" title="View company" aria-label="View company" onClick={() => onView?.(row)}>View</button> : null}
                    {showEditAction ? <button className="text-btn action-edit" title="Edit company" aria-label="Edit company" onClick={() => onEdit?.(row)}>Edit</button> : null}
                    {showDeleteAction ? <button className="text-btn danger action-delete" title="Delete company" aria-label="Delete company" onClick={() => onDelete?.(row)}>Delete</button> : null}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable

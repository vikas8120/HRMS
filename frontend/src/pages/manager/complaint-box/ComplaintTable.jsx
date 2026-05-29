import { useMemo, useState } from 'react'
import EmptyState from '../../../components/ui/EmptyState'
import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'

const statusBadgeClass = {
  Open: 'complaint-badge complaint-badge-open',
  'Under Review': 'complaint-badge complaint-badge-under-review',
  Closed: 'complaint-badge complaint-badge-closed'
}

const severityBadgeClass = {
  Low: 'complaint-badge complaint-severity-low',
  Medium: 'complaint-badge complaint-severity-medium',
  High: 'complaint-badge complaint-severity-high'
}

function ComplaintTable({ rows = [], loading = false, onView, onEdit, onWithdraw, onDelete }) {
  const [sortKey, setSortKey] = useState('complaintDate')
  const [sortDirection, setSortDirection] = useState('desc')
  const [page, setPage] = useState(1)
  const pageSize = 8

  const sortedRows = useMemo(() => {
    const data = [...rows]
    data.sort((a, b) => {
      const aVal = String(a?.[sortKey] ?? '').toLowerCase()
      const bVal = String(b?.[sortKey] ?? '').toLowerCase()
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    return data
  }, [rows, sortKey, sortDirection])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedRows = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleSort = (key) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDirection('asc')
      return
    }
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }

  if (loading) return <LoadingSkeleton rows={6} />
  if (rows.length === 0) return <EmptyState title="No complaints found" description="Raise a complaint to begin tracking." />

  return (
    <div className="table-wrap">
      <div className="table-meta">
        <p>{sortedRows.length} record{sortedRows.length === 1 ? '' : 's'}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th><button className="table-sort-btn" type="button" onClick={() => handleSort('complaintNo')}><span>Complaint No.</span></button></th>
            <th><button className="table-sort-btn" type="button" onClick={() => handleSort('complaintDate')}><span>Date</span></button></th>
            <th><button className="table-sort-btn" type="button" onClick={() => handleSort('againstEmployee')}><span>Against Employee</span></button></th>
            <th><button className="table-sort-btn" type="button" onClick={() => handleSort('complaintCategory')}><span>Category</span></button></th>
            <th><button className="table-sort-btn" type="button" onClick={() => handleSort('severityLevel')}><span>Severity</span></button></th>
            <th><button className="table-sort-btn" type="button" onClick={() => handleSort('status')}><span>Status</span></button></th>
            <th><button className="table-sort-btn" type="button" onClick={() => handleSort('confidential')}><span>Confidential</span></button></th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pagedRows.map((row) => {
            const canManage = row.status === 'Open'
            return (
              <tr key={row.id}>
                <td>{row.complaintNo}</td>
                <td>{row.complaintDate}</td>
                <td>{row.againstEmployee}</td>
                <td>{row.complaintCategory}</td>
                <td><span className={severityBadgeClass[row.severityLevel] || 'complaint-badge complaint-severity-low'}>{row.severityLevel}</span></td>
                <td><span className={statusBadgeClass[row.status] || 'complaint-badge complaint-badge-open'}>{row.status}</span></td>
                <td>{row.confidential}</td>
                <td>
                  <div className="table-actions">
                    <button className="text-btn action-view" onClick={() => onView?.(row)}>View</button>
                    {canManage ? <button className="text-btn action-edit" onClick={() => onEdit?.(row)}>Edit</button> : null}
                    {canManage ? <button className="text-btn danger" onClick={() => onWithdraw?.(row)}>Withdraw</button> : null}
                    {canManage ? <button className="text-btn danger action-delete" onClick={() => onDelete?.(row)}>Delete</button> : null}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="actions-row grievance-pagination">
        <button type="button" className="text-btn" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={safePage === 1}>Prev</button>
        <span>Page {safePage} / {totalPages}</span>
        <button type="button" className="text-btn" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={safePage === totalPages}>Next</button>
      </div>
    </div>
  )
}

export default ComplaintTable

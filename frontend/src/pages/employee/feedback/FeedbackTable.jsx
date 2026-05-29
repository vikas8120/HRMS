import { useMemo, useState } from 'react'
import EmptyState from '../../../components/ui/EmptyState'
import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'

const statusClassByValue = {
  Pending: 'feedback-badge feedback-badge-pending',
  Reviewed: 'feedback-badge feedback-badge-reviewed',
  Implemented: 'feedback-badge feedback-badge-implemented'
}

function FeedbackTable({ rows = [], loading = false, onView, onEdit, onWithdraw, onDelete }) {
  const [sortKey, setSortKey] = useState('dateSubmitted')
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
  if (rows.length === 0) return <EmptyState title="No feedback found" description="Submit feedback to see records here." />

  return (
    <div className="table-wrap">
      <div className="table-meta">
        <p>{sortedRows.length} record{sortedRows.length === 1 ? '' : 's'}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th><button className="table-sort-btn" type="button" onClick={() => handleSort('feedbackNo')}><span>Feedback No.</span></button></th>
            <th><button className="table-sort-btn" type="button" onClick={() => handleSort('dateSubmitted')}><span>Date Submitted</span></button></th>
            <th><button className="table-sort-btn" type="button" onClick={() => handleSort('feedbackCategory')}><span>Category</span></button></th>
            <th><button className="table-sort-btn" type="button" onClick={() => handleSort('feedbackType')}><span>Type</span></button></th>
            <th><button className="table-sort-btn" type="button" onClick={() => handleSort('status')}><span>Status</span></button></th>
            <th>Feedback Details</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pagedRows.map((row) => {
            const canManage = row.status === 'Pending'
            return (
              <tr key={row.id}>
                <td>{row.feedbackNo}</td>
                <td>{row.dateSubmitted}</td>
                <td>{row.feedbackCategory}</td>
                <td>{row.feedbackType}</td>
                <td><span className={statusClassByValue[row.status] || 'feedback-badge feedback-badge-pending'}>{row.status}</span></td>
                <td>{row.feedbackDetails}</td>
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

export default FeedbackTable

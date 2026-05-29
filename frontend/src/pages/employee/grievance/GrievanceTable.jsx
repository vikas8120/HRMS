import EmptyState from '../../../components/ui/EmptyState'
import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'

const badgeClassByStatus = {
  Open: 'grievance-badge grievance-badge-open',
  'In Progress': 'grievance-badge grievance-badge-in-progress',
  Resolved: 'grievance-badge grievance-badge-resolved',
  Closed: 'grievance-badge grievance-badge-closed'
}

function GrievanceTable({
  loading = false,
  rows = [],
  onView,
  onEdit,
  onWithdraw,
  onDelete
}) {
  if (loading) return <LoadingSkeleton rows={6} />
  if (rows.length === 0) return <EmptyState title="No grievances found" description="Raise a grievance to start tracking your submissions." />

  return (
    <div className="table-wrap">
      <div className="table-meta">
        <p>{rows.length} record{rows.length === 1 ? '' : 's'}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Grievance No.</th>
            <th>Date Raised</th>
            <th>Type</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const canManage = row.status === 'Open'
            return (
              <tr key={row.id}>
                <td>{row.grievanceNo}</td>
                <td>{row.dateRaised}</td>
                <td>{row.grievanceType}</td>
                <td>{row.priority}</td>
                <td><span className={badgeClassByStatus[row.status] || 'grievance-badge grievance-badge-closed'}>{row.status}</span></td>
                <td>{row.description}</td>
                <td>
                  <div className="table-actions">
                    <button className="text-btn action-view" onClick={() => onView?.(row)}>View</button>
                    {canManage ? <button className="text-btn action-edit" onClick={() => onEdit?.(row)}>Edit</button> : null}
                    {canManage ? <button className="text-btn danger" onClick={() => onWithdraw?.(row)}>Withdraw</button> : null}
                    <button className="text-btn danger action-delete" onClick={() => onDelete?.(row)}>Delete</button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default GrievanceTable

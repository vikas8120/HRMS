import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import FilterDropdown from '../components/ui/FilterDropdown'
import FormInput from '../components/ui/FormInput'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import EmptyState from '../components/ui/EmptyState'
import StatCard from '../components/ui/StatCard'
import {
  getLeaves,
  approveLeave,
  rejectLeave,
  getLeaveBalance,
  getLeavePolicy,
  setLeavePolicy,
  getDepartments
} from '../api/adminLeaveApi'

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
]

const initialPolicy = { casual: 12, sick: 12, earned: 15 }

function CompanyAdminLeavesPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')

  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  const [departments, setDepartments] = useState([])
  const [policy, setPolicy] = useState(initialPolicy)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [balanceData, setBalanceData] = useState(null)

  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  const loadMeta = async () => {
    try {
      const [deptRes, policyRes] = await Promise.all([
        getDepartments({ status: 'all' }),
        getLeavePolicy()
      ])
      setDepartments(deptRes?.data || [])
      setPolicy(policyRes?.data || initialPolicy)
    } catch (_err) {
      setDepartments([])
      setPolicy(initialPolicy)
    }
  }

  const loadLeaves = async ({ keepLoading = false } = {}) => {
    if (!keepLoading) setLoading(true)
    setError('')

    try {
      const res = await getLeaves({
        status: statusFilter,
        departmentId: departmentFilter,
        date: dateFilter || undefined
      })
      setRows(res?.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load leave requests')
      setRows([])
    } finally {
      if (!keepLoading) setLoading(false)
    }
  }

  useEffect(() => {
    loadMeta()
    loadLeaves()
  }, [])

  const cards = useMemo(() => {
    const total = rows.length
    const pending = rows.filter((row) => row.status === 'pending').length
    const approved = rows.filter((row) => row.status === 'approved').length
    const rejected = rows.filter((row) => row.status === 'rejected').length

    return [
      { title: 'Total Requests', value: String(total), trend: 'All leave requests' },
      { title: 'Pending', value: String(pending), trend: 'Awaiting action' },
      { title: 'Approved', value: String(approved), trend: 'Approved by admin' },
      { title: 'Rejected', value: String(rejected), trend: 'Rejected with reason' }
    ]
  }, [rows])

  const deptMap = useMemo(
    () => Object.fromEntries(departments.map((d) => [String(d.id || d._id), d.name || 'Department'])),
    [departments]
  )

  const displayRows = useMemo(
    () => rows.map((row) => ({
      ...row,
      start: row.startDate ? String(row.startDate).slice(0, 10) : '-',
      end: row.endDate ? String(row.endDate).slice(0, 10) : '-',
      departmentName: deptMap[String(row.departmentId || '')] || '-'
    })),
    [rows, deptMap]
  )

  const applyFilters = async () => {
    await loadLeaves()
  }

  const onApprove = async (row) => {
    setSubmitting(true)
    try {
      const res = await approveLeave(row.id)
      const updated = res?.data
      setRows((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setToast({ type: 'success', message: 'Leave approved successfully' })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Approve failed' })
    } finally {
      setSubmitting(false)
    }
  }

  const openReject = (row) => {
    setSelected(row)
    setRejectionReason('')
    setRejectOpen(true)
  }

  const onReject = async () => {
    if (!selected?.id || !rejectionReason.trim()) {
      setToast({ type: 'error', message: 'Rejection reason is required' })
      return
    }

    setSubmitting(true)
    try {
      const res = await rejectLeave(selected.id, rejectionReason.trim())
      const updated = res?.data
      setRows((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setRejectOpen(false)
      setSelected(null)
      setRejectionReason('')
      setToast({ type: 'success', message: 'Leave rejected successfully' })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Reject failed' })
    } finally {
      setSubmitting(false)
    }
  }

  const openDetails = async (row) => {
    setSelected(row)
    setBalanceData(null)
    setDetailsOpen(true)
    try {
      const res = await getLeaveBalance(row.employeeId)
      setBalanceData(res?.data || null)
    } catch (_err) {
      setBalanceData(null)
    }
  }

  const onSavePolicy = async () => {
    setSubmitting(true)
    try {
      const payload = {
        casual: Number(policy.casual || 0),
        sick: Number(policy.sick || 0),
        earned: Number(policy.earned || 0)
      }
      const res = await setLeavePolicy(payload)
      setPolicy(res?.data || payload)
      setToast({ type: 'success', message: 'Leave policy updated successfully' })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to update policy' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Leaves"
        description="Review leave requests, approve/reject actions, and manage company leave policy."
        breadcrumb={['Company Admin', 'Leaves']}
        primaryActionLabel=""
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="stats-grid">
        {cards.map((card) => <StatCard key={card.title} title={card.title} value={card.value} trend={card.trend} />)}
      </div>

      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
          <FilterDropdown
            label="Department"
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={[{ value: 'all', label: 'All Departments' }, ...departments.map((d) => ({ value: String(d.id || d._id), label: d.name || 'Department' }))]}
          />
          <FormInput label="Date" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={applyFilters}>Apply Filters</Button>
          <Button variant="ghost" onClick={() => { loadLeaves(); loadMeta() }}><RefreshCw size={14} /> Refresh</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Leave Requests</h3></div>
        {loading ? <LoadingSkeleton rows={7} /> : error ? (
          <EmptyState title="Unable to load leaves" description={error} />
        ) : displayRows.length === 0 ? (
          <EmptyState title="No leave requests" description="Leave requests will appear here." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Total Days</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.employeeName || '-'}</td>
                    <td>{row.departmentName}</td>
                    <td>{row.leaveType || '-'}</td>
                    <td>{row.start}</td>
                    <td>{row.end}</td>
                    <td>{row.totalDays || 0}</td>
                    <td><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="text-btn" onClick={() => openDetails(row)}>View</button>
                        {row.status === 'pending' ? <button className="text-btn" onClick={() => onApprove(row)} disabled={submitting}>Approve</button> : null}
                        {row.status === 'pending' ? <button className="text-btn danger" onClick={() => openReject(row)} disabled={submitting}>Reject</button> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Leave Policy Settings</h3></div>
        <div className="filters-row admin-filters-grid">
          <FormInput label="Casual" type="number" value={policy.casual ?? ''} onChange={(e) => setPolicy((prev) => ({ ...prev, casual: e.target.value }))} />
          <FormInput label="Sick" type="number" value={policy.sick ?? ''} onChange={(e) => setPolicy((prev) => ({ ...prev, sick: e.target.value }))} />
          <FormInput label="Earned" type="number" value={policy.earned ?? ''} onChange={(e) => setPolicy((prev) => ({ ...prev, earned: e.target.value }))} />
        </div>
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button onClick={onSavePolicy} disabled={submitting}>{submitting ? 'Saving...' : 'Save Policy'}</Button>
        </div>
      </div>

      <Modal open={rejectOpen} title={`Reject Leave - ${selected?.employeeName || ''}`} onClose={() => { if (!submitting) setRejectOpen(false) }}>
        <div className="modal-form">
          <FormInput label="Rejection Reason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Enter reason for rejection" />
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setRejectOpen(false)} disabled={submitting}>Cancel</Button>
            <Button variant="danger" onClick={onReject} disabled={submitting}>{submitting ? 'Rejecting...' : 'Reject Leave'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={detailsOpen} title={`Leave Details - ${selected?.employeeName || ''}`} onClose={() => setDetailsOpen(false)}>
        {!selected ? <LoadingSkeleton rows={3} /> : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Employee:</strong> <span>{selected.employeeName || '-'}</span></div>
            <div className="inline-action-card"><strong>Type:</strong> <span>{selected.leaveType || '-'}</span></div>
            <div className="inline-action-card"><strong>Date Range:</strong> <span>{selected.startDate ? String(selected.startDate).slice(0, 10) : '-'} to {selected.endDate ? String(selected.endDate).slice(0, 10) : '-'}</span></div>
            <div className="inline-action-card"><strong>Total Days:</strong> <span>{selected.totalDays || 0}</span></div>
            <div className="inline-action-card"><strong>Reason:</strong> <span>{selected.reason || '-'}</span></div>
            <div className="inline-action-card"><strong>Status:</strong> <span>{selected.status || '-'}</span></div>
            {selected.rejectionReason ? <div className="inline-action-card"><strong>Rejection Reason:</strong> <span>{selected.rejectionReason}</span></div> : null}

            <div className="panel" style={{ padding: 12 }}>
              <div className="panel-head"><h3>Leave Balance</h3></div>
              {!balanceData ? <LoadingSkeleton rows={3} /> : (
                <div className="dashboard-mini-grid">
                  <div className="inline-action-card"><strong>Casual:</strong> <span>{balanceData.balance?.casual ?? 0}</span></div>
                  <div className="inline-action-card"><strong>Sick:</strong> <span>{balanceData.balance?.sick ?? 0}</span></div>
                  <div className="inline-action-card"><strong>Earned:</strong> <span>{balanceData.balance?.earned ?? 0}</span></div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

export default CompanyAdminLeavesPage

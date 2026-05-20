import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import FilterDropdown from '../../components/ui/FilterDropdown'
import StatCard from '../../components/ui/StatCard'
import {
  applyEmployeeLeave,
  cancelEmployeeLeave,
  getEmployeeLeaveBalance,
  getEmployeeLeaveById,
  getEmployeeLeavePolicy,
  getEmployeeLeaves,
  updateEmployeeLeave
} from '../../api/employeeLeaveApi'

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString().slice(0, 10)
}

const defaultForm = {
  leaveType: 'casual',
  startDate: '',
  endDate: '',
  reason: ''
}

function EmployeeLeavesPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const [leaves, setLeaves] = useState([])
  const [balance, setBalance] = useState(null)
  const [policy, setPolicy] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [editingId, setEditingId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(defaultForm)

  const showMessage = (setter, message) => {
    setter(message)
    setTimeout(() => setter(''), 2600)
  }

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [leavesRes, balanceRes, policyRes] = await Promise.all([
        getEmployeeLeaves({ status: statusFilter, leaveType: typeFilter }),
        getEmployeeLeaveBalance(),
        getEmployeeLeavePolicy()
      ])
      setLeaves(leavesRes?.data || [])
      setBalance(balanceRes?.data || null)
      setPolicy(policyRes?.data || null)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load leaves')
      setLeaves([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [statusFilter, typeFilter])

  const resetForm = () => {
    setForm(defaultForm)
    setEditingId('')
  }

  const openApply = () => {
    resetForm()
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(String(row.id))
    setForm({
      leaveType: row.leaveType || 'casual',
      startDate: formatDate(row.startDate),
      endDate: formatDate(row.endDate),
      reason: row.reason || ''
    })
    setFormOpen(true)
  }

  const onSubmit = async () => {
    if (!form.leaveType || !form.startDate || !form.endDate || !form.reason.trim()) {
      showMessage(setError, 'leaveType, startDate, endDate and reason are required')
      return
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      showMessage(setError, 'endDate cannot be before startDate')
      return
    }

    setSubmitting(true)
    try {
      if (editingId) {
        const response = await updateEmployeeLeave(editingId, form)
        showMessage(setSuccess, response?.message || 'Leave request updated successfully')
      } else {
        const response = await applyEmployeeLeave(form)
        showMessage(setSuccess, response?.message || 'Leave request submitted successfully')
      }
      setFormOpen(false)
      resetForm()
      await loadData()
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to submit leave request')
    } finally {
      setSubmitting(false)
    }
  }

  const onCancelPending = async (row) => {
    setSubmitting(true)
    try {
      const response = await cancelEmployeeLeave(row.id)
      showMessage(setSuccess, response?.message || 'Leave request cancelled successfully')
      await loadData()
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to cancel leave request')
    } finally {
      setSubmitting(false)
    }
  }

  const onViewDetails = async (row) => {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setSelected(null)
    try {
      const response = await getEmployeeLeaveById(row.id)
      setSelected(response?.data || null)
    } catch (err) {
      setSelected(null)
      showMessage(setError, err?.response?.data?.message || 'Failed to load leave details')
    } finally {
      setDetailsLoading(false)
    }
  }

  const stats = useMemo(() => {
    const p = balance?.balance || {}
    return [
      { title: 'Casual Balance', value: String(p.casual ?? 0), trend: `Policy ${policy?.casual ?? 0}` },
      { title: 'Sick Balance', value: String(p.sick ?? 0), trend: `Policy ${policy?.sick ?? 0}` },
      { title: 'Earned Balance', value: String(p.earned ?? 0), trend: `Policy ${policy?.earned ?? 0}` }
    ]
  }, [balance, policy])

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ]

  const typeOptions = [
    { value: 'all', label: 'All Leave Types' },
    { value: 'casual', label: 'Casual' },
    { value: 'sick', label: 'Sick' },
    { value: 'earned', label: 'Earned' }
  ]

  const rows = leaves.map((item) => ({
    id: item.id,
    leaveType: item.leaveType,
    startDate: formatDate(item.startDate),
    endDate: formatDate(item.endDate),
    totalDays: item.totalDays,
    reason: item.reason || '-',
    status: item.status || '-',
    createdAt: formatDate(item.createdAt),
    raw: item
  }))

  return (
    <section className="section-layout">
      <PageHeader
        title="Employee Leaves"
        description="Apply and track your leave requests with balance and policy visibility."
        breadcrumb={['Employee Portal', 'Leaves']}
        primaryActionLabel="Apply Leave"
        onPrimaryAction={openApply}
      />

      {success ? <div className="panel" style={{ borderColor: 'rgba(34,197,94,0.35)' }}>{success}</div> : null}
      {error ? <div className="panel error-banner">{error}</div> : null}

      {loading ? <LoadingSkeleton rows={3} /> : (
        <div className="stats-grid premium-stats-grid">
          {stats.map((item) => <StatCard key={item.title} {...item} />)}
        </div>
      )}

      <div className="panel">
        <div className="filters-row">
          <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
          <FilterDropdown label="Leave Type" value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
          <div className="actions-row" style={{ alignSelf: 'end' }}>
            <Button variant="ghost" onClick={loadData}>Refresh</Button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>My Leave Requests</h3></div>
        {loading ? <LoadingSkeleton rows={6} /> : rows.length === 0 ? <EmptyState title="No leave requests" description="Your leave requests will appear here." /> : (
          <DataTable
            columns={[
              { key: 'leaveType', label: 'Leave Type' },
              { key: 'startDate', label: 'Start Date' },
              { key: 'endDate', label: 'End Date' },
              { key: 'totalDays', label: 'Total Days' },
              { key: 'reason', label: 'Reason', sortable: false },
              { key: 'status', label: 'Status' },
              { key: 'createdAt', label: 'Applied Date' }
            ]}
            rows={rows}
            showViewAction
            showDeleteAction
            onView={(row) => onViewDetails(row.raw)}
            onDelete={(row) => {
              if (String(row.raw?.status || '').toLowerCase() !== 'pending') {
                showMessage(setError, 'Only pending leave request can be cancelled')
                return
              }
              onCancelPending(row.raw)
            }}
          />
        )}
      </div>

      <Modal open={formOpen} title={editingId ? 'Edit Pending Leave Request' : 'Apply Leave'} onClose={() => setFormOpen(false)}>
        <div className="modal-form">
          <FilterDropdown label="Leave Type" value={form.leaveType} onChange={(value) => setForm((prev) => ({ ...prev, leaveType: value }))} options={typeOptions.filter((x) => x.value !== 'all')} />
          <label className="form-input-wrap">
            <span>Start Date</span>
            <input className="form-input" type="date" value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} />
          </label>
          <label className="form-input-wrap">
            <span>End Date</span>
            <input className="form-input" type="date" value={form.endDate} onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))} />
          </label>
          <label className="form-input-wrap">
            <span>Reason</span>
            <textarea className="form-input" rows={4} value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))} />
          </label>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={onSubmit} disabled={submitting}>{submitting ? 'Submitting...' : (editingId ? 'Update Leave' : 'Submit Leave')}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={detailsOpen} title="Leave Details" onClose={() => setDetailsOpen(false)}>
        {detailsLoading ? <LoadingSkeleton rows={4} /> : !selected ? <EmptyState title="No details found" description="Unable to fetch leave details." /> : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Leave Type:</strong> <span>{selected.leaveType || '-'}</span></div>
            <div className="inline-action-card"><strong>Start Date:</strong> <span>{formatDate(selected.startDate)}</span></div>
            <div className="inline-action-card"><strong>End Date:</strong> <span>{formatDate(selected.endDate)}</span></div>
            <div className="inline-action-card"><strong>Total Days:</strong> <span>{selected.totalDays || 0}</span></div>
            <div className="inline-action-card"><strong>Status:</strong> <span>{selected.status || '-'}</span></div>
            <div className="inline-action-card"><strong>Reason:</strong> <span>{selected.reason || '-'}</span></div>
            <div className="inline-action-card"><strong>Applied Date:</strong> <span>{formatDate(selected.createdAt)}</span></div>
            {selected.rejectionReason ? <div className="inline-action-card"><strong>Rejection Reason:</strong> <span>{selected.rejectionReason}</span></div> : null}
          </div>
        )}
      </Modal>
    </section>
  )
}

export default EmployeeLeavesPage

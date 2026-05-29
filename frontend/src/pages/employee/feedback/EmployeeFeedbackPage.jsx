import { useEffect, useMemo, useState } from 'react'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import FilterDropdown from '../../../components/ui/FilterDropdown'
import Modal from '../../../components/ui/Modal'
import PageHeader from '../../../components/ui/PageHeader'
import { useAuth } from '../../../hooks/useAuth'
import FeedbackDetailsModal from './FeedbackDetailsModal'
import FeedbackFormModal from './FeedbackFormModal'
import FeedbackStatsCards from './FeedbackStatsCards'
import FeedbackTable from './FeedbackTable'

const STORAGE_KEY = 'employee_feedback_v1'

const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'Work Culture', label: 'Work Culture' },
  { value: 'Management', label: 'Management' },
  { value: 'Training', label: 'Training' },
  { value: 'Facilities', label: 'Facilities' },
  { value: 'Other', label: 'Other' }
]

const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'Suggestion', label: 'Suggestion' },
  { value: 'Appreciation', label: 'Appreciation' },
  { value: 'Improvement', label: 'Improvement' }
]

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Reviewed', label: 'Reviewed' },
  { value: 'Implemented', label: 'Implemented' }
]

const today = () => new Date().toISOString().slice(0, 10)

const resolveEmployeeContext = (user) => ({
  employeeId: String(user?.employeeId || user?.id || user?.userId || user?._id || 'EMP-001'),
  employeeName: String(user?.name || user?.fullName || 'Employee'),
  department: String(user?.department || user?.departmentName || user?.profile?.department || 'General')
})

const createFeedbackNo = (allRows) => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const sameDay = allRows.filter((item) => String(item.feedbackNo || '').includes(`FDB-${datePart}-`))
  return `FDB-${datePart}-${String(sameDay.length + 1).padStart(3, '0')}`
}

const createForm = (ctx, feedbackNo = '') => ({
  id: '',
  feedbackNo,
  employeeId: ctx.employeeId,
  employeeName: ctx.employeeName,
  department: ctx.department,
  dateSubmitted: today(),
  feedbackCategory: 'Work Culture',
  feedbackType: 'Suggestion',
  feedbackDetails: '',
  actionTaken: '',
  status: 'Pending'
})

function EmployeeFeedbackPage() {
  const auth = useAuth()
  const user = auth?.user || null
  const employeeCtx = useMemo(() => resolveEmployeeContext(user), [user])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(createForm(employeeCtx, ''))
  const [toast, setToast] = useState({ type: '', message: '' })

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast({ type: '', message: '' }), 2200)
  }

  const readAll = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch (_err) {
      return []
    }
  }

  const writeAll = (nextRows) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRows))
    } catch (_err) {
      // ignore storage errors and keep UI responsive
    }
  }

  const loadRows = () => {
    setLoading(true)
    setError('')
    try {
      const all = readAll()
      const mine = all.filter((item) => String(item.employeeId) === employeeCtx.employeeId)
      setRows(mine)
    } catch (err) {
      setRows([])
      setError(err?.message || 'Failed to load feedback records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    try {
      loadRows()
    } catch (err) {
      setLoading(false)
      setRows([])
      setError(err?.message || 'Unable to render feedback module')
    }
  }, [employeeCtx.employeeId])

  const openNew = () => {
    const feedbackNo = createFeedbackNo(readAll())
    setEditingId('')
    setForm(createForm(employeeCtx, feedbackNo))
    setFormOpen(true)
  }

  const openEdit = (row) => {
    if (row.status !== 'Pending') {
      showToast('error', 'Only pending feedback can be edited')
      return
    }
    setEditingId(row.id)
    setForm({ ...row })
    setFormOpen(true)
  }

  const validate = () => {
    if (!form.feedbackCategory || !form.feedbackType || !form.feedbackDetails.trim()) {
      setError('Category, Type and Feedback Details are required')
      return false
    }
    return true
  }

  const onSubmit = () => {
    if (!validate()) return
    setSubmitting(true)
    setError('')
    try {
      const all = readAll()
      if (editingId) {
        const next = all.map((item) => (item.id === editingId
          ? { ...item, feedbackCategory: form.feedbackCategory, feedbackType: form.feedbackType, feedbackDetails: form.feedbackDetails.trim() }
          : item))
        writeAll(next)
        showToast('success', 'Feedback updated')
      } else {
        const payload = { ...form, id: `fb-${Date.now()}`, feedbackDetails: form.feedbackDetails.trim() }
        writeAll([payload, ...all])
        showToast('success', 'Feedback submitted')
      }
      setFormOpen(false)
      loadRows()
    } catch (err) {
      setError(err?.message || 'Failed to save feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const onWithdraw = (row) => {
    if (row.status !== 'Pending') {
      showToast('error', 'Only pending feedback can be withdrawn')
      return
    }
    try {
      const all = readAll()
      const next = all.filter((item) => item.id !== row.id)
      writeAll(next)
      showToast('success', 'Feedback withdrawn')
      loadRows()
    } catch (err) {
      setError(err?.message || 'Failed to withdraw feedback')
    }
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((item) => {
      if (categoryFilter !== 'all' && item.feedbackCategory !== categoryFilter) return false
      if (typeFilter !== 'all' && item.feedbackType !== typeFilter) return false
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (!q) return true
      const bag = [item.feedbackNo, item.feedbackCategory, item.feedbackType, item.status, item.feedbackDetails].join(' ').toLowerCase()
      return bag.includes(q)
    })
  }, [rows, search, categoryFilter, typeFilter, statusFilter])

  return (
    <section className="section-layout">
      <PageHeader
        title="Feedback Module"
        description="Submit and track your feedback across categories."
        breadcrumb={['Employee Portal', 'Feedback']}
        primaryActionLabel="Submit Feedback"
        onPrimaryAction={openNew}
      />

      {toast.message ? <div className={`grievance-toast grievance-toast-${toast.type || 'success'}`}>{toast.message}</div> : null}
      {error ? <div className="panel error-banner">{error}</div> : null}

      <FeedbackStatsCards rows={rows} loading={loading} />

      <div className="panel">
        <div className="filters-row grievance-filters-grid">
          <label className="form-input-wrap grievance-search-wrap">
            <span>Search</span>
            <input className="form-input" placeholder="Search by no, category, type, status, details" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <FilterDropdown label="Category" value={categoryFilter} onChange={setCategoryFilter} options={categoryOptions} />
          <FilterDropdown label="Type" value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
          <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
          <div className="actions-row" style={{ alignSelf: 'end' }}>
            <Button variant="ghost" onClick={loadRows}>Refresh</Button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>My Feedback</h3></div>
        {!loading && filteredRows.length === 0 ? <EmptyState title="No feedback found" description="Use Submit Feedback to create your first entry." /> : (
          <FeedbackTable
            loading={loading}
            rows={filteredRows}
            onView={(row) => { setSelected(row); setDetailsOpen(true) }}
            onEdit={openEdit}
            onWithdraw={onWithdraw}
            onDelete={(row) => { setSelected(row); setDeleteOpen(true) }}
          />
        )}
      </div>

      <FeedbackFormModal open={formOpen} onClose={() => setFormOpen(false)} form={form} setForm={setForm} submitting={submitting} editing={Boolean(editingId)} onSubmit={onSubmit} />
      <FeedbackDetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} feedback={selected} loading={false} />

      <Modal open={deleteOpen} title="Delete Feedback" onClose={() => setDeleteOpen(false)}>
        <div className="modal-form">
          <p>Delete feedback <strong>{selected?.feedbackNo || '-'}</strong>?</p>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => {
              if (!selected?.id) return
              try {
                const all = readAll()
                const next = all.filter((item) => item.id !== selected.id)
                writeAll(next)
                setDeleteOpen(false)
                showToast('success', 'Feedback deleted')
                loadRows()
              } catch (err) {
                setError(err?.message || 'Failed to delete feedback')
              }
            }}>Delete</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default EmployeeFeedbackPage

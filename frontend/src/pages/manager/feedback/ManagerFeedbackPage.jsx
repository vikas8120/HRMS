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

const STORAGE_KEY = 'manager_feedback_v1'

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Reviewed', label: 'Reviewed' },
  { value: 'Implemented', label: 'Implemented' }
]

const today = () => new Date().toISOString().slice(0, 10)

const resolveManagerContext = (user) => ({
  managerId: String(user?.employeeId || user?.id || user?.userId || user?._id || 'MGR-001'),
  managerName: String(user?.name || user?.fullName || 'Manager'),
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
  managerId: ctx.managerId,
  employeeName: ctx.managerName,
  department: ctx.department,
  dateSubmitted: today(),
  feedbackCategory: 'Work Culture',
  feedbackType: 'Suggestion',
  feedbackDetails: '',
  actionTaken: '',
  status: 'Pending'
})

function ManagerFeedbackPage({ portalLabel = 'Manager Portal', title = 'Feedback Module', description = 'Submit and track your feedback across categories.', primaryActionLabel = 'Submit Feedback', listTitle = 'My Feedback', enableDateFilters = false, scope = 'manager' }) {
  const auth = useAuth()
  const user = auth?.user || null
  const managerCtx = useMemo(() => resolveManagerContext(user), [user])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilterMode, setDateFilterMode] = useState('all')
  const [exactDate, setExactDate] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(createForm(managerCtx, ''))
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
      // ignore storage errors to keep UI functional
    }
  }

  const loadRows = () => {
    setLoading(true)
    setError('')
    try {
      const all = readAll()
      const mine = all
        .filter((item) => (scope === 'admin' ? true : String(item?.managerId) === managerCtx.managerId))
        .map((item) => ({
          ...item,
          employeeName: item?.employeeName || item?.managerName || managerCtx.managerName
        }))
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
  }, [managerCtx.managerId])

  const openNew = () => {
    const feedbackNo = createFeedbackNo(readAll())
    setEditingId('')
    setForm(createForm(managerCtx, feedbackNo))
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
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (enableDateFilters) {
        const rowDate = String(item.dateSubmitted || '').slice(0, 10)
        if (dateFilterMode === 'date' && exactDate && rowDate !== exactDate) return false
        if (dateFilterMode === 'month-year') {
          const [yr, mo] = rowDate.split('-')
          if (monthFilter && mo !== monthFilter) return false
          if (yearFilter && yr !== yearFilter) return false
        }
        if (dateFilterMode === 'range') {
          if (fromDate && rowDate < fromDate) return false
          if (toDate && rowDate > toDate) return false
        }
      }
      if (!q) return true
      const bag = [item.feedbackNo, item.feedbackCategory, item.feedbackType, item.status, item.feedbackDetails].join(' ').toLowerCase()
      return bag.includes(q)
    })
  }, [rows, search, statusFilter, enableDateFilters, dateFilterMode, exactDate, monthFilter, yearFilter, fromDate, toDate])

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(rows.map((item) => String(item.dateSubmitted || '').slice(0, 4)).filter(Boolean))).sort((a, b) => b.localeCompare(a))
    return [{ value: '', label: 'All Years' }, ...years.map((y) => ({ value: y, label: y }))]
  }, [rows])

  return (
    <section className="section-layout">
      <PageHeader
        title={title}
        description={description}
        breadcrumb={[portalLabel, 'Feedback']}
        primaryActionLabel={primaryActionLabel}
        onPrimaryAction={openNew}
      />

      {toast.message ? <div className={`grievance-toast grievance-toast-${toast.type || 'success'}`}>{toast.message}</div> : null}
      {error ? <div className="panel error-banner">{error}</div> : null}

      <FeedbackStatsCards rows={rows} loading={loading} />

      <div className="panel">
        <div className={`filters-row grievance-filters-grid ${enableDateFilters && dateFilterMode === 'range' ? 'range-inline-layout' : ''}`}>
          <label className="form-input-wrap grievance-search-wrap">
            <span>Search</span>
            <input className="form-input" placeholder="Search by no, category, type, status, details" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
          {enableDateFilters ? (
            <div className="date-mode-filter">
              <FilterDropdown
                label="Date Mode"
                value={dateFilterMode}
                onChange={(value) => {
                  setDateFilterMode(value)
                  setExactDate('')
                  setMonthFilter('')
                  setYearFilter('')
                  setFromDate('')
                  setToDate('')
                }}
                options={[
                  { value: 'all', label: 'All Dates' },
                  { value: 'date', label: 'Exact Date' },
                  { value: 'month-year', label: 'Month + Year' },
                  { value: 'range', label: 'Date Range' }
                ]}
              />
            </div>
          ) : null}
          {enableDateFilters && dateFilterMode === 'date' ? (
            <label className="form-input-wrap">
              <span>Date</span>
              <input className="form-input" type="date" value={exactDate} onChange={(event) => setExactDate(event.target.value)} />
            </label>
          ) : null}
          {enableDateFilters && dateFilterMode === 'month-year' ? (
            <>
              <FilterDropdown
                label="Month"
                value={monthFilter}
                onChange={setMonthFilter}
                options={[
                  { value: '', label: 'All Months' },
                  { value: '01', label: 'January' }, { value: '02', label: 'February' }, { value: '03', label: 'March' },
                  { value: '04', label: 'April' }, { value: '05', label: 'May' }, { value: '06', label: 'June' },
                  { value: '07', label: 'July' }, { value: '08', label: 'August' }, { value: '09', label: 'September' },
                  { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }
                ]}
              />
              <FilterDropdown label="Year" value={yearFilter} onChange={setYearFilter} options={yearOptions} />
            </>
          ) : null}
          {enableDateFilters && dateFilterMode === 'range' ? (
            <>
              <label className="form-input-wrap range-from-field">
                <span>From</span>
                <input className="form-input" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
              </label>
              <label className="form-input-wrap range-to-field">
                <span>To</span>
                <input className="form-input" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
              </label>
            </>
          ) : null}
          <div className="actions-row range-refresh-action" style={{ alignSelf: 'end' }}>
            <Button variant="ghost" onClick={loadRows}>Refresh</Button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>{listTitle}</h3></div>
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

export default ManagerFeedbackPage

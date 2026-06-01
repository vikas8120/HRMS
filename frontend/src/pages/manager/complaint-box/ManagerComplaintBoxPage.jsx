import { useEffect, useMemo, useState } from 'react'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import FilterDropdown from '../../../components/ui/FilterDropdown'
import Modal from '../../../components/ui/Modal'
import PageHeader from '../../../components/ui/PageHeader'
import { useAuth } from '../../../hooks/useAuth'
import ComplaintDetailsModal from './ComplaintDetailsModal'
import ComplaintFormModal from './ComplaintFormModal'
import ComplaintStatsCards from './ComplaintStatsCards'
import ComplaintTable from './ComplaintTable'

const STORAGE_KEY = 'manager_complaint_box_v1'

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'Open', label: 'Open' },
  { value: 'Under Review', label: 'Under Review' },
  { value: 'Closed', label: 'Closed' }
]

const today = () => new Date().toISOString().slice(0, 10)

const resolveManagerContext = (user) => ({
  managerId: String(user?.employeeId || user?.id || user?.userId || user?._id || 'MGR-001'),
  managerName: String(user?.name || user?.fullName || 'Manager'),
  department: String(user?.department || user?.departmentName || user?.profile?.department || 'General')
})

const createComplaintNo = (allRows) => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const sameDay = allRows.filter((item) => String(item.complaintNo || '').includes(`CMP-${datePart}-`))
  return `CMP-${datePart}-${String(sameDay.length + 1).padStart(3, '0')}`
}

const createForm = (ctx, complaintNo = '') => ({
  id: '',
  complaintNo,
  complaintDate: today(),
  managerId: ctx.managerId,
  managerName: ctx.managerName,
  againstEmployee: '',
  department: ctx.department,
  complaintCategory: 'Harassment',
  complaintDetails: '',
  witnessOptional: '',
  evidenceFileName: '',
  severityLevel: 'Medium',
  actionTaken: '',
  status: 'Open',
  closureDate: '',
  confidential: 'No'
})

function ManagerComplaintBoxPage({ portalLabel = 'Manager Portal', title = 'Complaint Box Module', description = 'Raise and track confidential workplace complaints.', primaryActionLabel = 'Raise Complaint', listTitle = 'My Complaints', enableDateFilters = false, scope = 'manager' }) {
  const { user } = useAuth()
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
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  }

  const writeAll = (nextRows) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRows))
  }

  const loadRows = () => {
    setLoading(true)
    setError('')
    try {
      const all = readAll()
      const mine = all.filter((item) => (scope === 'admin' ? true : String(item.managerId) === managerCtx.managerId))
      setRows(mine)
    } catch (err) {
      setRows([])
      setError(err?.message || 'Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRows()
  }, [managerCtx.managerId])

  const openNew = () => {
    const complaintNo = createComplaintNo(readAll())
    setEditingId('')
    setForm(createForm(managerCtx, complaintNo))
    setFormOpen(true)
  }

  const openEdit = (row) => {
    if (row.status !== 'Open') {
      showToast('error', 'Only open complaints can be edited')
      return
    }
    setEditingId(row.id)
    setForm({ ...row })
    setFormOpen(true)
  }

  const validate = () => {
    if (!form.againstEmployee.trim() || !form.complaintCategory || !form.complaintDetails.trim() || !form.severityLevel) {
      setError('Against Employee, Category, Complaint Details, and Severity are required')
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
          ? {
              ...item,
              againstEmployee: form.againstEmployee.trim(),
              complaintCategory: form.complaintCategory,
              complaintDetails: form.complaintDetails.trim(),
              witnessOptional: form.witnessOptional.trim(),
              evidenceFileName: form.evidenceFileName,
              severityLevel: form.severityLevel,
              confidential: form.confidential
            }
          : item))
        writeAll(next)
        showToast('success', 'Complaint updated')
      } else {
        const payload = {
          ...form,
          id: `cp-${Date.now()}`,
          againstEmployee: form.againstEmployee.trim(),
          complaintDetails: form.complaintDetails.trim(),
          witnessOptional: form.witnessOptional.trim()
        }
        writeAll([payload, ...all])
        showToast('success', 'Complaint submitted')
      }
      setFormOpen(false)
      loadRows()
    } catch (err) {
      setError(err?.message || 'Failed to save complaint')
    } finally {
      setSubmitting(false)
    }
  }

  const onWithdraw = (row) => {
    if (row.status !== 'Open') {
      showToast('error', 'Only open complaints can be withdrawn')
      return
    }
    try {
      const all = readAll()
      const next = all.filter((item) => item.id !== row.id)
      writeAll(next)
      showToast('success', 'Complaint withdrawn')
      loadRows()
    } catch (err) {
      setError(err?.message || 'Failed to withdraw complaint')
    }
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (enableDateFilters) {
        const rowDate = String(item.complaintDate || '').slice(0, 10)
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
      const bag = [
        item.complaintNo,
        item.complaintCategory,
        item.status,
        item.severityLevel,
        item.managerName || item.employeeName,
        item.againstEmployee,
        item.complaintDetails
      ].join(' ').toLowerCase()
      return bag.includes(q)
    })
  }, [rows, search, statusFilter, enableDateFilters, dateFilterMode, exactDate, monthFilter, yearFilter, fromDate, toDate])

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(rows.map((item) => String(item.complaintDate || '').slice(0, 4)).filter(Boolean))).sort((a, b) => b.localeCompare(a))
    return [{ value: '', label: 'All Years' }, ...years.map((y) => ({ value: y, label: y }))]
  }, [rows])

  return (
    <section className="section-layout">
      <PageHeader
        title={title}
        description={description}
        breadcrumb={[portalLabel, 'Complaint Box']}
        primaryActionLabel={primaryActionLabel}
        onPrimaryAction={openNew}
      />

      {toast.message ? <div className={`grievance-toast grievance-toast-${toast.type || 'success'}`}>{toast.message}</div> : null}
      {error ? <div className="panel error-banner">{error}</div> : null}

      <ComplaintStatsCards rows={rows} loading={loading} />

      <div className="panel">
        <div className={`filters-row complaint-filters-grid ${enableDateFilters && dateFilterMode === 'range' ? 'range-inline-layout' : ''}`}>
          <label className="form-input-wrap complaint-search-wrap">
            <span>Search</span>
            <input className="form-input" placeholder="Search by no, category, status, severity, names, details" value={search} onChange={(event) => setSearch(event.target.value)} />
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
        {!loading && filteredRows.length === 0 ? <EmptyState title="No complaints found" description="Use Raise Complaint to create your first complaint." /> : (
          <ComplaintTable
            loading={loading}
            rows={filteredRows}
            onView={(row) => { setSelected(row); setDetailsOpen(true) }}
            onEdit={openEdit}
            onWithdraw={onWithdraw}
            onDelete={(row) => { setSelected(row); setDeleteOpen(true) }}
          />
        )}
      </div>

      <ComplaintFormModal open={formOpen} onClose={() => setFormOpen(false)} form={form} setForm={setForm} submitting={submitting} editing={Boolean(editingId)} onSubmit={onSubmit} />
      <ComplaintDetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} complaint={selected} loading={false} />

      <Modal open={deleteOpen} title="Delete Complaint" onClose={() => setDeleteOpen(false)}>
        <div className="modal-form">
          <p>Delete complaint <strong>{selected?.complaintNo || '-'}</strong>?</p>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => {
              if (!selected?.id) return
              try {
                const all = readAll()
                const next = all.filter((item) => item.id !== selected.id)
                writeAll(next)
                setDeleteOpen(false)
                showToast('success', 'Complaint deleted')
                loadRows()
              } catch (err) {
                setError(err?.message || 'Failed to delete complaint')
              }
            }}>Delete</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default ManagerComplaintBoxPage

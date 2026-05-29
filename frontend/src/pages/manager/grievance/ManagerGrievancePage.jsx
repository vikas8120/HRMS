import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import FilterDropdown from '../../../components/ui/FilterDropdown'
import EmptyState from '../../../components/ui/EmptyState'
import Modal from '../../../components/ui/Modal'
import { useAuth } from '../../../hooks/useAuth'
import GrievanceStatsCards from './GrievanceStatsCards'
import GrievanceFormModal from './GrievanceFormModal'
import GrievanceTable from './GrievanceTable'
import GrievanceDetailsModal from './GrievanceDetailsModal'

const STORAGE_KEY = 'manager_grievances_v1'

const grievanceTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'Salary', label: 'Salary' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Leave', label: 'Leave' },
  { value: 'Behavior', label: 'Behavior' },
  { value: 'Workload', label: 'Workload' },
  { value: 'Other', label: 'Other' }
]

const priorityOptions = [
  { value: 'all', label: 'All Priorities' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' }
]

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'Open', label: 'Open' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Closed', label: 'Closed' }
]

const getToday = () => new Date().toISOString().slice(0, 10)

const resolveManagerContext = (user) => ({
  managerId: String(
    user?.employeeId ||
    user?.id ||
    user?._id ||
    user?.userId ||
    user?.employee?.employeeId ||
    'MGR-001'
  ),
  managerName: String(
    user?.name ||
    user?.fullName ||
    user?.employee?.name ||
    'Manager'
  ),
  department: String(
    user?.department ||
    user?.departmentName ||
    user?.employee?.department ||
    user?.profile?.department ||
    'General'
  )
})

const createGrievanceNo = (existingRows) => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const sameDay = existingRows.filter((item) => String(item?.grievanceNo || '').includes(`GRV-${datePart}-`))
  const sequence = String(sameDay.length + 1).padStart(3, '0')
  return `GRV-${datePart}-${sequence}`
}

const createForm = (ctx, grievanceNo = '') => ({
  id: '',
  grievanceNo,
  managerId: ctx.managerId,
  managerName: ctx.managerName,
  department: ctx.department,
  dateRaised: getToday(),
  grievanceType: 'Salary',
  description: '',
  priority: 'Medium',
  status: 'Open',
  resolutionRemarks: '',
  resolutionDate: ''
})

function ManagerGrievancePage({ portalLabel = 'Manager Portal', title = 'Grievance Module', description = 'Raise and track your grievances with status updates.', primaryActionLabel = 'Raise New Grievance', listTitle = 'My Grievances' }) {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(createForm(resolveManagerContext(user), ''))

  const [toast, setToast] = useState({ type: '', message: '' })

  const managerCtx = useMemo(() => resolveManagerContext(user), [user])

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast({ type: '', message: '' }), 2400)
  }

  const readAllFromStorage = () => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  }

  const writeAllToStorage = (nextRows) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRows))
  }

  const loadRows = () => {
    setLoading(true)
    setError('')
    try {
      const all = readAllFromStorage()
      const mine = all.filter((item) => String(item?.managerId || '') === managerCtx.managerId)
      setRows(mine.sort((a, b) => (a.dateRaised < b.dateRaised ? 1 : -1)))
    } catch (err) {
      setRows([])
      setError(err?.message || 'Failed to load grievances')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRows()
  }, [managerCtx.managerId])

  const openNew = () => {
    const grievanceNo = createGrievanceNo(readAllFromStorage())
    setEditingId('')
    setForm(createForm(managerCtx, grievanceNo))
    setFormOpen(true)
  }

  const openEdit = (row) => {
    if (row.status !== 'Open') {
      showToast('error', 'Only open grievances can be edited')
      return
    }
    setEditingId(row.id)
    setForm({ ...row })
    setFormOpen(true)
  }

  const validateForm = () => {
    if (!form.grievanceType || !form.description.trim() || !form.priority) {
      setError('Grievance Type, Priority, and Description are required')
      return false
    }
    return true
  }

  const onSubmit = () => {
    if (!validateForm()) return
    setSubmitting(true)
    setError('')
    try {
      const all = readAllFromStorage()
      if (editingId) {
        const target = all.find((item) => item.id === editingId)
        if (!target || target.status !== 'Open') throw new Error('Only open grievances can be edited')
        const next = all.map((item) => (item.id === editingId
          ? { ...item, grievanceType: form.grievanceType, description: form.description.trim(), priority: form.priority }
          : item))
        writeAllToStorage(next)
        showToast('success', 'Grievance updated successfully')
      } else {
        const payload = {
          ...form,
          id: `gr-${Date.now()}`,
          description: form.description.trim()
        }
        writeAllToStorage([payload, ...all])
        showToast('success', 'Grievance created successfully')
      }
      setFormOpen(false)
      setEditingId('')
      loadRows()
    } catch (err) {
      setError(err?.message || 'Failed to save grievance')
    } finally {
      setSubmitting(false)
    }
  }

  const onWithdraw = (row) => {
    if (row.status !== 'Open') {
      showToast('error', 'Only open grievances can be withdrawn')
      return
    }
    try {
      const all = readAllFromStorage()
      const next = all.map((item) => (item.id === row.id ? {
        ...item,
        status: 'Closed',
        resolutionRemarks: 'Withdrawn by employee',
        resolutionDate: getToday()
      } : item))
      writeAllToStorage(next)
      showToast('success', 'Grievance withdrawn successfully')
      loadRows()
    } catch (err) {
      setError(err?.message || 'Failed to withdraw grievance')
    }
  }

  const onDeleteAsk = (row) => {
    setSelected(row)
    setDeleteOpen(true)
  }

  const onDeleteConfirm = () => {
    if (!selected?.id) return
    try {
      const all = readAllFromStorage()
      const next = all.filter((item) => item.id !== selected.id)
      writeAllToStorage(next)
      setDeleteOpen(false)
      setSelected(null)
      showToast('success', 'Grievance deleted successfully')
      loadRows()
    } catch (err) {
      setError(err?.message || 'Failed to delete grievance')
    }
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false
      if (typeFilter !== 'all' && item.grievanceType !== typeFilter) return false
      if (!q) return true
      const bag = [
        item.grievanceNo,
        item.grievanceType,
        item.status,
        item.priority,
        item.description
      ].join(' ').toLowerCase()
      return bag.includes(q)
    })
  }, [rows, search, statusFilter, priorityFilter, typeFilter])

  return (
    <section className="section-layout">
      <PageHeader
        title={title}
        description={description}
        breadcrumb={[portalLabel, 'Grievance']}
        primaryActionLabel={primaryActionLabel}
        onPrimaryAction={openNew}
      />

      {toast.message ? <div className={`grievance-toast grievance-toast-${toast.type || 'success'}`}>{toast.message}</div> : null}
      {error ? <div className="panel error-banner">{error}</div> : null}

      <GrievanceStatsCards rows={rows} loading={loading} />

      <div className="panel">
        <div className="filters-row grievance-filters-grid">
          <label className="form-input-wrap grievance-search-wrap">
            <span>Search</span>
            <input
              className="form-input"
              placeholder="Search by grievance no, type, status, priority, description"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
          <FilterDropdown label="Priority" value={priorityFilter} onChange={setPriorityFilter} options={priorityOptions} />
          <FilterDropdown label="Grievance Type" value={typeFilter} onChange={setTypeFilter} options={grievanceTypeOptions} />
          <div className="actions-row" style={{ alignSelf: 'end' }}>
            <Button variant="ghost" onClick={loadRows}>Refresh</Button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>{listTitle}</h3></div>
        {!loading && rows.length === 0 ? <EmptyState title="No grievances yet" description="Click Raise New Grievance to create your first entry." /> : (
          <GrievanceTable
            loading={loading}
            rows={filteredRows}
            onView={(row) => {
              setSelected(row)
              setDetailsOpen(true)
            }}
            onEdit={openEdit}
            onWithdraw={onWithdraw}
            onDelete={onDeleteAsk}
          />
        )}
      </div>

      <GrievanceFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={onSubmit}
        submitting={submitting}
        form={form}
        setForm={setForm}
        editing={Boolean(editingId)}
      />

      <GrievanceDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        grievance={selected}
        loading={false}
      />

      <Modal open={deleteOpen} title="Delete Grievance" onClose={() => setDeleteOpen(false)}>
        <div className="modal-form">
          <p>Are you sure you want to delete grievance <strong>{selected?.grievanceNo || '-'}</strong>?</p>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={onDeleteConfirm}>Delete</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default ManagerGrievancePage

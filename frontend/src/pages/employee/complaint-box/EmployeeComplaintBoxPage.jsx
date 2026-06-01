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

const STORAGE_KEY = 'employee_complaint_box_v1'

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'Open', label: 'Open' },
  { value: 'Under Review', label: 'Under Review' },
  { value: 'Closed', label: 'Closed' }
]

const today = () => new Date().toISOString().slice(0, 10)

const resolveEmployeeContext = (user) => ({
  employeeId: String(user?.employeeId || user?.id || user?.userId || user?._id || 'EMP-001'),
  employeeName: String(user?.name || user?.fullName || 'Employee'),
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
  employeeId: ctx.employeeId,
  employeeName: ctx.employeeName,
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

function EmployeeComplaintBoxPage() {
  const { user } = useAuth()
  const employeeCtx = useMemo(() => resolveEmployeeContext(user), [user])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])

  const [search, setSearch] = useState('')
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
      const mine = all.filter((item) => String(item.employeeId) === employeeCtx.employeeId)
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
  }, [employeeCtx.employeeId])

  const openNew = () => {
    const complaintNo = createComplaintNo(readAll())
    setEditingId('')
    setForm(createForm(employeeCtx, complaintNo))
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
      if (!q) return true
      const bag = [
        item.complaintNo,
        item.complaintCategory,
        item.status,
        item.severityLevel,
        item.employeeName,
        item.againstEmployee,
        item.complaintDetails
      ].join(' ').toLowerCase()
      return bag.includes(q)
    })
  }, [rows, search, statusFilter])

  return (
    <section className="section-layout">
      <PageHeader
        title="Complaint Box Module"
        description="Raise and track confidential workplace complaints."
        breadcrumb={['Employee Portal', 'Complaint Box']}
        primaryActionLabel="Raise Complaint"
        onPrimaryAction={openNew}
      />

      {toast.message ? <div className={`grievance-toast grievance-toast-${toast.type || 'success'}`}>{toast.message}</div> : null}
      {error ? <div className="panel error-banner">{error}</div> : null}

      <ComplaintStatsCards rows={rows} loading={loading} />

      <div className="panel">
        <div className="filters-row complaint-filters-grid">
          <label className="form-input-wrap complaint-search-wrap">
            <span>Search</span>
            <input className="form-input" placeholder="Search by no, category, status, severity, names, details" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
          <div className="actions-row" style={{ alignSelf: 'end' }}>
            <Button variant="ghost" onClick={loadRows}>Refresh</Button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>My Complaints</h3></div>
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

export default EmployeeComplaintBoxPage

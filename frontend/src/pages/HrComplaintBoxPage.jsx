import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import FilterDropdown from '../components/ui/FilterDropdown'
import Modal from '../components/ui/Modal'
import SearchBar from '../components/ui/SearchBar'
import ComplaintFormModal from './manager/complaint-box/ComplaintFormModal'
import ComplaintDetailsModal from './manager/complaint-box/ComplaintDetailsModal'

const STORAGE_KEY = 'hr_complaint_workspace_v1'

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'Open', label: 'Open' },
  { value: 'Under Review', label: 'Under Review' },
  { value: 'Closed', label: 'Closed' }
]

const categoryOptions = [
  { value: 'Harassment', label: 'Harassment' },
  { value: 'Misconduct', label: 'Misconduct' },
  { value: 'Attendance', label: 'Attendance' },
  { value: 'Policy Violation', label: 'Policy Violation' },
  { value: 'Other', label: 'Other' }
]

const severityOptions = [
  { value: 'all', label: 'All Severity' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' }
]

const employees = [
  { id: 'EMP001', name: 'Arjun Mehta', department: 'Engineering' },
  { id: 'EMP002', name: 'Kritika Jain', department: 'Product' },
  { id: 'EMP003', name: 'Naman Verma', department: 'Sales' }
]

const seedRows = [
  {
    id: 'hrcp-001',
    complaintNo: 'CMP-20260601-001',
    complaintDate: '2026-06-01',
    employeeId: 'EMP001',
    employeeName: 'Arjun Mehta',
    againstEmployee: 'Team Lead',
    department: 'Engineering',
    complaintCategory: 'Attendance',
    complaintDetails: 'Overtime approval mismatch for two days.',
    witnessOptional: '',
    evidenceFileName: '',
    severityLevel: 'Medium',
    actionTaken: '',
    status: 'Open',
    closureDate: '',
    confidential: 'No'
  }
]

const today = () => new Date().toISOString().slice(0, 10)

const createComplaintNo = (allRows) => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const sameDay = allRows.filter((item) => String(item.complaintNo || '').includes(`CMP-${datePart}-`))
  return `CMP-${datePart}-${String(sameDay.length + 1).padStart(3, '0')}`
}

function HrComplaintBoxPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [editingId, setEditingId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ type: '', message: '' })

  const createForm = (complaintNo = '') => ({
    id: '',
    complaintNo,
    complaintDate: today(),
    employeeId: 'EMP001',
    employeeName: 'Arjun Mehta',
    againstEmployee: '',
    department: 'Engineering',
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

  const [form, setForm] = useState(createForm(''))

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast({ type: '', message: '' }), 2200)
  }

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        setRows(Array.isArray(parsed) ? parsed : seedRows)
      } catch (_err) {
        setRows(seedRows)
      }
    } else {
      setRows(seedRows)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!loading) localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
  }, [rows, loading])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (employeeFilter !== 'all' && item.employeeId !== employeeFilter) return false
      if (categoryFilter !== 'all' && item.complaintCategory !== categoryFilter) return false
      if (severityFilter !== 'all' && item.severityLevel !== severityFilter) return false
      if (!q) return true
      const bag = [
        item.complaintNo,
        item.employeeName,
        item.complaintCategory,
        item.status,
        item.severityLevel,
        item.againstEmployee,
        item.complaintDetails
      ].join(' ').toLowerCase()
      return bag.includes(q)
    })
  }, [rows, search, statusFilter, employeeFilter, categoryFilter, severityFilter])

  const stats = useMemo(() => ({
    total: rows.length,
    open: rows.filter((x) => x.status === 'Open').length,
    underReview: rows.filter((x) => x.status === 'Under Review').length,
    closed: rows.filter((x) => x.status === 'Closed').length
  }), [rows])

  const openNew = () => {
    const complaintNo = createComplaintNo(rows)
    setEditingId('')
    setForm(createForm(complaintNo))
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({ ...row })
    setFormOpen(true)
  }

  const onSubmit = () => {
    if (!form.againstEmployee.trim() || !form.complaintDetails.trim()) {
      setError('Against Employee and Complaint Details are required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const emp = employees.find((e) => e.id === form.employeeId) || employees[0]
      if (editingId) {
        setRows((prev) => prev.map((item) => (item.id === editingId ? {
          ...item,
          ...form,
          employeeName: emp.name,
          department: emp.department,
          againstEmployee: form.againstEmployee.trim(),
          complaintDetails: form.complaintDetails.trim(),
          witnessOptional: (form.witnessOptional || '').trim()
        } : item)))
        showToast('success', 'Complaint updated')
      } else {
        setRows((prev) => [{
          ...form,
          id: `hrcp-${Date.now()}`,
          complaintNo: form.complaintNo || createComplaintNo(prev),
          employeeName: emp.name,
          department: emp.department,
          againstEmployee: form.againstEmployee.trim(),
          complaintDetails: form.complaintDetails.trim(),
          witnessOptional: (form.witnessOptional || '').trim()
        }, ...prev])
        showToast('success', 'Complaint submitted')
      }
      setFormOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteConfirm = () => {
    if (!selected?.id) return
    setRows((prev) => prev.filter((item) => item.id !== selected.id))
    setDeleteOpen(false)
    setSelected(null)
    showToast('success', 'Complaint deleted')
  }

  const moveStatus = (row, nextStatus) => {
    setRows((prev) => prev.map((item) => (item.id === row.id ? {
      ...item,
      status: nextStatus,
      actionTaken: nextStatus === 'Under Review' ? 'Taken up by HR.' : nextStatus === 'Closed' ? 'Closed by HR.' : item.actionTaken,
      closureDate: nextStatus === 'Closed' ? today() : item.closureDate
    } : item)))
    showToast('success', `Marked as ${nextStatus}`)
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Complaint Box Module"
        description="HR workspace to review, process, and close employee complaints."
        breadcrumb={['HR Portal', 'Complaint Box']}
        primaryActionLabel="Raise Complaint"
        onPrimaryAction={openNew}
      />

      {toast.message ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}
      {error ? <div className="panel error-banner">{error}</div> : null}

      <div className="stats-grid">
        <div className="stat-card"><p>Total Complaints</p><h3>{stats.total}</h3></div>
        <div className="stat-card"><p>Open</p><h3>{stats.open}</h3></div>
        <div className="stat-card"><p>Under Review</p><h3>{stats.underReview}</h3></div>
        <div className="stat-card"><p>Closed</p><h3>{stats.closed}</h3></div>
      </div>

      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by no, employee, category, status, severity" />
          </div>
          <FilterDropdown label="Employee" value={employeeFilter} onChange={setEmployeeFilter} options={[{ value: 'all', label: 'All Employees' }, ...employees.map((e) => ({ value: e.id, label: `${e.name} (${e.id})` }))]} />
          <FilterDropdown label="Category" value={categoryFilter} onChange={setCategoryFilter} options={[{ value: 'all', label: 'All Categories' }, ...categoryOptions]} />
          <FilterDropdown label="Severity" value={severityFilter} onChange={setSeverityFilter} options={severityOptions} />
          <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        </div>
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={() => setRows((prev) => [...prev])}><RefreshCw size={14} /> Refresh</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>HR Complaint Records</h3></div>
        {loading ? <EmptyState title="Loading..." description="Please wait." /> : filteredRows.length === 0 ? (
          <EmptyState title="No complaints found" description="Use Raise Complaint to create your first complaint." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Employee</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.complaintNo}</td>
                    <td>{row.employeeName}</td>
                    <td>{row.complaintCategory}</td>
                    <td>{row.severityLevel}</td>
                    <td>{row.status}</td>
                    <td>{row.complaintDate}</td>
                    <td>
                      <div className="table-actions">
                        <button className="text-btn" onClick={() => { setSelected(row); setDetailsOpen(true) }}>View</button>
                        <button className="text-btn" onClick={() => openEdit(row)}>Edit</button>
                        {row.status === 'Open' ? <button className="text-btn" onClick={() => moveStatus(row, 'Under Review')}>Review</button> : null}
                        {row.status !== 'Closed' ? <button className="text-btn" onClick={() => moveStatus(row, 'Closed')}>Close</button> : null}
                        <button className="text-btn danger" onClick={() => { setSelected(row); setDeleteOpen(true) }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ComplaintFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        form={form}
        setForm={setForm}
        submitting={submitting}
        editing={Boolean(editingId)}
        onSubmit={onSubmit}
      />

      <ComplaintDetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} complaint={selected} loading={false} />

      <Modal open={deleteOpen} title="Delete Complaint" onClose={() => setDeleteOpen(false)}>
        <div className="modal-form">
          <p>Delete complaint <strong>{selected?.complaintNo || '-'}</strong>?</p>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={onDeleteConfirm}>Delete</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default HrComplaintBoxPage

import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import FilterDropdown from '../components/ui/FilterDropdown'
import Modal from '../components/ui/Modal'
import SearchBar from '../components/ui/SearchBar'

const STORAGE_KEY = 'hr_grievance_workspace_v1'

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'Open', label: 'Open' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Closed', label: 'Closed' }
]

const typeOptions = [
  { value: 'Salary', label: 'Salary' },
  { value: 'Attendance', label: 'Attendance' },
  { value: 'Leave', label: 'Leave' },
  { value: 'Behavior', label: 'Behavior' },
  { value: 'Policy', label: 'Policy' },
  { value: 'Other', label: 'Other' }
]

const priorityOptions = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' }
]

const employees = [
  { id: 'EMP001', name: 'Arjun Mehta', department: 'Engineering' },
  { id: 'EMP002', name: 'Kritika Jain', department: 'Product' },
  { id: 'EMP003', name: 'Naman Verma', department: 'Sales' }
]

const seedRows = [
  {
    id: 'hrgr-001',
    grievanceNo: 'GRV-20260601-001',
    employeeId: 'EMP001',
    employeeName: 'Arjun Mehta',
    department: 'Engineering',
    dateRaised: '2026-06-01',
    grievanceType: 'Attendance',
    priority: 'High',
    description: 'Check-in mismatch shown in monthly report.',
    resolutionRemarks: '',
    status: 'Open'
  }
]

const getToday = () => new Date().toISOString().slice(0, 10)

const buildNo = (rows) => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const count = rows.filter((x) => String(x.grievanceNo).includes(`GRV-${datePart}-`)).length + 1
  return `GRV-${datePart}-${String(count).padStart(3, '0')}`
}

const initialForm = {
  employeeId: 'EMP001',
  grievanceType: 'Salary',
  priority: 'Medium',
  description: '',
  resolutionRemarks: ''
}

const badgeClassByStatus = {
  Open: 'badge badge-warning',
  'In Progress': 'badge badge-info',
  Resolved: 'badge badge-success',
  Closed: 'badge badge-neutral'
}

function HrGrievancePage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [employee, setEmployee] = useState('all')
  const [grievanceType, setGrievanceType] = useState('all')
  const [priority, setPriority] = useState('all')
  const [toast, setToast] = useState(null)

  const [open, setOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(initialForm)

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

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (status !== 'all' && r.status !== status) return false
      if (employee !== 'all' && r.employeeId !== employee) return false
      if (grievanceType !== 'all' && r.grievanceType !== grievanceType) return false
      if (priority !== 'all' && r.priority !== priority) return false
      if (!q) return true
      return `${r.grievanceNo} ${r.employeeName} ${r.grievanceType} ${r.status} ${r.priority} ${r.description}`.toLowerCase().includes(q)
    })
  }, [rows, search, status, employee, grievanceType, priority])

  const stats = useMemo(() => ({
    total: rows.length,
    open: rows.filter((x) => x.status === 'Open').length,
    inProgress: rows.filter((x) => x.status === 'In Progress').length,
    resolved: rows.filter((x) => x.status === 'Resolved').length,
    closed: rows.filter((x) => x.status === 'Closed').length
  }), [rows])

  const openCreate = () => {
    setEditingId('')
    setForm(initialForm)
    setOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({
      employeeId: row.employeeId,
      grievanceType: row.grievanceType,
      priority: row.priority,
      description: row.description,
      resolutionRemarks: row.resolutionRemarks || ''
    })
    setOpen(true)
  }

  const save = () => {
    if (!form.description.trim()) {
      setToast({ type: 'error', message: 'Grievance description required' })
      return
    }

    if (editingId) {
      setRows((prev) => prev.map((r) => (r.id === editingId ? {
        ...r,
        ...form,
        description: form.description.trim(),
        resolutionRemarks: form.resolutionRemarks.trim()
      } : r)))
      setToast({ type: 'success', message: 'Grievance updated' })
    } else {
      const emp = employees.find((x) => x.id === form.employeeId) || employees[0]
      const entry = {
        id: `hrgr-${Date.now()}`,
        grievanceNo: buildNo(rows),
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        dateRaised: getToday(),
        grievanceType: form.grievanceType,
        priority: form.priority,
        description: form.description.trim(),
        resolutionRemarks: form.resolutionRemarks.trim(),
        status: 'Open'
      }
      setRows((prev) => [entry, ...prev])
      setToast({ type: 'success', message: 'Grievance created' })
    }

    setOpen(false)
  }

  const updateStatus = (row, nextStatus) => {
    const nextRemarks = nextStatus === 'In Progress'
      ? 'Taken up by HR for review.'
      : nextStatus === 'Resolved'
        ? 'Issue resolved by HR team.'
        : nextStatus === 'Closed'
          ? 'Grievance closed by HR.'
          : row.resolutionRemarks

    setRows((prev) => prev.map((r) => (r.id === row.id ? {
      ...r,
      status: nextStatus,
      resolutionRemarks: r.resolutionRemarks || nextRemarks
    } : r)))
    setToast({ type: 'success', message: `Marked as ${nextStatus}` })
  }

  const askDelete = (row) => {
    setSelected(row)
    setDeleteOpen(true)
  }

  const remove = () => {
    if (!selected?.id) return
    setRows((prev) => prev.filter((r) => r.id !== selected.id))
    setDeleteOpen(false)
    setSelected(null)
    setToast({ type: 'success', message: 'Grievance deleted' })
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Grievance Module"
        description="HR grievance workspace for employee issues with full lifecycle actions."
        breadcrumb={['HR Portal', 'Grievance']}
        primaryActionLabel="Raise Grievance"
        onPrimaryAction={openCreate}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="stats-grid">
        <div className="stat-card"><p>Total Grievances</p><h3>{stats.total}</h3></div>
        <div className="stat-card"><p>Open</p><h3>{stats.open}</h3></div>
        <div className="stat-card"><p>In Progress</p><h3>{stats.inProgress}</h3></div>
        <div className="stat-card"><p>Resolved</p><h3>{stats.resolved}</h3></div>
        <div className="stat-card"><p>Closed</p><h3>{stats.closed}</h3></div>
      </div>

      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by no, employee, type, status, priority" />
          </div>
          <FilterDropdown label="Employee" value={employee} onChange={setEmployee} options={[{ value: 'all', label: 'All Employees' }, ...employees.map((e) => ({ value: e.id, label: `${e.name} (${e.id})` }))]} />
          <FilterDropdown label="Type" value={grievanceType} onChange={setGrievanceType} options={[{ value: 'all', label: 'All Types' }, ...typeOptions]} />
          <FilterDropdown label="Priority" value={priority} onChange={setPriority} options={[{ value: 'all', label: 'All Priorities' }, ...priorityOptions]} />
          <FilterDropdown label="Status" value={status} onChange={setStatus} options={statusOptions} />
        </div>
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={() => setRows((prev) => [...prev])}><RefreshCw size={14} /> Refresh</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>HR Grievance Records</h3></div>
        {loading ? <EmptyState title="Loading..." description="Please wait." /> : filtered.length === 0 ? (
          <EmptyState title="No grievances found" description="Create or review grievance entries from HR panel." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>{row.grievanceNo}</td>
                    <td>{row.employeeName}</td>
                    <td>{row.department}</td>
                    <td>{row.grievanceType}</td>
                    <td>{row.priority}</td>
                    <td><span className={badgeClassByStatus[row.status] || 'badge badge-neutral'}>{row.status}</span></td>
                    <td>{row.dateRaised}</td>
                    <td>
                      <div className="table-actions">
                        <button className="text-btn" onClick={() => { setSelected(row); setDetailsOpen(true) }}>View</button>
                        <button className="text-btn" onClick={() => openEdit(row)}>Edit</button>
                        {row.status === 'Open' ? <button className="text-btn" onClick={() => updateStatus(row, 'In Progress')}>Start</button> : null}
                        {row.status === 'In Progress' ? <button className="text-btn" onClick={() => updateStatus(row, 'Resolved')}>Resolve</button> : null}
                        {row.status !== 'Closed' ? <button className="text-btn" onClick={() => updateStatus(row, 'Closed')}>Close</button> : null}
                        <button className="text-btn danger" onClick={() => askDelete(row)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={open} title={editingId ? 'Edit Grievance' : 'Add Grievance'} onClose={() => setOpen(false)}>
        <div className="modal-form">
          <FilterDropdown
            label="Employee"
            value={form.employeeId}
            onChange={(value) => setForm((prev) => ({ ...prev, employeeId: value }))}
            options={employees.map((e) => ({ value: e.id, label: `${e.name} (${e.id})` }))}
          />
          <FilterDropdown
            label="Type"
            value={form.grievanceType}
            onChange={(value) => setForm((prev) => ({ ...prev, grievanceType: value }))}
            options={typeOptions}
          />
          <FilterDropdown
            label="Priority"
            value={form.priority}
            onChange={(value) => setForm((prev) => ({ ...prev, priority: value }))}
            options={priorityOptions}
          />
          <label className="form-input-wrap">
            <span>Resolution Remarks</span>
            <input
              className="form-input"
              value={form.resolutionRemarks}
              onChange={(event) => setForm((prev) => ({ ...prev, resolutionRemarks: event.target.value }))}
              placeholder="Optional remarks"
            />
          </label>
          <label className="form-input-wrap">
            <span>Description</span>
            <textarea
              className="form-input form-textarea"
              rows={4}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Write grievance details"
            />
          </label>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editingId ? 'Save Changes' : 'Create Grievance'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={detailsOpen} title="Grievance Details" onClose={() => setDetailsOpen(false)}>
        <div className="modal-form">
          {!selected ? null : (
            <div className="detail-grid">
              <div><strong>No:</strong> {selected.grievanceNo}</div>
              <div><strong>Employee:</strong> {selected.employeeName}</div>
              <div><strong>Department:</strong> {selected.department}</div>
              <div><strong>Type:</strong> {selected.grievanceType}</div>
              <div><strong>Priority:</strong> {selected.priority}</div>
              <div><strong>Status:</strong> {selected.status}</div>
              <div><strong>Date:</strong> {selected.dateRaised}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Description:</strong> {selected.description}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Resolution:</strong> {selected.resolutionRemarks || '-'}</div>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={deleteOpen} title="Delete Grievance" onClose={() => setDeleteOpen(false)}>
        <div className="modal-form">
          <p>Are you sure you want to delete <strong>{selected?.grievanceNo || '-'}</strong>?</p>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={remove}>Delete</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default HrGrievancePage

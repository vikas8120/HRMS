import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import FilterDropdown from '../components/ui/FilterDropdown'
import Modal from '../components/ui/Modal'
import SearchBar from '../components/ui/SearchBar'

const STORAGE_KEY = 'hr_feedback_workspace_v1'

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Reviewed', label: 'Reviewed' },
  { value: 'Implemented', label: 'Implemented' },
  { value: 'Closed', label: 'Closed' }
]

const categoryOptions = [
  { value: 'Work Culture', label: 'Work Culture' },
  { value: 'Management', label: 'Management' },
  { value: 'Training', label: 'Training' },
  { value: 'Facilities', label: 'Facilities' },
  { value: 'Policy', label: 'Policy' },
  { value: 'Other', label: 'Other' }
]

const typeOptions = [
  { value: 'Suggestion', label: 'Suggestion' },
  { value: 'Concern', label: 'Concern' },
  { value: 'Appreciation', label: 'Appreciation' },
  { value: 'Improvement', label: 'Improvement' }
]

const employees = [
  { id: 'EMP001', name: 'Arjun Mehta', department: 'Engineering' },
  { id: 'EMP002', name: 'Kritika Jain', department: 'Product' },
  { id: 'EMP003', name: 'Naman Verma', department: 'Sales' }
]

const seedRows = [
  {
    id: 'hrfb-001',
    feedbackNo: 'FDB-20260601-001',
    employeeId: 'EMP001',
    employeeName: 'Arjun Mehta',
    department: 'Engineering',
    dateSubmitted: '2026-06-01',
    feedbackCategory: 'Work Culture',
    feedbackType: 'Suggestion',
    feedbackDetails: 'Weekly feedback sync can improve transparency.',
    actionTaken: '',
    status: 'Pending'
  }
]

const buildNo = (rows) => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const count = rows.filter((x) => String(x.feedbackNo).includes(`FDB-${datePart}-`)).length + 1
  return `FDB-${datePart}-${String(count).padStart(3, '0')}`
}

function HrFeedbackPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [employee, setEmployee] = useState('all')
  const [category, setCategory] = useState('all')
  const [toast, setToast] = useState(null)

  const [open, setOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({
    employeeId: 'EMP001',
    feedbackCategory: 'Work Culture',
    feedbackType: 'Suggestion',
    feedbackDetails: ''
  })

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
      if (category !== 'all' && r.feedbackCategory !== category) return false
      if (!q) return true
      return `${r.feedbackNo} ${r.employeeName} ${r.feedbackCategory} ${r.feedbackType} ${r.feedbackDetails}`.toLowerCase().includes(q)
    })
  }, [rows, search, status, employee, category])

  const stats = useMemo(() => ({
    total: rows.length,
    pending: rows.filter((x) => x.status === 'Pending').length,
    reviewed: rows.filter((x) => x.status === 'Reviewed').length,
    implemented: rows.filter((x) => x.status === 'Implemented').length
  }), [rows])

  const openCreate = () => {
    setEditingId('')
    setForm({ employeeId: 'EMP001', feedbackCategory: 'Work Culture', feedbackType: 'Suggestion', feedbackDetails: '' })
    setOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({
      employeeId: row.employeeId,
      feedbackCategory: row.feedbackCategory,
      feedbackType: row.feedbackType,
      feedbackDetails: row.feedbackDetails
    })
    setOpen(true)
  }

  const save = () => {
    if (!form.feedbackDetails.trim()) {
      setToast({ type: 'error', message: 'Feedback details required' })
      return
    }
    if (editingId) {
      setRows((prev) => prev.map((r) => (r.id === editingId ? { ...r, ...form } : r)))
      setToast({ type: 'success', message: 'Feedback updated' })
    } else {
      const emp = employees.find((x) => x.id === form.employeeId) || employees[0]
      const entry = {
        id: `hrfb-${Date.now()}`,
        feedbackNo: buildNo(rows),
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        dateSubmitted: new Date().toISOString().slice(0, 10),
        feedbackCategory: form.feedbackCategory,
        feedbackType: form.feedbackType,
        feedbackDetails: form.feedbackDetails.trim(),
        actionTaken: '',
        status: 'Pending'
      }
      setRows((prev) => [entry, ...prev])
      setToast({ type: 'success', message: 'Feedback submitted' })
    }
    setOpen(false)
  }

  const updateStatus = (row, nextStatus) => {
    const actionTaken = nextStatus === 'Reviewed'
      ? 'Reviewed by HR'
      : nextStatus === 'Implemented'
        ? 'Action implemented by HR'
        : nextStatus === 'Closed'
          ? 'Feedback closed by HR'
          : row.actionTaken
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: nextStatus, actionTaken } : r)))
    setToast({ type: 'success', message: `Marked as ${nextStatus}` })
  }

  const remove = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
    setToast({ type: 'success', message: 'Feedback deleted' })
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Feedback Module"
        description="HR review workspace for employee feedback with action tracking."
        breadcrumb={['HR Portal', 'Feedback']}
        primaryActionLabel="Submit Feedback"
        onPrimaryAction={openCreate}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="stats-grid">
        <div className="stat-card"><p>Total Feedback</p><h3>{stats.total}</h3></div>
        <div className="stat-card"><p>Pending</p><h3>{stats.pending}</h3></div>
        <div className="stat-card"><p>Reviewed</p><h3>{stats.reviewed}</h3></div>
        <div className="stat-card"><p>Implemented</p><h3>{stats.implemented}</h3></div>
      </div>

      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by no, employee, category, details" />
          </div>
          <FilterDropdown label="Employee" value={employee} onChange={setEmployee} options={[{ value: 'all', label: 'All Employees' }, ...employees.map((e) => ({ value: e.id, label: `${e.name} (${e.id})` }))]} />
          <FilterDropdown label="Category" value={category} onChange={setCategory} options={[{ value: 'all', label: 'All Categories' }, ...categoryOptions]} />
          <FilterDropdown label="Status" value={status} onChange={setStatus} options={statusOptions} />
        </div>
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={() => setRows((prev) => [...prev])}><RefreshCw size={14} /> Refresh</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>HR Feedback Records</h3></div>
        {loading ? <EmptyState title="Loading..." description="Please wait." /> : filtered.length === 0 ? (
          <EmptyState title="No feedback found" description="Create or review feedback entries from HR panel." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>{row.feedbackNo}</td>
                    <td>{row.employeeName}</td>
                    <td>{row.department}</td>
                    <td>{row.feedbackCategory}</td>
                    <td><span className={`badge badge-${row.status.toLowerCase()}`}>{row.status}</span></td>
                    <td>{row.dateSubmitted}</td>
                    <td>
                      <div className="table-actions">
                        <button className="text-btn" onClick={() => { setSelected(row); setDetailsOpen(true) }}>View</button>
                        <button className="text-btn" onClick={() => openEdit(row)}>Edit</button>
                        {row.status === 'Pending' ? <button className="text-btn" onClick={() => updateStatus(row, 'Reviewed')}>Mark Reviewed</button> : null}
                        {row.status === 'Reviewed' ? <button className="text-btn" onClick={() => updateStatus(row, 'Implemented')}>Mark Implemented</button> : null}
                        {row.status !== 'Closed' ? <button className="text-btn" onClick={() => updateStatus(row, 'Closed')}>Close</button> : null}
                        <button className="text-btn danger" onClick={() => remove(row.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={open} title={editingId ? 'Edit Feedback' : 'Add Feedback'} onClose={() => setOpen(false)}>
        <div className="modal-form">
          <FilterDropdown label="Employee" value={form.employeeId} onChange={(value) => setForm((p) => ({ ...p, employeeId: value }))} options={employees.map((e) => ({ value: e.id, label: `${e.name} (${e.id})` }))} />
          <FilterDropdown label="Category" value={form.feedbackCategory} onChange={(value) => setForm((p) => ({ ...p, feedbackCategory: value }))} options={categoryOptions} />
          <FilterDropdown label="Type" value={form.feedbackType} onChange={(value) => setForm((p) => ({ ...p, feedbackType: value }))} options={typeOptions} />
          <label className="form-input-wrap">
            <span>Feedback Details</span>
            <textarea className="form-input" rows={4} value={form.feedbackDetails} onChange={(e) => setForm((p) => ({ ...p, feedbackDetails: e.target.value }))} />
          </label>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editingId ? 'Save Changes' : 'Submit Feedback'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={detailsOpen} title="Feedback Details" onClose={() => setDetailsOpen(false)}>
        {!selected ? null : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Feedback No:</strong> <span>{selected.feedbackNo}</span></div>
            <div className="inline-action-card"><strong>Employee:</strong> <span>{selected.employeeName} ({selected.employeeId})</span></div>
            <div className="inline-action-card"><strong>Department:</strong> <span>{selected.department}</span></div>
            <div className="inline-action-card"><strong>Category:</strong> <span>{selected.feedbackCategory}</span></div>
            <div className="inline-action-card"><strong>Type:</strong> <span>{selected.feedbackType}</span></div>
            <div className="inline-action-card"><strong>Status:</strong> <span>{selected.status}</span></div>
            <div className="inline-action-card"><strong>Details:</strong> <span>{selected.feedbackDetails}</span></div>
            <div className="inline-action-card"><strong>Action Taken:</strong> <span>{selected.actionTaken || '-'}</span></div>
          </div>
        )}
      </Modal>
    </section>
  )
}

export default HrFeedbackPage

import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import SearchBar from '../components/ui/SearchBar'
import FilterDropdown from '../components/ui/FilterDropdown'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import FormInput from '../components/ui/FormInput'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'

const STORAGE_KEY = 'company_admin_managers_v2'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DEPARTMENTS = [
  { id: 'eng', name: 'Engineering' },
  { id: 'product', name: 'Product' },
  { id: 'sales', name: 'Sales' },
  { id: 'hr', name: 'HR' },
  { id: 'finance', name: 'Finance' }
]

const EMPLOYEES = [
  { id: 'emp-101', name: 'Arjun Mehta', email: 'arjun.mehta@acme.com', departmentId: 'eng', status: 'active' },
  { id: 'emp-102', name: 'Kritika Jain', email: 'kritika.jain@acme.com', departmentId: 'eng', status: 'active' },
  { id: 'emp-103', name: 'Naman Verma', email: 'naman.verma@acme.com', departmentId: 'product', status: 'active' },
  { id: 'emp-104', name: 'Tanya Kapoor', email: 'tanya.kapoor@acme.com', departmentId: 'sales', status: 'active' },
  { id: 'emp-105', name: 'Rohit Das', email: 'rohit.das@acme.com', departmentId: 'finance', status: 'active' },
  { id: 'emp-106', name: 'Sneha Pillai', email: 'sneha.pillai@acme.com', departmentId: 'hr', status: 'active' },
  { id: 'emp-107', name: 'Dev Joshi', email: 'dev.joshi@acme.com', departmentId: 'sales', status: 'inactive' }
]

const seedManagers = [
  {
    id: 'mgr-201',
    name: 'Anita Sharma',
    email: 'anita.sharma@acme.com',
    phone: '+91-9876543201',
    departmentId: 'eng',
    status: 'active',
    assignedEmployeeIds: ['emp-101', 'emp-102'],
    createdAt: '2026-05-28T10:25:00.000Z',
    updatedAt: '2026-06-01T08:10:00.000Z'
  },
  {
    id: 'mgr-202',
    name: 'Ritesh Nair',
    email: 'ritesh.nair@acme.com',
    phone: '+91-9876543202',
    departmentId: 'sales',
    status: 'active',
    assignedEmployeeIds: ['emp-104', 'emp-107'],
    createdAt: '2026-05-25T14:30:00.000Z',
    updatedAt: '2026-06-01T07:50:00.000Z'
  },
  {
    id: 'mgr-203',
    name: 'Pooja Iyer',
    email: 'pooja.iyer@acme.com',
    phone: '+91-9876543203',
    departmentId: 'product',
    status: 'inactive',
    assignedEmployeeIds: ['emp-103'],
    createdAt: '2026-05-21T11:40:00.000Z',
    updatedAt: '2026-05-31T15:05:00.000Z'
  }
]

const initialForm = {
  name: '',
  email: '',
  phone: '',
  departmentId: '',
  status: 'active'
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function CompanyAdminManagersPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const [searchDraft, setSearchDraft] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [toast, setToast] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [teamOpen, setTeamOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setRows(parsed)
          setLoading(false)
          return
        }
      }
    } catch (_err) {
      // If storage parse fails, fallback to seed.
    }

    setRows(seedManagers)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (loading) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
  }, [rows, loading])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(timer)
  }, [toast])

  const departmentMap = useMemo(() => Object.fromEntries(DEPARTMENTS.map((dept) => [dept.id, dept.name])), [])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const text = `${row.name} ${row.email} ${row.phone}`.toLowerCase()
      const searchOk = searchQuery.trim() ? text.includes(searchQuery.trim().toLowerCase()) : true
      const deptOk = departmentFilter === 'all' ? true : row.departmentId === departmentFilter
      const statusOk = statusFilter === 'all' ? true : row.status === statusFilter
      return searchOk && deptOk && statusOk
    })
  }, [rows, searchQuery, departmentFilter, statusFilter])

  const openAdd = () => {
    setSelected(null)
    setForm(initialForm)
    setFormErrors({})
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setSelected(row)
    setForm({
      name: row.name,
      email: row.email,
      phone: row.phone,
      departmentId: row.departmentId,
      status: row.status
    })
    setFormErrors({})
    setFormOpen(true)
  }

  const openAssign = (row) => {
    setSelected(row)
    setAssignedEmployeeIds(Array.isArray(row.assignedEmployeeIds) ? row.assignedEmployeeIds : [])
    setAssignOpen(true)
  }

  const openTeam = (row) => {
    setSelected(row)
    setTeamOpen(true)
  }

  const validateForm = () => {
    const next = {}

    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!EMAIL_REGEX.test(form.email.trim())) next.email = 'Enter a valid email'

    if (!form.phone.trim()) next.phone = 'Phone is required'
    if (!form.departmentId) next.departmentId = 'Department is required'

    const duplicateEmail = rows.some((item) => item.email.toLowerCase() === form.email.trim().toLowerCase() && item.id !== selected?.id)
    if (duplicateEmail) next.email = 'This email is already assigned to another manager'

    const duplicatePhone = rows.some((item) => item.phone === form.phone.trim() && item.id !== selected?.id)
    if (duplicatePhone) next.phone = 'This phone number is already assigned to another manager'

    setFormErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = (event) => {
    event.preventDefault()
    if (!validateForm()) return

    const now = new Date().toISOString()

    if (selected) {
      setRows((prev) => prev.map((item) => (item.id === selected.id
        ? {
            ...item,
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim(),
            departmentId: form.departmentId,
            status: form.status,
            updatedAt: now
          }
        : item)))
      setToast({ type: 'success', message: 'Manager updated successfully' })
    } else {
      const id = `mgr-${Date.now()}`
      setRows((prev) => [
        {
          id,
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          departmentId: form.departmentId,
          status: form.status,
          assignedEmployeeIds: [],
          createdAt: now,
          updatedAt: now
        },
        ...prev
      ])
      setToast({ type: 'success', message: 'Manager created successfully' })
    }

    setFormOpen(false)
    setSelected(null)
  }

  const onToggleStatus = (row) => {
    const nextStatus = row.status === 'active' ? 'inactive' : 'active'
    setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() } : item)))
    setToast({ type: 'success', message: `Manager ${nextStatus === 'active' ? 'activated' : 'deactivated'}` })
  }

  const onDelete = () => {
    if (!selected?.id) return
    setRows((prev) => prev.filter((item) => item.id !== selected.id))
    setConfirmOpen(false)
    setToast({ type: 'success', message: 'Manager deleted successfully' })
    setSelected(null)
  }

  const onAssignEmployees = () => {
    if (!selected?.id) return
    setRows((prev) => prev.map((item) => (item.id === selected.id
      ? { ...item, assignedEmployeeIds, updatedAt: new Date().toISOString() }
      : item)))
    setAssignOpen(false)
    setToast({ type: 'success', message: 'Team assignment updated' })
  }

  const activeTeam = useMemo(() => {
    if (!selected) return []
    return EMPLOYEES.filter((emp) => selected.assignedEmployeeIds?.includes(emp.id))
  }, [selected])

  const stats = useMemo(() => {
    const total = rows.length
    const active = rows.filter((item) => item.status === 'active').length
    const inactive = rows.filter((item) => item.status === 'inactive').length
    const teamMembers = rows.reduce((sum, item) => sum + (item.assignedEmployeeIds?.length || 0), 0)
    return { total, active, inactive, teamMembers }
  }, [rows])

  return (
    <section className="section-layout">
      <PageHeader
        title="Managers"
        description="Manage managers, departments, and team assignments with company-level access control."
        breadcrumb={['Company Admin', 'Managers']}
        primaryActionLabel="Add Manager"
        onPrimaryAction={openAdd}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="stats-grid stats-grid-4">
          <div className="stat-card"><p>Total Managers</p><h3>{stats.total}</h3></div>
          <div className="stat-card"><p>Active Managers</p><h3>{stats.active}</h3></div>
          <div className="stat-card"><p>Inactive Managers</p><h3>{stats.inactive}</h3></div>
          <div className="stat-card"><p>Total Team Assignments</p><h3>{stats.teamMembers}</h3></div>
        </div>
      </div>

      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={searchDraft} onChange={setSearchDraft} placeholder="Search by manager name, email, or phone" />
          </div>

          <FilterDropdown
            label="Department"
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={[{ value: 'all', label: 'All Departments' }, ...DEPARTMENTS.map((dept) => ({ value: dept.id, label: dept.name }))]}
          />

          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          />
        </div>

        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={() => setSearchQuery(searchDraft)}>Apply Search</Button>
          <Button variant="ghost" onClick={() => {
            setSearchDraft('')
            setSearchQuery('')
            setDepartmentFilter('all')
            setStatusFilter('all')
          }}><RefreshCw size={14} /> Reset</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Manager Records</h3>
          <div className="actions-row"><Button onClick={openAdd}>Add Manager</Button></div>
        </div>

        {loading ? null : filteredRows.length === 0 ? (
          <EmptyState title="No managers found" description="Try changing search or filter criteria." />
        ) : (
          <div className="table-wrap">
            <div className="table-meta"><p>{filteredRows.length} records</p></div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Team Size</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.email}</td>
                    <td>{row.phone}</td>
                    <td>{departmentMap[row.departmentId] || '-'}</td>
                    <td><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                    <td>{row.assignedEmployeeIds?.length || 0}</td>
                    <td>{formatDateTime(row.updatedAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="text-btn" onClick={() => openEdit(row)}>Edit</button>
                        <button className="text-btn" onClick={() => openAssign(row)}>Assign Team</button>
                        <button className="text-btn" onClick={() => openTeam(row)}>View Team</button>
                        <button className="text-btn" onClick={() => onToggleStatus(row)}>{row.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                        <button className="text-btn danger" onClick={() => { setSelected(row); setConfirmOpen(true) }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={formOpen} title={selected ? 'Edit Manager' : 'Add Manager'} onClose={() => setFormOpen(false)}>
        <form className="modal-form" onSubmit={onSubmit}>
          <FormInput label="Manager Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          {formErrors.name ? <p className="error">{formErrors.name}</p> : null}

          <FormInput label="Work Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
          {formErrors.email ? <p className="error">{formErrors.email}</p> : null}

          <FormInput label="Phone Number" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
          {formErrors.phone ? <p className="error">{formErrors.phone}</p> : null}

          <FilterDropdown
            label="Department"
            value={form.departmentId}
            onChange={(value) => setForm((prev) => ({ ...prev, departmentId: value }))}
            options={[{ value: '', label: 'Select Department' }, ...DEPARTMENTS.map((dept) => ({ value: dept.id, label: dept.name }))]}
          />
          {formErrors.departmentId ? <p className="error">{formErrors.departmentId}</p> : null}

          <FilterDropdown
            label="Status"
            value={form.status}
            onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
            options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          />

          <Button type="submit">{selected ? 'Save Changes' : 'Create Manager'}</Button>
        </form>
      </Modal>

      <Modal open={assignOpen} title={`Assign Team - ${selected?.name || ''}`} onClose={() => setAssignOpen(false)}>
        <div className="modal-form">
          <div className="checkbox-grid">
            {EMPLOYEES.map((emp) => (
              <label key={emp.id} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={assignedEmployeeIds.includes(emp.id)}
                  onChange={() => setAssignedEmployeeIds((prev) => (prev.includes(emp.id) ? prev.filter((item) => item !== emp.id) : [...prev, emp.id]))}
                />
                <span>{emp.name} - {departmentMap[emp.departmentId] || '-'}</span>
              </label>
            ))}
          </div>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={onAssignEmployees}>Save Team Assignment</Button>
          </div>
        </div>
      </Modal>

      <Modal open={teamOpen} title={`Team Members - ${selected?.name || ''}`} onClose={() => setTeamOpen(false)}>
        {activeTeam.length === 0 ? (
          <EmptyState title="No team members assigned" description="Use Assign Team to map employees under this manager." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeTeam.map((member) => (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td>{member.email}</td>
                    <td>{departmentMap[member.departmentId] || '-'}</td>
                    <td><span className={`badge badge-${member.status}`}>{member.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Manager"
        message={`Delete ${selected?.name || 'this manager'} from manager records?`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onDelete}
      />
    </section>
  )
}

export default CompanyAdminManagersPage

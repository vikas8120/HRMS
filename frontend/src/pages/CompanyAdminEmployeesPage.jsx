import { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import SearchBar from '../components/ui/SearchBar'
import FilterDropdown from '../components/ui/FilterDropdown'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import FormInput from '../components/ui/FormInput'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'

const STORAGE_KEY = 'company_admin_employees_v2'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DEPARTMENTS = [
  { id: 'eng', name: 'Engineering' },
  { id: 'product', name: 'Product' },
  { id: 'sales', name: 'Sales' },
  { id: 'hr', name: 'HR' },
  { id: 'finance', name: 'Finance' },
  { id: 'design', name: 'Design' }
]

const MANAGERS = [
  { id: 'mgr-201', name: 'Anita Sharma', departmentId: 'eng' },
  { id: 'mgr-202', name: 'Ritesh Nair', departmentId: 'sales' },
  { id: 'mgr-203', name: 'Pooja Iyer', departmentId: 'product' },
  { id: 'mgr-204', name: 'Imran Ali', departmentId: 'design' }
]

const initialRows = [
  {
    id: 'emp-001',
    employeeId: 'EMP001',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@acme.com',
    phone: '+91-9810011001',
    departmentId: 'eng',
    managerId: 'mgr-201',
    designation: 'Software Engineer',
    joiningDate: '2025-09-12',
    status: 'active',
    createdAt: '2026-05-20T09:40:00.000Z',
    updatedAt: '2026-06-01T08:10:00.000Z'
  },
  {
    id: 'emp-002',
    employeeId: 'EMP002',
    name: 'Kritika Jain',
    email: 'kritika.jain@acme.com',
    phone: '+91-9810011002',
    departmentId: 'product',
    managerId: 'mgr-203',
    designation: 'Product Analyst',
    joiningDate: '2025-10-05',
    status: 'active',
    createdAt: '2026-05-19T12:20:00.000Z',
    updatedAt: '2026-06-01T07:55:00.000Z'
  },
  {
    id: 'emp-003',
    employeeId: 'EMP003',
    name: 'Naman Verma',
    email: 'naman.verma@acme.com',
    phone: '+91-9810011003',
    departmentId: 'sales',
    managerId: 'mgr-202',
    designation: 'Sales Executive',
    joiningDate: '2025-11-18',
    status: 'inactive',
    createdAt: '2026-05-18T16:30:00.000Z',
    updatedAt: '2026-05-30T14:10:00.000Z'
  }
]

const initialForm = {
  employeeId: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  gender: '',
  departmentId: '',
  managerId: '',
  designation: '',
  joiningDate: '',
  status: 'active',
  bankName: '',
  accountHolder: '',
  accountNumber: '',
  ifsc: '',
  emergencyName: '',
  emergencyRelation: '',
  emergencyPhone: ''
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function CompanyAdminEmployeesPage({ embedded = false, title = 'Employees', breadcrumb = ['Company Admin', 'Employees'] }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const [searchDraft, setSearchDraft] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [managerFilter, setManagerFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [toast, setToast] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editConfirmOpen, setEditConfirmOpen] = useState(false)

  const [selected, setSelected] = useState(null)
  const [pendingEditRow, setPendingEditRow] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})

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
      // fallback to seed
    }

    setRows(initialRows)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (loading) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
  }, [rows, loading])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  const departmentMap = useMemo(() => Object.fromEntries(DEPARTMENTS.map((item) => [item.id, item.name])), [])
  const managerMap = useMemo(() => Object.fromEntries(MANAGERS.map((item) => [item.id, item.name])), [])

  const visibleManagers = useMemo(() => {
    if (departmentFilter === 'all') return MANAGERS
    return MANAGERS.filter((item) => item.departmentId === departmentFilter)
  }, [departmentFilter])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const bag = `${row.employeeId} ${row.name} ${row.email} ${row.phone}`.toLowerCase()
      const searchOk = searchQuery.trim() ? bag.includes(searchQuery.trim().toLowerCase()) : true
      const deptOk = departmentFilter === 'all' ? true : row.departmentId === departmentFilter
      const managerOk = managerFilter === 'all' ? true : row.managerId === managerFilter
      const statusOk = statusFilter === 'all' ? true : row.status === statusFilter
      return searchOk && deptOk && managerOk && statusOk
    })
  }, [rows, searchQuery, departmentFilter, managerFilter, statusFilter])

  const stats = useMemo(() => {
    const total = rows.length
    const active = rows.filter((item) => item.status === 'active').length
    const inactive = rows.filter((item) => item.status === 'inactive').length
    const departments = new Set(rows.map((item) => item.departmentId)).size
    return { total, active, inactive, departments }
  }, [rows])

  const openAdd = () => {
    setSelected(null)
    setForm(initialForm)
    setFormErrors({})
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setSelected(row)
    setForm({
      employeeId: row.employeeId,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address || '',
      gender: row.gender || '',
      departmentId: row.departmentId,
      managerId: row.managerId,
      designation: row.designation,
      joiningDate: row.joiningDate,
      status: row.status,
      bankName: row.bankName || '',
      accountHolder: row.accountHolder || '',
      accountNumber: row.accountNumber || '',
      ifsc: row.ifsc || '',
      emergencyName: row.emergencyName || '',
      emergencyRelation: row.emergencyRelation || '',
      emergencyPhone: row.emergencyPhone || ''
    })
    setFormErrors({})
    setFormOpen(true)
  }

  const validateForm = () => {
    const next = {}
    if (!form.employeeId.trim()) next.employeeId = 'Employee ID is required'
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!EMAIL_REGEX.test(form.email.trim())) next.email = 'Invalid email format'
    if (!form.phone.trim()) next.phone = 'Phone is required'
    if (!form.departmentId) next.departmentId = 'Department is required'
    if (!form.managerId) next.managerId = 'Manager is required'
    if (!form.designation.trim()) next.designation = 'Designation is required'
    if (!form.joiningDate) next.joiningDate = 'Joining date is required'

    const duplicateEmpId = rows.some((item) => item.employeeId.toLowerCase() === form.employeeId.trim().toLowerCase() && item.id !== selected?.id)
    if (duplicateEmpId) next.employeeId = 'Employee ID already exists'

    const duplicateEmail = rows.some((item) => item.email.toLowerCase() === form.email.trim().toLowerCase() && item.id !== selected?.id)
    if (duplicateEmail) next.email = 'Email already exists'

    const duplicatePhone = rows.some((item) => item.phone === form.phone.trim() && item.id !== selected?.id)
    if (duplicatePhone) next.phone = 'Phone already exists'

    setFormErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = (event) => {
    event.preventDefault()
    if (!validateForm()) return

    const now = new Date().toISOString()
    const payload = {
      employeeId: form.employeeId.trim().toUpperCase(),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      gender: form.gender,
      departmentId: form.departmentId,
      managerId: form.managerId,
      designation: form.designation.trim(),
      joiningDate: form.joiningDate,
      status: form.status,
      bankName: form.bankName.trim(),
      accountHolder: form.accountHolder.trim(),
      accountNumber: form.accountNumber.trim(),
      ifsc: form.ifsc.trim().toUpperCase(),
      emergencyName: form.emergencyName.trim(),
      emergencyRelation: form.emergencyRelation.trim(),
      emergencyPhone: form.emergencyPhone.trim(),
      updatedAt: now
    }

    if (selected) {
      setRows((prev) => prev.map((item) => (item.id === selected.id ? { ...item, ...payload } : item)))
      setToast({ type: 'success', message: 'Employee updated successfully' })
    } else {
      setRows((prev) => [{ id: `emp-${Date.now()}`, createdAt: now, ...payload }, ...prev])
      setToast({ type: 'success', message: 'Employee created successfully' })
    }

    setFormOpen(false)
    setSelected(null)
  }

  const onToggleStatus = (row) => {
    const nextStatus = row.status === 'active' ? 'inactive' : 'active'
    setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() } : item)))
    setToast({ type: 'success', message: `Employee ${nextStatus === 'active' ? 'activated' : 'deactivated'}` })
  }

  const onDelete = () => {
    if (!selected?.id) return
    setRows((prev) => prev.filter((item) => item.id !== selected.id))
    setConfirmOpen(false)
    setSelected(null)
    setToast({ type: 'success', message: 'Employee deleted successfully' })
  }

  const exportCsv = () => {
    const headers = ['Employee ID', 'Name', 'Email', 'Phone', 'Department', 'Manager', 'Designation', 'Status', 'Joining Date']
    const lines = filteredRows.map((row) => [
      row.employeeId,
      row.name,
      row.email,
      row.phone,
      departmentMap[row.departmentId] || '-',
      managerMap[row.managerId] || '-',
      row.designation,
      row.status,
      row.joiningDate
    ])
    const csv = [headers, ...lines]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `employees-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const content = (
    <>
      {!embedded ? (
        <PageHeader
          title={title}
          description="Manage employee profiles, assignments, and lifecycle for your company."
          breadcrumb={breadcrumb}
          primaryActionLabel="Add Employee"
          onPrimaryAction={openAdd}
        />
      ) : null}

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="stats-grid stats-grid-4">
          <div className="stat-card"><p>Total Employees</p><h3>{stats.total}</h3></div>
          <div className="stat-card"><p>Active Employees</p><h3>{stats.active}</h3></div>
          <div className="stat-card"><p>Inactive Employees</p><h3>{stats.inactive}</h3></div>
          <div className="stat-card"><p>Departments Covered</p><h3>{stats.departments}</h3></div>
        </div>
      </div>

      <div className="panel filters-panel employee-filter-panel">
        <div className="filters-row admin-filters-grid employee-filters-grid">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={searchDraft} onChange={setSearchDraft} placeholder="Search by employee ID, name, email, phone" />
          </div>

          <FilterDropdown
            label="Department"
            value={departmentFilter}
            onChange={(value) => {
              setDepartmentFilter(value)
              setManagerFilter('all')
            }}
            options={[{ value: 'all', label: 'All Departments' }, ...DEPARTMENTS.map((item) => ({ value: item.id, label: item.name }))]}
          />

          <FilterDropdown
            label="Manager"
            value={managerFilter}
            onChange={setManagerFilter}
            options={[{ value: 'all', label: 'All Managers' }, ...visibleManagers.map((item) => ({ value: item.id, label: item.name }))]}
          />

          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          />
        </div>

        <div className="actions-row employee-filter-actions" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={() => setSearchQuery(searchDraft)}>Apply Search</Button>
          <Button variant="ghost" onClick={() => {
            setSearchDraft('')
            setSearchQuery('')
            setDepartmentFilter('all')
            setManagerFilter('all')
            setStatusFilter('all')
          }}><RefreshCw size={14} /> Reset Filters</Button>
          <Button variant="ghost" onClick={exportCsv}><Download size={14} /> Export</Button>
        </div>
      </div>

      <div className="panel employee-records-panel">
        <div className="panel-head">
          <h3>Employee Records</h3>
        </div>

        {loading ? null : filteredRows.length === 0 ? (
          <EmptyState title="No employees found" description="Adjust filters or add a new employee." />
        ) : (
          <div className="table-wrap employee-records-table">
            <div className="table-meta"><p>{filteredRows.length} records</p></div>
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Manager</th>
                  <th>Status</th>
                  <th>Joining Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.employeeId}</td>
                    <td>{row.name}</td>
                    <td>{row.email}</td>
                    <td>{departmentMap[row.departmentId] || '-'}</td>
                    <td>{managerMap[row.managerId] || '-'}</td>
                    <td><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                    <td>{formatDate(row.joiningDate)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="text-btn action-view" onClick={() => { setSelected(row); setProfileOpen(true) }}>View</button>
                        <button className="text-btn action-edit" onClick={() => { setPendingEditRow(row); setEditConfirmOpen(true) }}>Edit</button>
                        <button className="text-btn action-toggle" onClick={() => onToggleStatus(row)}>{row.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                        <button className="text-btn danger action-delete" onClick={() => { setSelected(row); setConfirmOpen(true) }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={formOpen} title={selected ? 'Edit Employee' : 'Add Employee'} onClose={() => setFormOpen(false)}>
        <form className="modal-form company-form-modal" onSubmit={onSubmit}>
          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Employee Info</h4>
              <p>Basic identity and contact details for employee record.</p>
            </div>
            <div className="form-grid company-form-grid">
              <FormInput label="Employee ID" value={form.employeeId} onChange={(e) => setForm((prev) => ({ ...prev, employeeId: e.target.value }))} />
              <FormInput label="Full Name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
              {formErrors.employeeId ? <p className="error">{formErrors.employeeId}</p> : null}
              {formErrors.name ? <p className="error">{formErrors.name}</p> : null}

              <FormInput label="Work Email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
              <FormInput label="Phone Number" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
              {formErrors.email ? <p className="error">{formErrors.email}</p> : null}
              {formErrors.phone ? <p className="error">{formErrors.phone}</p> : null}

              <FilterDropdown
                label="Gender"
                value={form.gender}
                onChange={(value) => setForm((prev) => ({ ...prev, gender: value }))}
                options={[
                  { value: '', label: 'Select Gender' },
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' }
                ]}
              />
              <FormInput label="Address" value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
            </div>
          </div>

          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Work Assignment</h4>
              <p>Department, manager, designation and joining details.</p>
            </div>
            <div className="form-grid company-form-grid">
              <FilterDropdown
                label="Department"
                value={form.departmentId}
                onChange={(value) => setForm((prev) => ({ ...prev, departmentId: value, managerId: '' }))}
                options={[{ value: '', label: 'Select Department' }, ...DEPARTMENTS.map((item) => ({ value: item.id, label: item.name }))]}
              />
              <FilterDropdown
                label="Manager"
                value={form.managerId}
                onChange={(value) => setForm((prev) => ({ ...prev, managerId: value }))}
                options={[
                  { value: '', label: 'Select Manager' },
                  ...MANAGERS.filter((item) => !form.departmentId || item.departmentId === form.departmentId).map((item) => ({ value: item.id, label: item.name }))
                ]}
              />
              {formErrors.departmentId ? <p className="error">{formErrors.departmentId}</p> : null}
              {formErrors.managerId ? <p className="error">{formErrors.managerId}</p> : null}

              <FormInput label="Designation" value={form.designation} onChange={(e) => setForm((prev) => ({ ...prev, designation: e.target.value }))} />
              <FormInput label="Joining Date" type="date" value={form.joiningDate} onChange={(e) => setForm((prev) => ({ ...prev, joiningDate: e.target.value }))} />
              {formErrors.designation ? <p className="error">{formErrors.designation}</p> : null}
              {formErrors.joiningDate ? <p className="error">{formErrors.joiningDate}</p> : null}
            </div>
          </div>

          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Account Controls</h4>
              <p>Set current employment status for access and workflows.</p>
            </div>
            <div className="form-grid company-form-grid">
              <FilterDropdown
                label="Status"
                value={form.status}
                onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
                options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
              />
            </div>
          </div>

          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Bank Details</h4>
              <p>Add account and bank information for payroll records.</p>
            </div>
            <div className="form-grid company-form-grid">
              <FormInput label="Bank Name" value={form.bankName} onChange={(e) => setForm((prev) => ({ ...prev, bankName: e.target.value }))} />
              <FormInput label="Account Holder" value={form.accountHolder} onChange={(e) => setForm((prev) => ({ ...prev, accountHolder: e.target.value }))} />
              <FormInput label="Account Number" value={form.accountNumber} onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value }))} />
              <FormInput label="IFSC" value={form.ifsc} onChange={(e) => setForm((prev) => ({ ...prev, ifsc: e.target.value }))} />
            </div>
          </div>

          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Emergency Contact</h4>
              <p>Keep emergency contact details for immediate communication.</p>
            </div>
            <div className="form-grid company-form-grid">
              <FormInput label="Emergency Name" value={form.emergencyName} onChange={(e) => setForm((prev) => ({ ...prev, emergencyName: e.target.value }))} />
              <FormInput label="Emergency Relation" value={form.emergencyRelation} onChange={(e) => setForm((prev) => ({ ...prev, emergencyRelation: e.target.value }))} />
              <FormInput label="Emergency Phone" value={form.emergencyPhone} onChange={(e) => setForm((prev) => ({ ...prev, emergencyPhone: e.target.value }))} />
            </div>
          </div>

          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit">{selected ? 'Save Changes' : 'Create Employee'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={profileOpen} title={`Employee Profile - ${selected?.name || ''}`} onClose={() => setProfileOpen(false)}>
        {!selected ? null : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Employee ID:</strong> <span>{selected.employeeId}</span></div>
            <div className="inline-action-card"><strong>Name:</strong> <span>{selected.name}</span></div>
            <div className="inline-action-card"><strong>Email:</strong> <span>{selected.email}</span></div>
            <div className="inline-action-card"><strong>Phone:</strong> <span>{selected.phone}</span></div>
            <div className="inline-action-card"><strong>Address:</strong> <span>{selected.address || '-'}</span></div>
            <div className="inline-action-card"><strong>Gender:</strong> <span>{selected.gender || '-'}</span></div>
            <div className="inline-action-card"><strong>Department:</strong> <span>{departmentMap[selected.departmentId] || '-'}</span></div>
            <div className="inline-action-card"><strong>Department ID:</strong> <span>{selected.departmentId || '-'}</span></div>
            <div className="inline-action-card"><strong>Manager:</strong> <span>{managerMap[selected.managerId] || '-'}</span></div>
            <div className="inline-action-card"><strong>Manager ID:</strong> <span>{selected.managerId || '-'}</span></div>
            <div className="inline-action-card"><strong>Designation:</strong> <span>{selected.designation}</span></div>
            <div className="inline-action-card"><strong>Joining Date:</strong> <span>{formatDate(selected.joiningDate)}</span></div>
            <div className="inline-action-card"><strong>Bank Name:</strong> <span>{selected.bankName || '-'}</span></div>
            <div className="inline-action-card"><strong>Account Holder:</strong> <span>{selected.accountHolder || '-'}</span></div>
            <div className="inline-action-card"><strong>Account Number:</strong> <span>{selected.accountNumber || '-'}</span></div>
            <div className="inline-action-card"><strong>IFSC:</strong> <span>{selected.ifsc || '-'}</span></div>
            <div className="inline-action-card"><strong>Emergency Name:</strong> <span>{selected.emergencyName || '-'}</span></div>
            <div className="inline-action-card"><strong>Emergency Relation:</strong> <span>{selected.emergencyRelation || '-'}</span></div>
            <div className="inline-action-card"><strong>Emergency Phone:</strong> <span>{selected.emergencyPhone || '-'}</span></div>
            <div className="inline-action-card"><strong>Status:</strong> <span>{selected.status}</span></div>
            <div className="inline-action-card"><strong>Last Updated:</strong> <span>{formatDate(selected.updatedAt)}</span></div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={editConfirmOpen}
        title="Edit Employee"
        message={`Edit details for ${pendingEditRow?.name || 'this employee'}?`}
        onCancel={() => setEditConfirmOpen(false)}
        onConfirm={() => {
          if (pendingEditRow) openEdit(pendingEditRow)
          setEditConfirmOpen(false)
          setPendingEditRow(null)
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Employee"
        message={`Delete ${selected?.name || 'this employee'} from employee records?`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onDelete}
      />
    </>
  )

  if (embedded) return <div className="employee-management-embedded">{content}</div>

  return (
    <section className="section-layout">
      {content}
    </section>
  )
}

export default CompanyAdminEmployeesPage

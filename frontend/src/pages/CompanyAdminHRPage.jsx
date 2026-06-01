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

const STORAGE_KEY = 'company_admin_hr_management_v4'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DEPARTMENTS = [
  { id: 'hr-ops', name: 'HR Operations' },
  { id: 'recruitment', name: 'Recruitment' },
  { id: 'lnd', name: 'L&D' },
  { id: 'payroll', name: 'Payroll' }
]

const ROLES = ['HR Admin', 'Recruitment Lead', 'Payroll Officer', 'L&D Coordinator']

const seedHrRows = [
  {
    id: 'hr-301',
    name: 'Anita Sharma',
    email: 'anita.hr@acme.com',
    loginEmail: 'anita.hr.login@acme.com',
    phone: '+91-9876543210',
    employeeCode: 'HR-001',
    designation: 'HR Executive',
    departmentId: 'hr-ops',
    role: 'HR Admin',
    status: 'active',
    password: 'Hr@123456',
    joiningDate: '2026-04-15',
    updatedAt: '2026-06-01T10:40:00.000Z'
  }
]

const initialForm = {
  name: '',
  email: '',
  loginEmail: '',
  password: '',
  confirmPassword: '',
  phone: '',
  employeeCode: '',
  designation: '',
  departmentId: '',
  role: '',
  status: 'active',
  joiningDate: ''
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

function CompanyAdminHRPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const [searchDraft, setSearchDraft] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editConfirmOpen, setEditConfirmOpen] = useState(false)

  const [selected, setSelected] = useState(null)
  const [pendingEditRow, setPendingEditRow] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})
  const [roleValue, setRoleValue] = useState('')

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
    } catch (_error) {
      // Fallback to seed rows when storage is invalid.
    }
    setRows(seedHrRows)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (loading) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
  }, [rows, loading])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const departmentMap = useMemo(() => Object.fromEntries(DEPARTMENTS.map((dept) => [dept.id, dept.name])), [])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const text = `${row.name} ${row.email} ${row.phone} ${row.role}`.toLowerCase()
      const searchOk = searchQuery.trim() ? text.includes(searchQuery.trim().toLowerCase()) : true
      const deptOk = departmentFilter === 'all' ? true : row.departmentId === departmentFilter
      const statusOk = statusFilter === 'all' ? true : row.status === statusFilter
      return searchOk && deptOk && statusOk
    })
  }, [rows, searchQuery, departmentFilter, statusFilter])

  const stats = useMemo(() => {
    const total = rows.length
    const active = rows.filter((item) => item.status === 'active').length
    const inactive = rows.filter((item) => item.status === 'inactive').length
    const roleAssigned = rows.filter((item) => item.role?.trim()).length
    return { total, active, inactive, roleAssigned }
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
      name: row.name,
      email: row.email,
      loginEmail: row.loginEmail || '',
      password: '',
      confirmPassword: '',
      phone: row.phone,
      employeeCode: row.employeeCode || '',
      designation: row.designation || '',
      departmentId: row.departmentId,
      role: row.role,
      status: row.status,
      joiningDate: row.joiningDate
    })
    setFormErrors({})
    setFormOpen(true)
  }

  const openView = (row) => {
    setSelected(row)
    setViewOpen(true)
  }

  const openAssignRole = (row) => {
    setSelected(row)
    setRoleValue(row.role || '')
    setRoleOpen(true)
  }

  const validateForm = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'HR name is required'
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!EMAIL_REGEX.test(form.email.trim())) next.email = 'Enter a valid email'
    if (!form.loginEmail.trim()) next.loginEmail = 'Login email is required'
    else if (!EMAIL_REGEX.test(form.loginEmail.trim())) next.loginEmail = 'Enter a valid login email'
    if (!form.phone.trim()) next.phone = 'Phone is required'
    if (!form.employeeCode.trim()) next.employeeCode = 'Employee code is required'
    if (!form.designation.trim()) next.designation = 'Designation is required'
    if (!form.departmentId) next.departmentId = 'Department is required'
    if (!form.joiningDate.trim()) next.joiningDate = 'Joining date is required'
    if (!selected && !form.password.trim()) next.password = 'Password is required for new HR'
    if (!selected && form.password.trim().length < 8) next.password = 'Password must be at least 8 characters'
    if (!selected && form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match'

    const duplicateEmail = rows.some((item) => item.email.toLowerCase() === form.email.trim().toLowerCase() && item.id !== selected?.id)
    if (duplicateEmail) next.email = 'This email is already used by another HR'
    const duplicateLoginEmail = rows.some((item) => (item.loginEmail || '').toLowerCase() === form.loginEmail.trim().toLowerCase() && item.id !== selected?.id)
    if (duplicateLoginEmail) next.loginEmail = 'This login email is already used by another HR'

    const duplicatePhone = rows.some((item) => item.phone === form.phone.trim() && item.id !== selected?.id)
    if (duplicatePhone) next.phone = 'This phone number is already used by another HR'
    const duplicateCode = rows.some((item) => (item.employeeCode || '').toLowerCase() === form.employeeCode.trim().toLowerCase() && item.id !== selected?.id)
    if (duplicateCode) next.employeeCode = 'This employee code is already used by another HR'

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
            loginEmail: form.loginEmail.trim().toLowerCase(),
            phone: form.phone.trim(),
            employeeCode: form.employeeCode.trim().toUpperCase(),
            designation: form.designation.trim(),
            departmentId: form.departmentId,
            role: form.role.trim(),
            status: form.status,
            password: form.password.trim() ? form.password.trim() : item.password,
            joiningDate: form.joiningDate.trim(),
            updatedAt: now
          }
        : item)))
      setToast({ type: 'success', message: 'HR record updated successfully' })
    } else {
      setRows((prev) => [
        {
          id: `hr-${Date.now()}`,
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          loginEmail: form.loginEmail.trim().toLowerCase(),
          phone: form.phone.trim(),
          employeeCode: form.employeeCode.trim().toUpperCase(),
          designation: form.designation.trim(),
          departmentId: form.departmentId,
          role: form.role.trim(),
          status: form.status,
          password: form.password.trim(),
          joiningDate: form.joiningDate.trim(),
          updatedAt: now
        },
        ...prev
      ])
      setToast({ type: 'success', message: 'HR record created successfully' })
    }

    setFormOpen(false)
    setSelected(null)
  }

  const onToggleStatus = (row) => {
    const nextStatus = row.status === 'active' ? 'inactive' : 'active'
    setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() } : item)))
    setToast({ type: 'success', message: `HR ${nextStatus === 'active' ? 'activated' : 'deactivated'}` })
  }

  const onSaveRole = () => {
    if (!selected?.id) return
    setRows((prev) => prev.map((item) => (item.id === selected.id ? { ...item, role: roleValue, updatedAt: new Date().toISOString() } : item)))
    setRoleOpen(false)
    setToast({ type: 'success', message: 'Role assignment updated' })
  }

  const onDelete = () => {
    if (!selected?.id) return
    setRows((prev) => prev.filter((item) => item.id !== selected.id))
    setConfirmOpen(false)
    setToast({ type: 'success', message: 'HR record deleted successfully' })
    setSelected(null)
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="HR Management"
        description="Manage HR records, roles, and account status with clear actions."
        breadcrumb={['Company Admin', 'HR Management']}
        primaryActionLabel="Add HR"
        onPrimaryAction={openAdd}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="stats-grid stats-grid-4">
          <div className="stat-card"><p>Total HR</p><h3>{stats.total}</h3></div>
          <div className="stat-card"><p>Active HR</p><h3>{stats.active}</h3></div>
          <div className="stat-card"><p>Inactive HR</p><h3>{stats.inactive}</h3></div>
          <div className="stat-card"><p>Roles Assigned</p><h3>{stats.roleAssigned}</h3></div>
        </div>
      </div>

      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={searchDraft} onChange={setSearchDraft} placeholder="Search by HR name, email, phone, or role" />
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
          <h3>HR Records</h3>
        </div>

        {loading ? null : filteredRows.length === 0 ? (
          <EmptyState title="No HR records found" description="Try changing search or filter criteria." />
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
                  <th>Role</th>
                  <th>Status</th>
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
                    <td>{row.role || '-'}</td>
                    <td><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                    <td>{formatDateTime(row.updatedAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="text-btn" onClick={() => openView(row)}>View</button>
                        <button className="text-btn" onClick={() => { setPendingEditRow(row); setEditConfirmOpen(true) }}>Edit</button>
                        <button className="text-btn" onClick={() => openAssignRole(row)}>Assign Role</button>
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

      <Modal open={formOpen} title={selected ? 'Edit HR' : 'Add HR'} onClose={() => setFormOpen(false)}>
        <form className="modal-form" onSubmit={onSubmit}>
          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>HR Info</h4>
              <p>Capture HR profile and organization mapping details.</p>
            </div>
            <div className="form-grid company-form-grid">
              <FormInput label="HR Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
              <FormInput label="Work Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
              {formErrors.name ? <p className="error">{formErrors.name}</p> : null}
              {formErrors.email ? <p className="error">{formErrors.email}</p> : null}
            </div>
          </div>

          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Work Details</h4>
              <p>Assign HR code, department, role and joining details.</p>
            </div>
            <div className="form-grid company-form-grid">
              <FormInput label="Employee Code" value={form.employeeCode} onChange={(event) => setForm((prev) => ({ ...prev, employeeCode: event.target.value }))} />
              <FormInput label="Phone Number" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
              {formErrors.employeeCode ? <p className="error">{formErrors.employeeCode}</p> : null}
              {formErrors.phone ? <p className="error">{formErrors.phone}</p> : null}

              <FormInput label="Designation" value={form.designation} onChange={(event) => setForm((prev) => ({ ...prev, designation: event.target.value }))} />
              <FilterDropdown
                label="Department"
                value={form.departmentId}
                onChange={(value) => setForm((prev) => ({ ...prev, departmentId: value }))}
                options={[{ value: '', label: 'Select Department' }, ...DEPARTMENTS.map((dept) => ({ value: dept.id, label: dept.name }))]}
              />
              {formErrors.designation ? <p className="error">{formErrors.designation}</p> : null}
              {formErrors.departmentId ? <p className="error">{formErrors.departmentId}</p> : null}

              <FilterDropdown
                label="Role"
                value={form.role}
                onChange={(value) => setForm((prev) => ({ ...prev, role: value }))}
                options={[{ value: '', label: 'Select Role' }, ...ROLES.map((role) => ({ value: role, label: role }))]}
              />
              <FormInput
                label="Joining Date (DD-MM-YYYY)"
                value={form.joiningDate}
                onChange={(event) => setForm((prev) => ({ ...prev, joiningDate: event.target.value }))}
              />
              {formErrors.joiningDate ? <p className="error">{formErrors.joiningDate}</p> : null}
            </div>
          </div>

          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Account Setup</h4>
              <p>Create login credentials and access status controls.</p>
            </div>
            <div className="form-grid company-form-grid">
              <FormInput label="Login Email (ID)" value={form.loginEmail} onChange={(event) => setForm((prev) => ({ ...prev, loginEmail: event.target.value }))} />
              <FilterDropdown
                label="Status"
                value={form.status}
                onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
                options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
              />
              {formErrors.loginEmail ? <p className="error">{formErrors.loginEmail}</p> : null}

              <FormInput
                label={selected ? 'New Password (Optional)' : 'Password'}
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              />
              <FormInput
                label={selected ? 'Confirm New Password' : 'Confirm Password'}
                type="password"
                value={form.confirmPassword}
                onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              />
              {formErrors.password ? <p className="error">{formErrors.password}</p> : null}
              {formErrors.confirmPassword ? <p className="error">{formErrors.confirmPassword}</p> : null}
            </div>
          </div>

          <Button type="submit">{selected ? 'Save Changes' : 'Create HR'}</Button>
        </form>
      </Modal>

      <Modal open={viewOpen} title={`HR Details - ${selected?.name || ''}`} onClose={() => setViewOpen(false)}>
        <div className="modal-form">
          <p><strong>Name:</strong> {selected?.name || '-'}</p>
          <p><strong>Email:</strong> {selected?.email || '-'}</p>
          <p><strong>Phone:</strong> {selected?.phone || '-'}</p>
          <p><strong>Employee Code:</strong> {selected?.employeeCode || '-'}</p>
          <p><strong>Designation:</strong> {selected?.designation || '-'}</p>
          <p><strong>Login ID:</strong> {selected?.loginEmail || '-'}</p>
          <p><strong>Department:</strong> {departmentMap[selected?.departmentId] || '-'}</p>
          <p><strong>Role:</strong> {selected?.role || '-'}</p>
          <p><strong>Joining Date:</strong> {selected?.joiningDate || '-'}</p>
          <p><strong>Status:</strong> {selected?.status || '-'}</p>
          <p><strong>Updated:</strong> {formatDateTime(selected?.updatedAt)}</p>
        </div>
      </Modal>

      <Modal open={roleOpen} title={`Assign Role - ${selected?.name || ''}`} onClose={() => setRoleOpen(false)}>
        <div className="modal-form">
          <FilterDropdown
            label="Role"
            value={roleValue}
            onChange={setRoleValue}
            options={[{ value: '', label: 'Select Role' }, ...ROLES.map((role) => ({ value: role, label: role }))]}
          />
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setRoleOpen(false)}>Cancel</Button>
            <Button onClick={onSaveRole}>Save Role</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={editConfirmOpen}
        title="Edit HR Record"
        message={`Edit details for ${pendingEditRow?.name || 'this HR record'}?`}
        onCancel={() => setEditConfirmOpen(false)}
        onConfirm={() => {
          if (pendingEditRow) openEdit(pendingEditRow)
          setEditConfirmOpen(false)
          setPendingEditRow(null)
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete HR Record"
        message={`Are you sure you want to delete ${selected?.name || 'this HR record'}?`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onDelete}
      />
    </section>
  )
}

export default CompanyAdminHRPage

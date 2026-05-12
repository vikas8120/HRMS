import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Download } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import SearchBar from '../components/ui/SearchBar'
import FilterDropdown from '../components/ui/FilterDropdown'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import FormInput from '../components/ui/FormInput'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import EmptyState from '../components/ui/EmptyState'
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeeStatus,
  getDepartments,
  getManagers,
  getHRList
} from '../api/adminEmployeeApi'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  gender: '',
  dob: '',
  joiningDate: '',
  departmentId: '',
  managerId: '',
  hrId: '',
  designation: '',
  salary: '',
  address: '',
  status: 'active'
}

function CompanyAdminEmployeesPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [managerFilter, setManagerFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [error, setError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})
  const [profileData, setProfileData] = useState(null)

  const [departments, setDepartments] = useState([])
  const [managers, setManagers] = useState([])
  const [hrs, setHrs] = useState([])

  const [toast, setToast] = useState(null)

  const deptMap = useMemo(() => Object.fromEntries(departments.map((d) => [String(d.id || d._id), d.name || 'Department'])), [departments])
  const managerMap = useMemo(() => Object.fromEntries(managers.map((m) => [String(m.id || m._id), m.name || 'Manager'])), [managers])
  const hrMap = useMemo(() => Object.fromEntries(hrs.map((h) => [String(h.id || h._id), h.name || 'HR'])), [hrs])

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  const loadMeta = async () => {
    try {
      const [deptRes, mgrRes, hrRes] = await Promise.all([
        getDepartments({ limit: 300 }),
        getManagers({ limit: 300, status: 'all' }),
        getHRList({ limit: 300, status: 'all' })
      ])
      setDepartments(deptRes?.data || [])
      setManagers(mgrRes?.data || [])
      setHrs(hrRes?.data || [])
    } catch (_err) {
      setDepartments([])
      setManagers([])
      setHrs([])
    }
  }

  const loadEmployees = async ({
    pageArg = page,
    searchArg = search,
    statusArg = status,
    departmentArg = departmentFilter,
    managerArg = managerFilter,
    keepLoading = false
  } = {}) => {
    if (!keepLoading) setLoading(true)
    setError('')

    try {
      const res = await getEmployees({
        page: pageArg,
        limit: 10,
        search: searchArg,
        status: statusArg,
        departmentId: departmentArg,
        managerId: managerArg
      })

      setRows(res?.data || [])
      setPagination(res?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load employees')
      setRows([])
    } finally {
      if (!keepLoading) setLoading(false)
    }
  }

  useEffect(() => {
    loadMeta()
    loadEmployees({ pageArg: page })
  }, [page])

  const resetForm = () => {
    setForm(initialForm)
    setFormErrors({})
  }

  const openAdd = () => {
    setSelected(null)
    resetForm()
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setSelected(row)
    setForm({
      name: row.name || '',
      email: row.email || '',
      phone: row.phone || '',
      password: '',
      gender: row.gender || '',
      dob: row.dob ? String(row.dob).slice(0, 10) : '',
      joiningDate: row.joiningDate ? String(row.joiningDate).slice(0, 10) : '',
      departmentId: row.departmentId || '',
      managerId: row.managerId || '',
      hrId: row.hrId || '',
      designation: row.designation || '',
      salary: row.salary != null ? String(row.salary) : '',
      address: row.address || '',
      status: row.status || 'active'
    })
    setFormErrors({})
    setFormOpen(true)
  }

  const openProfile = async (row) => {
    setSelected(row)
    setProfileData(null)
    setProfileOpen(true)
    try {
      const res = await getEmployeeById(row.id)
      setProfileData(res?.data || null)
    } catch (_err) {
      setProfileData(null)
    }
  }

  const validateForm = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!EMAIL_REGEX.test(form.email.trim())) next.email = 'Invalid email format'
    if (!form.phone.trim()) next.phone = 'Phone is required'
    if (!selected && !form.password.trim()) next.password = 'Password is required'
    if (!selected && form.password.trim().length > 0 && form.password.trim().length < 6) next.password = 'Password must be at least 6 characters'
    if (!form.joiningDate) next.joiningDate = 'Joining date is required'
    if (form.salary && Number(form.salary) < 0) next.salary = 'Salary must be positive'
    setFormErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      if (selected) {
        const res = await updateEmployee(selected.id, {
          name: form.name.trim(),
          phone: form.phone.trim(),
          gender: form.gender || '',
          dob: form.dob || null,
          joiningDate: form.joiningDate || null,
          departmentId: form.departmentId || null,
          managerId: form.managerId || null,
          hrId: form.hrId || null,
          designation: form.designation || '',
          salary: form.salary === '' ? 0 : Number(form.salary),
          address: form.address || '',
          status: form.status
        })
        const updated = res?.data
        if (!updated?.id) throw new Error('Database update confirmation not received')
        setRows((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        setToast({ type: 'success', message: `Saved in database successfully (ID: ${updated.id})` })
      } else {
        const res = await createEmployee({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          gender: form.gender || '',
          dob: form.dob || null,
          joiningDate: form.joiningDate || null,
          departmentId: form.departmentId || null,
          managerId: form.managerId || null,
          hrId: form.hrId || null,
          designation: form.designation || '',
          salary: form.salary === '' ? 0 : Number(form.salary),
          address: form.address || '',
          status: form.status
        })

        const created = res?.data
        if (!created?.id) throw new Error('Database save confirmation not received')
        setRows((prev) => [created, ...prev].slice(0, 10))
        setPagination((prev) => ({ ...prev, total: (prev.total || 0) + 1 }))
        setToast({ type: 'success', message: `Saved in database successfully (ID: ${created.id})` })
      }

      setFormOpen(false)
      resetForm()
      await loadEmployees({ pageArg: 1, keepLoading: true })
      setPage(1)
    } catch (err) {
      setToast({ type: 'error', message: `Not saved in database: ${err?.response?.data?.message || err?.message || 'Operation failed'}` })
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async () => {
    if (!selected?.id) return
    setSubmitting(true)
    try {
      await deleteEmployee(selected.id)
      setRows((prev) => prev.filter((row) => row.id !== selected.id))
      setPagination((prev) => ({ ...prev, total: Math.max((prev.total || 1) - 1, 0) }))
      setToast({ type: 'success', message: 'Employee deleted successfully' })
      setConfirmOpen(false)
      setSelected(null)
      await loadEmployees({ pageArg: page, keepLoading: true })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Delete failed' })
    } finally {
      setSubmitting(false)
    }
  }

  const onToggleStatus = async (row) => {
    const next = row.status === 'active' ? 'inactive' : 'active'
    try {
      const res = await updateEmployeeStatus(row.id, next)
      const updated = res?.data
      setRows((prev) => prev.map((item) => (item.id === row.id ? updated : item)))
      setToast({ type: 'success', message: `Employee ${next === 'active' ? 'activated' : 'deactivated'} successfully` })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Status update failed' })
    }
  }

  const onApplySearch = async () => {
    setPage(1)
    await loadEmployees({ pageArg: 1, searchArg: search, statusArg: status, departmentArg: departmentFilter, managerArg: managerFilter })
  }

  const onStatusChange = async (value) => {
    setStatus(value)
    setPage(1)
    await loadEmployees({ pageArg: 1, searchArg: search, statusArg: value, departmentArg: departmentFilter, managerArg: managerFilter })
  }

  const onDepartmentChange = async (value) => {
    setDepartmentFilter(value)
    setPage(1)
    await loadEmployees({ pageArg: 1, searchArg: search, statusArg: status, departmentArg: value, managerArg: managerFilter })
  }

  const onManagerChange = async (value) => {
    setManagerFilter(value)
    setPage(1)
    await loadEmployees({ pageArg: 1, searchArg: search, statusArg: status, departmentArg: departmentFilter, managerArg: value })
  }

  const displayRows = useMemo(
    () => rows.map((item) => ({
      ...item,
      departmentName: deptMap[String(item.departmentId || '')] || '-',
      managerName: managerMap[String(item.managerId || '')] || '-',
      createdDate: item.createdAt ? String(item.createdAt).slice(0, 10) : '-'
    })),
    [rows, deptMap, managerMap]
  )

  const exportCsv = () => {
    const headers = ['Employee ID', 'Name', 'Email', 'Phone', 'Department', 'Manager', 'Status', 'Created Date']
    const lines = displayRows.map((row) => [
      row.employeeId || '',
      row.name || '',
      row.email || '',
      row.phone || '',
      row.departmentName || '',
      row.managerName || '',
      row.status || '',
      row.createdDate || ''
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

  return (
    <section className="section-layout">
      <PageHeader
        title="Employees"
        description="Manage employee profiles, assignments, and lifecycle for your company."
        breadcrumb={['Company Admin', 'Employees']}
        primaryActionLabel="Add Employee"
        onPrimaryAction={() => openAdd()}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by employee ID, name, or email" />
          </div>

          <FilterDropdown
            label="Department"
            value={departmentFilter}
            onChange={onDepartmentChange}
            options={[{ value: 'all', label: 'All Departments' }, ...departments.map((d) => ({ value: String(d.id || d._id), label: d.name || 'Department' }))]}
          />

          <FilterDropdown
            label="Manager"
            value={managerFilter}
            onChange={onManagerChange}
            options={[{ value: 'all', label: 'All Managers' }, ...managers.map((m) => ({ value: String(m.id || m._id), label: m.name || 'Manager' }))]}
          />

          <FilterDropdown
            label="Status"
            value={status}
            onChange={onStatusChange}
            options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          />
        </div>

        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={onApplySearch}>Apply Search</Button>
          <Button variant="ghost" onClick={() => loadEmployees({ pageArg: page })}><RefreshCw size={14} /> Refresh</Button>
          <Button variant="ghost" onClick={exportCsv}><Download size={14} /> Export</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Employee Records</h3>
          <div className="actions-row"><Button onClick={openAdd}>Add Employee</Button></div>
        </div>

        {loading ? <LoadingSkeleton rows={8} /> : error ? (
          <EmptyState title="Unable to load employees" description={error} />
        ) : displayRows.length === 0 ? (
          <EmptyState title="No employees found" description="Add an employee to get started." />
        ) : (
          <div className="table-wrap">
            <div className="table-meta"><p>{pagination.total || displayRows.length} records</p></div>
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Manager</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.employeeId || '-'}</td>
                    <td>{row.name}</td>
                    <td>{row.email}</td>
                    <td>{row.departmentName}</td>
                    <td>{row.managerName}</td>
                    <td><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                    <td>{row.createdDate}</td>
                    <td>
                      <div className="table-actions">
                        <button className="text-btn" onClick={() => openProfile(row)}>View</button>
                        <button className="text-btn" onClick={() => openEdit(row)}>Edit</button>
                        <button className="text-btn" onClick={() => onToggleStatus(row)}>{row.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                        <button className="text-btn danger" onClick={() => { setSelected(row); setConfirmOpen(true) }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination-row">
              <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>Previous</Button>
              <span>Page {pagination.page} of {Math.max(pagination.totalPages || 1, 1)}</span>
              <Button variant="ghost" disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage((prev) => prev + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <Modal open={formOpen} title={`${selected ? 'Edit' : 'Add'} Employee`} onClose={() => { if (!submitting) setFormOpen(false) }}>
        <form className="modal-form" onSubmit={onSubmit}>
          <FormInput label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Enter name" />
          {formErrors.name ? <p className="error">{formErrors.name}</p> : null}

          <FormInput label="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Enter email" disabled={Boolean(selected)} />
          {formErrors.email ? <p className="error">{formErrors.email}</p> : null}

          <FormInput label="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Enter phone" />
          {formErrors.phone ? <p className="error">{formErrors.phone}</p> : null}

          {!selected ? (
            <>
              <FormInput label="Password" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="Enter password" />
              {formErrors.password ? <p className="error">{formErrors.password}</p> : null}
            </>
          ) : null}

          <FilterDropdown label="Gender" value={form.gender} onChange={(value) => setForm((p) => ({ ...p, gender: value }))} options={[{ value: '', label: 'Select Gender' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} />

          <FormInput label="DOB" type="date" value={form.dob} onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))} />

          <FormInput label="Joining Date" type="date" value={form.joiningDate} onChange={(e) => setForm((p) => ({ ...p, joiningDate: e.target.value }))} />
          {formErrors.joiningDate ? <p className="error">{formErrors.joiningDate}</p> : null}

          <FilterDropdown label="Department" value={form.departmentId} onChange={(value) => setForm((p) => ({ ...p, departmentId: value }))} options={[{ value: '', label: 'Unassigned' }, ...departments.map((d) => ({ value: String(d.id || d._id), label: d.name || 'Department' }))]} />

          <FilterDropdown label="Manager" value={form.managerId} onChange={(value) => setForm((p) => ({ ...p, managerId: value }))} options={[{ value: '', label: 'Unassigned' }, ...managers.map((m) => ({ value: String(m.id || m._id), label: m.name || 'Manager' }))]} />

          <FilterDropdown label="HR" value={form.hrId} onChange={(value) => setForm((p) => ({ ...p, hrId: value }))} options={[{ value: '', label: 'Unassigned' }, ...hrs.map((h) => ({ value: String(h.id || h._id), label: h.name || 'HR' }))]} />

          <FormInput label="Designation" value={form.designation} onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))} placeholder="Enter designation" />

          <FormInput label="Salary" type="number" value={form.salary} onChange={(e) => setForm((p) => ({ ...p, salary: e.target.value }))} placeholder="Enter salary" />
          {formErrors.salary ? <p className="error">{formErrors.salary}</p> : null}

          <FormInput label="Address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="Enter address" />

          <FilterDropdown label="Status" value={form.status} onChange={(value) => setForm((p) => ({ ...p, status: value }))} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />

          <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
        </form>
      </Modal>

      <Modal open={profileOpen} title={`Employee Profile - ${profileData?.name || selected?.name || ''}`} onClose={() => setProfileOpen(false)}>
        {!profileData ? <LoadingSkeleton rows={4} /> : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Employee ID:</strong> <span>{profileData.employeeId || '-'}</span></div>
            <div className="inline-action-card"><strong>Name:</strong> <span>{profileData.name || '-'}</span></div>
            <div className="inline-action-card"><strong>Email:</strong> <span>{profileData.email || '-'}</span></div>
            <div className="inline-action-card"><strong>Phone:</strong> <span>{profileData.phone || '-'}</span></div>
            <div className="inline-action-card"><strong>Gender:</strong> <span>{profileData.gender || '-'}</span></div>
            <div className="inline-action-card"><strong>DOB:</strong> <span>{profileData.dob ? String(profileData.dob).slice(0, 10) : '-'}</span></div>
            <div className="inline-action-card"><strong>Joining Date:</strong> <span>{profileData.joiningDate ? String(profileData.joiningDate).slice(0, 10) : '-'}</span></div>
            <div className="inline-action-card"><strong>Department:</strong> <span>{deptMap[String(profileData.departmentId || '')] || '-'}</span></div>
            <div className="inline-action-card"><strong>Manager:</strong> <span>{managerMap[String(profileData.managerId || '')] || '-'}</span></div>
            <div className="inline-action-card"><strong>HR:</strong> <span>{hrMap[String(profileData.hrId || '')] || '-'}</span></div>
            <div className="inline-action-card"><strong>Designation:</strong> <span>{profileData.designation || '-'}</span></div>
            <div className="inline-action-card"><strong>Salary:</strong> <span>{profileData.salary ?? '-'}</span></div>
            <div className="inline-action-card"><strong>Address:</strong> <span>{profileData.address || '-'}</span></div>
            <div className="inline-action-card"><strong>Status:</strong> <span>{profileData.status || '-'}</span></div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Employee"
        message={`Are you sure you want to delete ${selected?.name || 'this employee'}?`}
        onCancel={() => { if (!submitting) setConfirmOpen(false) }}
        onConfirm={onDelete}
      />
    </section>
  )
}

export default CompanyAdminEmployeesPage

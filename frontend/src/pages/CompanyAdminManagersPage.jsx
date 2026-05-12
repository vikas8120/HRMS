import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
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
  getManagers,
  getManagerById,
  createManager,
  updateManager,
  deleteManager,
  updateManagerStatus,
  assignManagerEmployees,
  getDepartments,
  getEmployees
} from '../api/adminManagerApi'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  departmentId: '',
  status: 'active'
}

function CompanyAdminManagersPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [error, setError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [teamOpen, setTeamOpen] = useState(false)

  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})
  const [formSubmitMessage, setFormSubmitMessage] = useState('')
  const [teamRows, setTeamRows] = useState([])

  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState([])

  const [toast, setToast] = useState(null)

  const deptMap = useMemo(
    () => Object.fromEntries(departments.map((dept) => [String(dept.id || dept._id), dept.name || 'Department'])),
    [departments]
  )

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(timer)
  }, [toast])

  const loadManagers = async ({ pageArg = page, searchArg = search, statusArg = status, keepLoading = false } = {}) => {
    if (!keepLoading) setLoading(true)
    setError('')

    try {
      const res = await getManagers({ page: pageArg, limit: 10, search: searchArg, status: statusArg })
      setRows(res?.data || [])
      setPagination(res?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load managers')
      setRows([])
    } finally {
      if (!keepLoading) setLoading(false)
    }
  }

  const loadMeta = async () => {
    try {
      const [deptRes, empRes] = await Promise.all([
        getDepartments({ limit: 200 }),
        getEmployees({ limit: 500 })
      ])
      setDepartments(deptRes?.data || [])
      setEmployees(empRes?.data || [])
    } catch (_err) {
      setDepartments([])
      setEmployees([])
    }
  }

  useEffect(() => {
    loadMeta()
    loadManagers({ pageArg: page })
  }, [page])

  const resetForm = () => {
    setForm(initialForm)
    setFormErrors({})
  }

  const openAdd = () => {
    setSelected(null)
    resetForm()
    setFormSubmitMessage('')
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setSelected(row)
    setForm({
      name: row.name || '',
      email: row.email || '',
      phone: row.phone || '',
      password: '',
      departmentId: row.departmentId || '',
      status: row.status || 'active'
    })
    setFormErrors({})
    setFormSubmitMessage('')
    setFormOpen(true)
  }

  const openAssign = (row) => {
    setSelected(row)
    const ids = Array.isArray(row.assignedEmployees) ? row.assignedEmployees.map(String) : []
    setAssignedEmployeeIds(ids)
    setAssignOpen(true)
  }

  const openTeam = async (row) => {
    setSelected(row)
    setTeamRows([])
    setTeamOpen(true)
    try {
      const res = await getManagerById(row.id)
      setTeamRows(res?.data?.team || [])
    } catch (_err) {
      setTeamRows([])
    }
  }

  const validateForm = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!EMAIL_REGEX.test(form.email.trim())) next.email = 'Invalid email format'
    if (!form.phone.trim()) next.phone = 'Phone is required'
    if (!selected && !form.password.trim()) next.password = 'Password is required'
    if (!selected && form.password.trim() && form.password.trim().length < 6) next.password = 'Password must be at least 6 characters'
    setFormErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) {
      setFormSubmitMessage('Please fill all required fields correctly.')
      return
    }

    setSubmitting(true)
    setFormSubmitMessage('')
    try {
      if (selected) {
        const res = await updateManager(selected.id, {
          name: form.name.trim(),
          phone: form.phone.trim(),
          departmentId: form.departmentId || null,
          status: form.status
        })
        const updated = res?.data
        if (!updated?.id) throw new Error('Database update confirmation not received')
        setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)))
        setToast({ type: 'success', message: `Saved in database successfully (ID: ${updated.id})` })
      } else {
        const res = await createManager({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          departmentId: form.departmentId || null,
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
      setFormSubmitMessage('')
      await loadManagers({ pageArg: 1, keepLoading: true })
      setPage(1)
    } catch (err) {
      const serverMessage = err?.response?.data?.message || err?.message || 'Operation failed'
      setFormSubmitMessage(serverMessage)
      setToast({ type: 'error', message: `Not saved in database: ${serverMessage}` })
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async () => {
    if (!selected?.id) return
    setSubmitting(true)
    try {
      await deleteManager(selected.id)
      setRows((prev) => prev.filter((row) => row.id !== selected.id))
      setPagination((prev) => ({ ...prev, total: Math.max((prev.total || 1) - 1, 0) }))
      setToast({ type: 'success', message: 'Manager deleted successfully' })
      setConfirmOpen(false)
      setSelected(null)
      await loadManagers({ pageArg: page, keepLoading: true })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Delete failed' })
    } finally {
      setSubmitting(false)
    }
  }

  const onToggleStatus = async (row) => {
    const next = row.status === 'active' ? 'inactive' : 'active'
    try {
      const res = await updateManagerStatus(row.id, next)
      const updated = res?.data
      setRows((prev) => prev.map((item) => (item.id === row.id ? updated : item)))
      setToast({ type: 'success', message: `Manager ${next === 'active' ? 'activated' : 'deactivated'} successfully` })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Status update failed' })
    }
  }

  const onAssignEmployees = async () => {
    if (!selected?.id) return
    setSubmitting(true)
    try {
      const res = await assignManagerEmployees(selected.id, assignedEmployeeIds)
      const updated = res?.data
      setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)))
      setToast({ type: 'success', message: 'Employees assigned successfully' })
      setAssignOpen(false)
      setSelected(null)
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to assign employees' })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleAssigned = (employeeId) => {
    setAssignedEmployeeIds((prev) => {
      const id = String(employeeId)
      return prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    })
  }

  const onSearchApply = async () => {
    setPage(1)
    await loadManagers({ pageArg: 1, searchArg: search, statusArg: status })
  }

  const onStatusChange = async (value) => {
    setStatus(value)
    setPage(1)
    await loadManagers({ pageArg: 1, searchArg: search, statusArg: value })
  }

  const filteredRows = useMemo(() => {
    if (departmentFilter === 'all') return rows
    return rows.filter((row) => String(row.departmentId || '') === String(departmentFilter))
  }, [rows, departmentFilter])

  const displayRows = useMemo(
    () => filteredRows.map((item) => ({
      ...item,
      departmentName: deptMap[String(item.departmentId || '')] || '-',
      createdDate: item.createdAt ? String(item.createdAt).slice(0, 10) : '-'
    })),
    [filteredRows, deptMap]
  )

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

      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder="Search manager by name or email" />
          </div>

          <FilterDropdown
            label="Department"
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={[{ value: 'all', label: 'All Departments' }, ...departments.map((dept) => ({ value: String(dept.id || dept._id), label: dept.name || 'Department' }))]}
          />

          <FilterDropdown
            label="Status"
            value={status}
            onChange={onStatusChange}
            options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          />
        </div>

        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={onSearchApply}>Apply Search</Button>
          <Button variant="ghost" onClick={() => loadManagers({ pageArg: page })}><RefreshCw size={14} /> Refresh</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Manager Records</h3>
          <div className="actions-row"><Button onClick={openAdd}>Add Manager</Button></div>
        </div>

        {loading ? <LoadingSkeleton rows={7} /> : error ? (
          <EmptyState title="Unable to load managers" description={error} />
        ) : displayRows.length === 0 ? (
          <EmptyState title="No managers found" description="Add a manager to get started." />
        ) : (
          <div className="table-wrap">
            <div className="table-meta"><p>{pagination.total || displayRows.length} records</p></div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.email}</td>
                    <td>{row.phone || '-'}</td>
                    <td>{row.departmentName}</td>
                    <td><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                    <td>{row.createdDate}</td>
                    <td>
                      <div className="table-actions">
                        <button className="text-btn" onClick={() => openEdit(row)}>Edit</button>
                        <button className="text-btn" onClick={() => openAssign(row)}>Assign Employees</button>
                        <button className="text-btn" onClick={() => openTeam(row)}>View Team</button>
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

      <Modal open={formOpen} title={`${selected ? 'Edit' : 'Add'} Manager`} onClose={() => { if (!submitting) setFormOpen(false) }}>
        <form className="modal-form" onSubmit={handleSubmit}>
          {formSubmitMessage ? <p className="error">{formSubmitMessage}</p> : null}
          <FormInput label="Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Enter name" />
          {formErrors.name ? <p className="error">{formErrors.name}</p> : null}

          <FormInput label="Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="Enter email" disabled={Boolean(selected)} />
          {formErrors.email ? <p className="error">{formErrors.email}</p> : null}

          <FormInput label="Phone" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Enter phone" />
          {formErrors.phone ? <p className="error">{formErrors.phone}</p> : null}

          {!selected ? (
            <>
              <FormInput label="Password" type="password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="Enter password" />
              {formErrors.password ? <p className="error">{formErrors.password}</p> : null}
            </>
          ) : null}

          <FilterDropdown
            label="Department"
            value={form.departmentId}
            onChange={(value) => setForm((prev) => ({ ...prev, departmentId: value }))}
            options={[{ value: '', label: 'Unassigned' }, ...departments.map((dept) => ({ value: String(dept.id || dept._id), label: dept.name || 'Department' }))]}
          />

          <FilterDropdown
            label="Status"
            value={form.status}
            onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
            options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          />

          <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
        </form>
      </Modal>

      <Modal open={assignOpen} title={`Assign Employees - ${selected?.name || ''}`} onClose={() => { if (!submitting) setAssignOpen(false) }}>
        <div className="modal-form">
          <div className="checkbox-grid">
            {employees.length === 0 ? <p className="error">No employees available.</p> : employees.map((emp) => (
              <label key={emp.id || emp._id} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={assignedEmployeeIds.includes(String(emp.id || emp._id))}
                  onChange={() => toggleAssigned(emp.id || emp._id)}
                />
                <span>{emp.name} ({emp.email})</span>
              </label>
            ))}
          </div>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setAssignOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={onAssignEmployees} disabled={submitting}>{submitting ? 'Saving...' : 'Save Assignment'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={teamOpen} title={`Manager Team - ${selected?.name || ''}`} onClose={() => setTeamOpen(false)}>
        {teamRows.length === 0 ? (
          <EmptyState title="No team assigned" description="Assign employees to this manager to view team members." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {teamRows.map((member) => (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td>{member.email}</td>
                    <td>{member.phone || '-'}</td>
                    <td>{deptMap[String(member.departmentId || '')] || '-'}</td>
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
        message={`Are you sure you want to delete ${selected?.name || 'this manager'}?`}
        onCancel={() => { if (!submitting) setConfirmOpen(false) }}
        onConfirm={onDelete}
      />
    </section>
  )
}

export default CompanyAdminManagersPage

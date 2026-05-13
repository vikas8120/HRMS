import { useEffect, useMemo, useState } from 'react'
import { Building2, RefreshCw, Users } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import SearchBar from '../components/ui/SearchBar'
import FilterDropdown from '../components/ui/FilterDropdown'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import FormInput from '../components/ui/FormInput'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import EmptyState from '../components/ui/EmptyState'
import StatCard from '../components/ui/StatCard'
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentEmployees,
  getManagers,
  getEmployees
} from '../api/adminDepartmentApi'

const initialForm = {
  name: '',
  description: '',
  departmentHead: '',
  status: 'active'
}

function CompanyAdminDepartmentsPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [error, setError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [employeesOpen, setEmployeesOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)

  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})

  const [managers, setManagers] = useState([])
  const [deptEmployees, setDeptEmployees] = useState([])
  const [deptEmployeesLoading, setDeptEmployeesLoading] = useState(false)
  const [employees, setEmployees] = useState([])
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState([])

  const [toast, setToast] = useState(null)

  const managerMap = useMemo(
    () => Object.fromEntries(managers.map((manager) => [String(manager.id || manager._id), manager.name || 'Manager'])),
    [managers]
  )

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(timer)
  }, [toast])

  const loadManagers = async () => {
    try {
      const res = await getManagers({ limit: 300, status: 'all' })
      setManagers(res?.data || [])
    } catch (_err) {
      setManagers([])
    }
  }

  const loadEmployees = async () => {
    try {
      const res = await getEmployees({ limit: 500, status: 'all' })
      setEmployees(res?.data || [])
    } catch (_err) {
      setEmployees([])
    }
  }

  const loadDepartments = async ({ searchArg = search, statusArg = status, keepLoading = false } = {}) => {
    if (!keepLoading) setLoading(true)
    setError('')

    try {
      const res = await getDepartments({ search: searchArg, status: statusArg })
      setRows(res?.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load departments')
      setRows([])
    } finally {
      if (!keepLoading) setLoading(false)
    }
  }

  useEffect(() => {
    loadManagers()
    loadEmployees()
    loadDepartments()
  }, [])

  const stats = useMemo(() => {
    const total = rows.length
    const active = rows.filter((row) => row.status === 'active').length
    const inactive = rows.filter((row) => row.status === 'inactive').length
    const totalEmployees = rows.reduce((sum, row) => sum + Number(row.employeeCount || 0), 0)

    return [
      { title: 'Total Departments', value: String(total), trend: 'Current company departments', icon: Building2, trendTone: 'info' },
      { title: 'Active Departments', value: String(active), trend: `${inactive} inactive`, icon: Building2, trendTone: 'success' },
      { title: 'Department Employees', value: String(totalEmployees), trend: 'Mapped headcount', icon: Users, trendTone: 'warning' }
    ]
  }, [rows])

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
      description: row.description || '',
      departmentHead: row.departmentHead || '',
      status: row.status || 'active'
    })
    setFormErrors({})
    setFormOpen(true)
  }

  const openEmployees = async (row) => {
    setSelected(row)
    setEmployeesOpen(true)
    setDeptEmployees([])
    setDeptEmployeesLoading(true)

    try {
      const res = await getDepartmentEmployees(row.id)
      setDeptEmployees(res?.data?.employees || [])
    } catch (_err) {
      setDeptEmployees([])
    } finally {
      setDeptEmployeesLoading(false)
    }
  }

  const openAssignEmployees = (row) => {
    setSelected(row)
    const existing = employees
      .filter((employee) => String(employee.departmentId || '') === String(row.id))
      .map((employee) => String(employee.id || employee._id))
    setAssignedEmployeeIds(existing)
    setAssignOpen(true)
  }

  const validateForm = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Department name is required'
    setFormErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      if (selected) {
        const res = await updateDepartment(selected.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          departmentHead: form.departmentHead || null,
          status: form.status
        })
        const updated = res?.data
        if (!updated?.id) throw new Error('Database update confirmation not received')
        setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)))
        setToast({ type: 'success', message: res?.message || `Department updated successfully (ID: ${updated.id})` })
      } else {
        const res = await createDepartment({
          name: form.name.trim(),
          description: form.description.trim(),
          departmentHead: form.departmentHead || null,
          status: form.status
        })
        const created = res?.data
        if (!created?.id) throw new Error('Database save confirmation not received')
        setRows((prev) => [created, ...prev])
        setToast({ type: 'success', message: res?.message || `Department created successfully (ID: ${created.id})` })
      }

      setFormOpen(false)
      resetForm()
      await loadDepartments({ keepLoading: true })
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
      const res = await deleteDepartment(selected.id)
      setRows((prev) => prev.filter((row) => row.id !== selected.id))
      setToast({ type: 'success', message: res?.message || 'Department deleted successfully' })
      setConfirmOpen(false)
      setSelected(null)
      await loadDepartments({ keepLoading: true })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Delete failed' })
    } finally {
      setSubmitting(false)
    }
  }

  const onSaveDepartmentEmployees = async () => {
    if (!selected?.id) return
    setSubmitting(true)
    try {
      const res = await updateDepartment(selected.id, { employeeIds: assignedEmployeeIds })
      const updated = res?.data
      setRows((prev) => prev.map((row) => (row.id === selected.id ? { ...row, ...updated } : row)))
      setToast({ type: 'success', message: res?.message || 'Department employee assignment updated successfully' })
      setAssignOpen(false)
      await Promise.all([loadEmployees(), loadDepartments({ keepLoading: true })])
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to update assignment' })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleAssignedEmployee = (employeeId) => {
    const id = String(employeeId)
    setAssignedEmployeeIds((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ))
  }

  const onApplySearch = async () => {
    await loadDepartments({ searchArg: search, statusArg: status })
  }

  const onStatusChange = async (value) => {
    setStatus(value)
    await loadDepartments({ searchArg: search, statusArg: value })
  }

  const displayRows = useMemo(
    () => rows.map((row) => ({
      ...row,
      headName: managerMap[String(row.departmentHead || '')] || '-',
      createdDate: row.createdAt ? String(row.createdAt).slice(0, 10) : '-'
    })),
    [rows, managerMap]
  )

  return (
    <section className="section-layout">
      <PageHeader
        title="Departments"
        description="Create and manage departments, assign heads, and monitor department team size."
        breadcrumb={['Company Admin', 'Departments']}
        primaryActionLabel="Add Department"
        onPrimaryAction={openAdd}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="stats-grid">
        {stats.map((item) => <StatCard key={item.title} {...item} />)}
      </div>

      <div className="panel filters-panel">
        <div className="filters-row">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder="Search department by name" />
          </div>
          <FilterDropdown
            label="Status"
            value={status}
            onChange={onStatusChange}
            options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          />
        </div>

        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={onApplySearch}>Apply Search</Button>
          <Button variant="ghost" onClick={() => loadDepartments()}><RefreshCw size={14} /> Refresh</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Department Records</h3>
          <div className="actions-row"><Button onClick={openAdd}>Add Department</Button></div>
        </div>

        {loading ? <LoadingSkeleton rows={7} /> : error ? (
          <EmptyState title="Unable to load departments" description={error} />
        ) : displayRows.length === 0 ? (
          <EmptyState title="No departments found" description="Create a department to get started." />
        ) : (
          <div className="table-wrap">
            <div className="table-meta"><p>{displayRows.length} records</p></div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Department Head</th>
                  <th>Status</th>
                  <th>Employee Count</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.description || '-'}</td>
                    <td>{row.headName}</td>
                    <td><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                    <td>{row.employeeCount || 0}</td>
                    <td>{row.createdDate}</td>
                    <td>
                      <div className="table-actions">
                        <button className="text-btn" onClick={() => openEmployees(row)}>View Employees</button>
                        <button className="text-btn" onClick={() => openAssignEmployees(row)}>Assign Employees</button>
                        <button className="text-btn" onClick={() => openEdit(row)}>Edit</button>
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

      <Modal open={formOpen} title={`${selected ? 'Edit' : 'Add'} Department`} onClose={() => { if (!submitting) setFormOpen(false) }}>
        <form className="modal-form" onSubmit={onSubmit}>
          <FormInput label="Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Enter department name" />
          {formErrors.name ? <p className="error">{formErrors.name}</p> : null}

          <FormInput label="Description" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Enter description" />

          <FilterDropdown
            label="Department Head"
            value={form.departmentHead}
            onChange={(value) => setForm((prev) => ({ ...prev, departmentHead: value }))}
            options={[{ value: '', label: 'Unassigned' }, ...managers.map((manager) => ({ value: String(manager.id || manager._id), label: manager.name || 'Manager' }))]}
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
            {employees.length === 0 ? <p className="error">No employees available.</p> : employees.map((employee) => {
              const id = String(employee.id || employee._id)
              const alreadyInOther = employee.departmentId && String(employee.departmentId) !== String(selected?.id)
              return (
                <label key={id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={assignedEmployeeIds.includes(id)}
                    onChange={() => toggleAssignedEmployee(id)}
                  />
                  <span>{employee.name} ({employee.email}){alreadyInOther ? ' - reassigned on save' : ''}</span>
                </label>
              )
            })}
          </div>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setAssignOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={onSaveDepartmentEmployees} disabled={submitting}>{submitting ? 'Saving...' : 'Save Assignment'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={employeesOpen} title={`Department Employees - ${selected?.name || ''}`} onClose={() => setEmployeesOpen(false)}>
        {deptEmployeesLoading ? <LoadingSkeleton rows={4} /> : deptEmployees.length === 0 ? (
          <EmptyState title="No employees in this department" description="Employees assigned to this department will appear here." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Designation</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {deptEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.employeeId || '-'}</td>
                    <td>{employee.name}</td>
                    <td>{employee.email}</td>
                    <td>{employee.designation || '-'}</td>
                    <td><span className={`badge badge-${employee.status}`}>{employee.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Department"
        message={`Are you sure you want to delete ${selected?.name || 'this department'}?`}
        onCancel={() => { if (!submitting) setConfirmOpen(false) }}
        onConfirm={onDelete}
      />
    </section>
  )
}

export default CompanyAdminDepartmentsPage

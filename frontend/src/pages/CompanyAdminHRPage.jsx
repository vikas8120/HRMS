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
  getHRList,
  createHR as createHRApi,
  updateHR as updateHRApi,
  deleteHR as deleteHRApi,
  updateHRStatus as updateHRStatusApi
} from '../api/adminHrApi'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  departmentId: '',
  status: 'active'
}

function CompanyAdminHRPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [error, setError] = useState('')

  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})

  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(timer)
  }, [toast])

  const loadHR = async ({ pageArg = page, searchArg = search, statusArg = status, keepLoading = false } = {}) => {
    if (!keepLoading) setLoading(true)
    setError('')

    try {
      const res = await getHRList({ page: pageArg, limit: 10, search: searchArg, status: statusArg })
      setRows(res?.data || [])
      setPagination(res?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load HR records')
      setRows([])
    } finally {
      if (!keepLoading) setLoading(false)
    }
  }

  useEffect(() => {
    loadHR({ pageArg: page })
  }, [page])

  const resetForm = () => {
    setForm(initialForm)
    setFormErrors({})
  }

  const openAdd = () => {
    setSelected(null)
    resetForm()
    setOpen(true)
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
    setOpen(true)
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

  const onSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      if (selected) {
        const payload = {
          name: form.name.trim(),
          phone: form.phone.trim(),
          departmentId: form.departmentId.trim() || null,
          status: form.status
        }
        const res = await updateHRApi(selected.id, payload)
        const updated = res?.data
        if (!updated?.id) throw new Error('Update confirmation was not returned')
        setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)))
        setToast({ type: 'success', message: res?.message || 'HR updated successfully' })
      } else {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          departmentId: form.departmentId.trim() || null,
          status: form.status
        }
        const res = await createHRApi(payload)
        const created = res?.data
        if (!created?.id) throw new Error('Create confirmation was not returned')
        setRows((prev) => [created, ...prev].slice(0, 10))
        setPagination((prev) => ({ ...prev, total: (prev.total || 0) + 1 }))
        setToast({ type: 'success', message: res?.message || 'HR created successfully' })
      }

      setOpen(false)
      resetForm()
      await loadHR({ pageArg: 1, keepLoading: true })
      setPage(1)
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || err?.message || 'Operation failed' })
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async () => {
    if (!selected?.id) return

    setSubmitting(true)
    try {
      const res = await deleteHRApi(selected.id)
      setRows((prev) => prev.filter((row) => row.id !== selected.id))
      setPagination((prev) => ({ ...prev, total: Math.max((prev.total || 1) - 1, 0) }))
      setToast({ type: 'success', message: res?.message || 'HR deleted successfully' })
      setConfirmOpen(false)
      setSelected(null)
      await loadHR({ pageArg: page, keepLoading: true })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Delete failed' })
    } finally {
      setSubmitting(false)
    }
  }

  const onToggleStatus = async (row) => {
    const nextStatus = row.status === 'active' ? 'inactive' : 'active'
    try {
      const res = await updateHRStatusApi(row.id, nextStatus)
      const updated = res?.data
      setRows((prev) => prev.map((item) => (item.id === row.id ? updated : item)))
      setToast({ type: 'success', message: res?.message || `HR ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully` })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Status update failed' })
    }
  }

  const displayRows = useMemo(
    () => rows.map((item) => ({
      ...item,
      createdDate: item.createdAt ? String(item.createdAt).slice(0, 10) : '-'
    })),
    [rows]
  )

  const onSearchApply = async () => {
    setPage(1)
    await loadHR({ pageArg: 1, searchArg: search, statusArg: status })
  }

  const onFilterChange = async (value) => {
    setStatus(value)
    setPage(1)
    await loadHR({ pageArg: 1, searchArg: search, statusArg: value })
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="HR"
        description="Manage HR users for your company with full lifecycle controls."
        breadcrumb={['Company Admin', 'HR']}
        primaryActionLabel="Add HR"
        onPrimaryAction={openAdd}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel filters-panel">
        <div className="filters-row">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email" />
          </div>
          <FilterDropdown
            label="Status Filter"
            value={status}
            onChange={onFilterChange}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
          />
        </div>
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={onSearchApply}>Apply Search</Button>
          <Button variant="ghost" onClick={() => loadHR({ pageArg: page })}><RefreshCw size={14} /> Refresh</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>HR Records</h3>
          <div className="actions-row"><Button onClick={openAdd}>Add HR</Button></div>
        </div>

        {loading ? <LoadingSkeleton rows={7} /> : error ? (
          <EmptyState title="Unable to load HR records" description={error} />
        ) : displayRows.length === 0 ? (
          <EmptyState title="No HR records" description="Add a new HR user to get started." />
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
                    <td>{row.departmentId || '-'}</td>
                    <td><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                    <td>{row.createdDate}</td>
                    <td>
                      <div className="table-actions">
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

      <Modal open={open} title={`${selected ? 'Edit' : 'Add'} HR`} onClose={() => { if (!submitting) setOpen(false) }}>
        <form className="modal-form" onSubmit={onSubmit}>
          <FormInput
            label="Name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Enter name"
          />
          {formErrors.name ? <p className="error">{formErrors.name}</p> : null}

          <FormInput
            label="Email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Enter email"
            disabled={Boolean(selected)}
          />
          {formErrors.email ? <p className="error">{formErrors.email}</p> : null}

          <FormInput
            label="Phone"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            placeholder="Enter phone"
          />
          {formErrors.phone ? <p className="error">{formErrors.phone}</p> : null}

          {!selected ? (
            <>
              <FormInput
                label="Password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Enter password"
              />
              {formErrors.password ? <p className="error">{formErrors.password}</p> : null}
            </>
          ) : null}

          <FormInput
            label="Department"
            value={form.departmentId}
            onChange={(event) => setForm((prev) => ({ ...prev, departmentId: event.target.value }))}
            placeholder="Enter department ID"
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

      <ConfirmDialog
        open={confirmOpen}
        title="Delete HR"
        message={`Are you sure you want to delete ${selected?.name || 'this HR user'}?`}
        onCancel={() => { if (!submitting) setConfirmOpen(false) }}
        onConfirm={onDelete}
      />
    </section>
  )
}

export default CompanyAdminHRPage

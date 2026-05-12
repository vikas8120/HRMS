import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import FormInput from '../../components/ui/FormInput'
import Modal from '../../components/ui/Modal'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import {
  createPlatformOverview,
  deletePlatformOverview,
  getPlatformOverviewById,
  listPlatformOverview,
  updatePlatformOverview
} from '../../api/platformOverviewApi'

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'owner', label: 'Owner' },
  { key: 'updated', label: 'Updated' }
]

const fromNow = (value) => {
  if (!value) return '-'
  const diffMs = Date.now() - new Date(value).getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  if (hours <= 0) return 'just now'
  return `${hours}h ago`
}

function PlatformOverviewPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [mode, setMode] = useState('Add')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [records, setRecords] = useState([])
  const [selected, setSelected] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 })
  const [form, setForm] = useState({ name: '', status: 'Active', owner: 'Platform Team' })

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listPlatformOverview({ page: pagination.page, limit: pagination.limit, search, status: statusFilter })
      setRecords(data.items || [])
      setPagination(data.pagination || { page: 1, limit: 10, totalPages: 1 })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load platform overview data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, search, statusFilter])

  const rows = useMemo(
    () =>
      records.map((entry, index) => ({
        id: entry._id,
        displayId: `PLAT-${index + 1}`,
        name: entry.name,
        status: entry.status,
        owner: entry.owner,
        updated: fromNow(entry.updatedAt)
      })),
    [records]
  )

  const tableRows = rows.map((row) => ({ ...row, id: row.id, ID: row.displayId }))
  const shapedColumns = columns.map((column) => (column.key === 'id' ? { ...column, key: 'ID' } : column))

  const openAdd = () => {
    setMode('Add')
    setSelected(null)
    setForm({ name: '', status: 'Active', owner: 'Platform Team' })
    setOpen(true)
  }

  const openEdit = async (row) => {
    setMode('Edit')
    setOpen(true)
    try {
      const data = await getPlatformOverviewById(row.id)
      const item = data.item
      setSelected(item)
      setForm({ name: item.name || '', status: item.status || 'Active', owner: item.owner || 'Platform Team' })
    } catch (err) {
      setOpen(false)
      setError(err?.response?.data?.message || 'Failed to load record')
    }
  }

  const openView = async (row) => {
    try {
      const data = await getPlatformOverviewById(row.id)
      setSelected(data.item)
      setViewOpen(true)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load record')
    }
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }

    try {
      if (mode === 'Add') {
        await createPlatformOverview(form)
      } else {
        await updatePlatformOverview(selected._id || selected.id, form)
      }
      setOpen(false)
      setSelected(null)
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save record')
    }
  }

  const onDelete = async () => {
    if (!selected) return
    try {
      await deletePlatformOverview(selected._id || selected.id || selected.id)
      setConfirmOpen(false)
      setSelected(null)
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete record')
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Platform Overview"
        description="Platform Overview workspace with search, filters, data table, and CRUD-ready actions."
        breadcrumb={['Super Admin', 'Dashboard', 'Platform Overview']}
        primaryActionLabel="Add Platform Overview"
        onPrimaryAction={openAdd}
      />

      {error ? <div className="toast toast-error">{error}</div> : null}

      <div className="panel filters-panel">
        <div className="filters-row">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder="Search Platform Overview" />
          </div>
          <FilterDropdown
            label="Status Filter"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'Active', label: 'Active' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Disabled', label: 'Disabled' }
            ]}
          />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Platform Overview Records</h3>
          <div className="actions-row">
            <Button onClick={openAdd}>Add</Button>
            <Button variant="ghost" onClick={() => selected && openEdit({ id: selected._id || selected.id })}>Edit</Button>
            <Button variant="ghost" onClick={() => selected && openView({ id: selected._id || selected.id })}>View</Button>
            <Button variant="danger" onClick={() => selected && setConfirmOpen(true)}>Delete</Button>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton rows={7} />
        ) : (
          <DataTable
            columns={shapedColumns}
            rows={tableRows}
            onView={(row) => {
              setSelected(records.find((entry) => entry._id === row.id) || null)
              openView(row)
            }}
            onEdit={(row) => {
              setSelected(records.find((entry) => entry._id === row.id) || null)
              openEdit(row)
            }}
            onDelete={(row) => {
              setSelected(records.find((entry) => entry._id === row.id) || null)
              setConfirmOpen(true)
            }}
          />
        )}

        <div className="pagination-row">
          <Button variant="ghost" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>Prev</Button>
          <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
          <Button variant="ghost" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Next</Button>
        </div>
      </div>

      <Modal open={open} title={`${mode} Platform Overview`} onClose={() => setOpen(false)}>
        <form className="modal-form" onSubmit={onSubmit}>
          <FormInput label="Name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Enter record name" />
          <FormInput label="Owner" value={form.owner} onChange={(e) => setForm((prev) => ({ ...prev, owner: e.target.value }))} placeholder="Enter owner" />
          <FilterDropdown
            label="Status"
            value={form.status}
            onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Disabled', label: 'Disabled' }
            ]}
          />
          <Button type="submit">Save</Button>
        </form>
      </Modal>

      <Modal open={viewOpen} title="View Platform Overview" onClose={() => setViewOpen(false)}>
        {selected ? (
          <div className="modal-form">
            <div><strong>Name:</strong> {selected.name}</div>
            <div><strong>Status:</strong> {selected.status}</div>
            <div><strong>Owner:</strong> {selected.owner}</div>
            <div><strong>Updated:</strong> {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : '-'}</div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Platform Overview"
        message={`Are you sure you want to delete ${selected?.name || 'this record'}?`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onDelete}
      />
    </section>
  )
}

export default PlatformOverviewPage

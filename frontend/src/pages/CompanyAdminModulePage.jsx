import { useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import SearchBar from '../components/ui/SearchBar'
import FilterDropdown from '../components/ui/FilterDropdown'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import FormInput from '../components/ui/FormInput'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import StatCard from '../components/ui/StatCard'
import { Activity, BarChart3, CheckCircle2, Clock3 } from 'lucide-react'
import { buildCompanyAdminRows, companyAdminStatsByModule } from '../data/companyAdminData'

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'owner', label: 'Owner' },
  { key: 'status', label: 'Status' },
  { key: 'updated', label: 'Updated' }
]

function CompanyAdminModulePage({ moduleName }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ name: '', status: 'Active' })

  const rows = useMemo(() => buildCompanyAdminRows(moduleName), [moduleName])

  const filteredRows = useMemo(
    () => rows.filter((row) => (
      (row.name.toLowerCase().includes(search.toLowerCase()) || row.id.toLowerCase().includes(search.toLowerCase()))
      && (filter === 'all' || row.status.toLowerCase() === filter)
    )),
    [rows, search, filter]
  )

  const stats = companyAdminStatsByModule[moduleName] || []
  const displayStats = stats.length
    ? stats
    : [
      { title: `${moduleName} Total`, value: '24', trend: 'Current records' },
      { title: `${moduleName} Active`, value: '18', trend: 'Running workflows' },
      { title: `${moduleName} Pending`, value: '4', trend: 'Awaiting review' },
      { title: `${moduleName} Closed`, value: '2', trend: 'Completed today' }
    ]

  const statIcons = [Activity, CheckCircle2, Clock3, BarChart3]

  return (
    <section className="section-layout">
      <PageHeader
        title={moduleName}
        description={`${moduleName} workspace with reusable cards, filters, table, modals, and actions matching Platform Admin UI pattern.`}
        breadcrumb={['Company Admin', moduleName]}
        primaryActionLabel={`Add ${moduleName}`}
        onPrimaryAction={() => setOpen(true)}
      />

      <div className="stats-grid">
        {displayStats.map((item, index) => (
          <StatCard
            key={`${moduleName}-${item.title}`}
            title={item.title}
            value={item.value}
            trend={item.trend}
            trendTone={index % 2 === 0 ? 'info' : 'success'}
            icon={statIcons[index % statIcons.length]}
          />
        ))}
      </div>

      <div className="panel filters-panel">
        <div className="filters-row">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder={`Search ${moduleName}`} />
          </div>
          <FilterDropdown
            label="Status Filter"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'inactive', label: 'Inactive' }
            ]}
          />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>{moduleName} Records</h3>
          <div className="actions-row">
            <Button onClick={() => setOpen(true)}>Add</Button>
            <Button variant="ghost" onClick={() => selected && setOpen(true)}>Edit</Button>
            <Button variant="danger" onClick={() => selected && setConfirmOpen(true)}>Delete</Button>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={filteredRows}
          onView={setSelected}
          onEdit={(row) => {
            setSelected(row)
            setForm({ name: row.name, status: row.status })
            setOpen(true)
          }}
          onDelete={(row) => {
            setSelected(row)
            setConfirmOpen(true)
          }}
        />
      </div>

      <Modal open={open} title={`${selected ? 'Edit' : 'Add'} ${moduleName}`} onClose={() => setOpen(false)}>
        <form className="modal-form" onSubmit={(event) => { event.preventDefault(); setOpen(false) }}>
          <FormInput
            label="Name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder={`Enter ${moduleName} name`}
          />
          <FilterDropdown
            label="Status"
            value={form.status}
            onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Inactive', label: 'Inactive' }
            ]}
          />
          <Button type="submit">Save</Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${moduleName} record`}
        message={`Are you sure you want to delete ${selected?.name || 'this record'}?`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          setSelected(null)
        }}
      />
    </section>
  )
}

export default CompanyAdminModulePage

import { Suspense, lazy, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import FormInput from '../../components/ui/FormInput'
import Modal from '../../components/ui/Modal'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import { buildModuleRows } from '../../data/dashboardData'

const AdminManagementModulePage = lazy(() => import('../admin/AdminManagementModulePage'))
const CompanyManagementModulePage = lazy(() => import('../company/CompanyManagementModulePage'))
const SubscriptionBillingModulePage = lazy(() => import('../subscription/SubscriptionBillingModulePage'))
const RevenueAnalyticsModulePage = lazy(() => import('../revenue/RevenueAnalyticsModulePage'))
const GlobalUsersModulePage = lazy(() => import('../global-users/GlobalUsersModulePage'))
const SupportCenterModulePage = lazy(() => import('../support/SupportCenterModulePage'))
const AuditSecurityModulePage = lazy(() => import('../audit-security/AuditSecurityModulePage'))
const IntegrationsModulePage = lazy(() => import('../integrations/IntegrationsModulePage'))
const AICenterModulePage = lazy(() => import('../ai-center/AICenterModulePage'))
const BackupRestoreModulePage = lazy(() => import('../backup/BackupRestoreModulePage'))
const ReportsModulePage = lazy(() => import('../reports/ReportsModulePage'))
const SystemSettingsModulePage = lazy(() => import('../settings/SystemSettingsModulePage'))

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'owner', label: 'Owner' },
  { key: 'updated', label: 'Updated' }
]

function SectionPage({ module, page }) {
  const moduleFallback = <div className="panel">Loading {module}...</div>

  if (module === 'Admin Management') return <Suspense fallback={moduleFallback}><AdminManagementModulePage page={page} /></Suspense>
  if (module === 'Company Management') return <Suspense fallback={moduleFallback}><CompanyManagementModulePage page={page} /></Suspense>
  if (module === 'Subscription & Billing') return <Suspense fallback={moduleFallback}><SubscriptionBillingModulePage page={page} /></Suspense>
  if (module === 'Revenue & Analytics') return <Suspense fallback={moduleFallback}><RevenueAnalyticsModulePage page={page} /></Suspense>
  if (module === 'Global Users') return <Suspense fallback={moduleFallback}><GlobalUsersModulePage page={page} /></Suspense>
  if (module === 'Support Center') return <Suspense fallback={moduleFallback}><SupportCenterModulePage page={page} /></Suspense>
  if (module === 'Audit & Security') return <Suspense fallback={moduleFallback}><AuditSecurityModulePage page={page} /></Suspense>
  if (module === 'Integrations') return <Suspense fallback={moduleFallback}><IntegrationsModulePage page={page} /></Suspense>
  if (module === 'AI Center') return <Suspense fallback={moduleFallback}><AICenterModulePage page={page} /></Suspense>
  if (module === 'Backup & Restore') return <Suspense fallback={moduleFallback}><BackupRestoreModulePage page={page} /></Suspense>
  if (module === 'Reports') return <Suspense fallback={moduleFallback}><ReportsModulePage page={page} /></Suspense>
  if (module === 'System Settings') return <Suspense fallback={moduleFallback}><SystemSettingsModulePage page={page} /></Suspense>

  const title = module
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState('Add')
  const [loading] = useState(false)
  const [form, setForm] = useState({ name: '', status: 'Active' })
  const [errors, setErrors] = useState({})

  const rows = useMemo(() => buildModuleRows(title), [title])
  const filteredRows = rows.filter((row) => (row.name.toLowerCase().includes(search.toLowerCase()) || row.id.toLowerCase().includes(search.toLowerCase())) && (filter === 'all' || row.status.toLowerCase() === filter))

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const openAdd = () => { setMode('Add'); setSelected(null); setForm({ name: '', status: 'Active' }); setOpen(true) }
  const openEdit = (row) => { setMode('Edit'); setSelected(row); setForm({ name: row.name, status: row.status }); setOpen(true) }
  const handleSubmit = (event) => { event.preventDefault(); if (!validate()) return; setOpen(false); setSelected(null) }

  return (
    <section className="section-layout">
      <PageHeader title={title} description={`${title} single-page workspace with search, filters, data table, and CRUD-ready actions.`} breadcrumb={['Super Admin', module, 'Workspace']} primaryActionLabel={`Add ${title}`} onPrimaryAction={openAdd} />
      <div className="panel filters-panel"><div className="filters-row"><div className="search-wrap"><label>Search</label><SearchBar value={search} onChange={setSearch} placeholder={`Search ${title}`} /></div><FilterDropdown label="Status Filter" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'pending', label: 'Pending' }]} /></div></div>
      <div className="panel"><div className="panel-head"><h3>{title} Records</h3><div className="actions-row"><Button onClick={openAdd}>Add</Button><Button variant="ghost" onClick={() => selected && openEdit(selected)}>Edit</Button><Button variant="ghost" onClick={() => {}}>View</Button><Button variant="danger" onClick={() => selected && setConfirmOpen(true)}>Delete</Button></div></div>{loading ? <LoadingSkeleton rows={7} /> : <DataTable columns={columns} rows={filteredRows} loading={loading} onView={(row) => setSelected(row)} onEdit={openEdit} onDelete={(row) => { setSelected(row); setConfirmOpen(true) }} />}</div>
      <Modal open={open} title={`${mode} ${title}`} onClose={() => setOpen(false)}><form className="modal-form" onSubmit={handleSubmit}><FormInput label="Name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder={`Enter ${title} name`} />{errors.name ? <p className="error">{errors.name}</p> : null}<FilterDropdown label="Status" value={form.status} onChange={(value) => setForm((prev) => ({ ...prev, status: value }))} options={[{ value: 'Active', label: 'Active' }, { value: 'Pending', label: 'Pending' }, { value: 'Disabled', label: 'Disabled' }]} /><Button type="submit">Save</Button></form></Modal>
      <ConfirmDialog open={confirmOpen} title={`Delete ${title}`} message={`Are you sure you want to delete ${selected?.name || 'this record'}?`} onCancel={() => setConfirmOpen(false)} onConfirm={() => { setConfirmOpen(false); setSelected(null) }} />
    </section>
  )
}

export default SectionPage

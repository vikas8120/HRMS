import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import FilterDropdown from '../components/ui/FilterDropdown'
import SearchBar from '../components/ui/SearchBar'
import EmptyState from '../components/ui/EmptyState'
import DataTable from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import FormInput from '../components/ui/FormInput'

const STORAGE_KEY = 'hrms_admin_hr_workspace_v1'

const modules = [
  {
    key: 'hr-dashboard',
    label: 'HR Dashboard',
    submodules: ['Executive Overview', 'Workforce Snapshot', 'Today Attendance Summary', 'Leave Summary', 'Payroll Cycle Status', 'Pending Approvals Widget', 'Recent Activity Feed'],
    summary: 'Live HR KPI overview and pending action center.'
  },
  {
    key: 'employee',
    label: 'Employee',
    submodules: ['Employee Directory', 'Add Employee', 'Employee Profile (360)', 'Onboarding Checklist', 'Offboarding/Exit', 'Employment History', 'Bank & Tax Details', 'Bulk Import/Export'],
    summary: 'Employee lifecycle management from onboarding to exit.'
  },
  {
    key: 'attendance',
    label: 'Attendance',
    submodules: ['Daily Attendance Register', 'Shift Roster Management', 'Punch In/Out Logs', 'Late/Early Tracking', 'Overtime Requests', 'Regularization Queue', 'Missing Punch Resolver', 'Attendance Reports'],
    summary: 'Attendance operations, exceptions, and compliance tracking.'
  },
  {
    key: 'leave',
    label: 'Leave',
    submodules: ['Leave Dashboard', 'Leave Type Master', 'Leave Policy Configuration', 'Leave Balance Ledger', 'Apply Leave', 'Leave Calendar', 'Approval Workflow', 'Comp-Off & Encashment'],
    summary: 'Leave policy, balances, approvals, and holiday workflow.'
  },
  {
    key: 'payroll',
    label: 'Payroll',
    submodules: ['Salary Components', 'Salary Structure Templates', 'Variable Pay Inputs', 'Deductions & Statutory', 'Payroll Run', 'Payslip Generation', 'Bank Transfer File', 'Payroll Audit Trail'],
    summary: 'Payroll operations, statutory controls, and payout readiness.'
  },
  {
    key: 'department',
    label: 'Department',
    submodules: ['Department Master', 'Hierarchy & Sub-departments', 'Department Head Assignment', 'Role/Designation Mapping', 'Cost Center Mapping', 'Department Transfers', 'Department KPI View'],
    summary: 'Department structure, ownership, and org mapping.'
  },
  {
    key: 'recruitment',
    label: 'Recruitment',
    submodules: ['Manpower Requisition', 'Job Posting Management', 'Candidate Pipeline', 'Interview Scheduling', 'Interview Feedback', 'Offer Letter Generation', 'Joining Confirmation', 'Recruitment Analytics'],
    summary: 'Hiring pipeline from requisition to joining conversion.'
  },
  {
    key: 'performance',
    label: 'Performance',
    submodules: ['Review Cycle Setup', 'Goal/KRA Assignment', 'Self & Manager Assessment', '360 Feedback', 'Calibration Panel', 'Rating Finalization', 'PIP Management', 'Performance Reports'],
    summary: 'Performance cycles, ratings, and growth planning.'
  },
  {
    key: 'document',
    label: 'Document',
    submodules: ['Document Categories', 'Employee Document Vault', 'Upload & Version Control', 'Verification Queue', 'Expiry Alerts', 'Template Library', 'Access Controls', 'Document Audit Trail'],
    summary: 'Secure document storage, verification, and audit history.'
  },
  {
    key: 'announcement',
    label: 'Announcement',
    submodules: ['Create Announcement', 'Audience Targeting', 'Priority & Pinning', 'Schedule Publish', 'Read Receipt Tracking', 'Acknowledgement Required', 'Archive & History'],
    summary: 'Internal communication with targeting and engagement tracking.'
  },
  {
    key: 'report',
    label: 'Report',
    submodules: ['Report Builder', 'Saved Templates', 'Scheduled Reports', 'Attendance Reports', 'Leave Reports', 'Payroll Reports', 'Compliance Reports', 'Export Center'],
    summary: 'Operational and compliance reporting with export controls.'
  },
  {
    key: 'hr-settings',
    label: 'HR Settings',
    submodules: ['Organization Profile', 'Approval Matrix', 'Attendance Policy', 'Leave Policy', 'Payroll Policy', 'Notification Templates', 'Role & Permission', 'Integration Settings'],
    summary: 'Central HR policy and configuration management.'
  }
]

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'completed', label: 'Completed' },
  { value: 'draft', label: 'Draft' }
]

const owners = ['HR Team', 'Operations Team', 'Payroll Team', 'Admin Team']

const rowColumns = [
  { key: 'name', label: 'Record' },
  { key: 'owner', label: 'Owner' },
  { key: 'status', label: 'Status' },
  { key: 'updated', label: 'Updated' },
  { key: 'notes', label: 'Notes', sortable: false }
]

const toKey = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-')

const getSeedRow = (moduleLabel, submodule, idx) => ({
  id: `${toKey(moduleLabel)}-${toKey(submodule)}-${idx + 1}`,
  name: `${submodule} Item ${idx + 1}`,
  owner: owners[idx % owners.length],
  status: idx % 3 === 0 ? 'active' : idx % 3 === 1 ? 'pending' : 'completed',
  updated: `${idx + 1}h ago`,
  notes: `${moduleLabel} workflow record for ${submodule}`
})

const buildSeedStore = () => {
  const store = {}
  modules.forEach((module) => {
    module.submodules.forEach((submodule) => {
      store[submodule] = [0, 1, 2].map((idx) => getSeedRow(module.label, submodule, idx))
    })
  })
  return store
}

function CompanyAdminHRPage() {
  const defaultModule = modules[0]
  const [activeModuleKey, setActiveModuleKey] = useState(defaultModule.key)
  const [activeSubmodule, setActiveSubmodule] = useState(defaultModule.submodules[0])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [recordsBySubmodule, setRecordsBySubmodule] = useState(buildSeedStore)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedRowId, setSelectedRowId] = useState('')
  const [form, setForm] = useState({ name: '', owner: owners[0], status: 'active', notes: '' })

  const activeModule = useMemo(
    () => modules.find((item) => item.key === activeModuleKey) || defaultModule,
    [activeModuleKey]
  )

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed === 'object') {
        setRecordsBySubmodule((prev) => ({ ...prev, ...parsed }))
      }
    } catch (_error) {}
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recordsBySubmodule))
  }, [recordsBySubmodule])

  useEffect(() => {
    if (!activeModule.submodules.includes(activeSubmodule)) {
      setActiveSubmodule(activeModule.submodules[0])
    }
  }, [activeModule, activeSubmodule])

  const rows = useMemo(() => recordsBySubmodule[activeSubmodule] || [], [recordsBySubmodule, activeSubmodule])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchStatus = status === 'all' ? true : String(row.status).toLowerCase() === status
      const q = search.trim().toLowerCase()
      const matchSearch = q
        ? [row.name, row.owner, row.status, row.notes].some((value) => String(value || '').toLowerCase().includes(q))
        : true
      return matchStatus && matchSearch
    })
  }, [rows, status, search])

  const openCreate = () => {
    setModalMode('create')
    setSelectedRowId('')
    setForm({ name: '', owner: owners[0], status: 'active', notes: '' })
    setModalOpen(true)
  }

  const openEdit = (row, mode = 'edit') => {
    setModalMode(mode)
    setSelectedRowId(row.id)
    setForm({
      name: row.name || '',
      owner: row.owner || owners[0],
      status: row.status || 'active',
      notes: row.notes || ''
    })
    setModalOpen(true)
  }

  const saveRecord = () => {
    if (!form.name.trim()) return
    const nowStamp = 'just now'
    setRecordsBySubmodule((prev) => {
      const current = prev[activeSubmodule] || []
      if (modalMode === 'create') {
        const newRow = {
          id: `${toKey(activeModule.label)}-${toKey(activeSubmodule)}-${Date.now()}`,
          name: form.name.trim(),
          owner: form.owner,
          status: form.status,
          notes: form.notes.trim(),
          updated: nowStamp
        }
        return { ...prev, [activeSubmodule]: [newRow, ...current] }
      }
      const next = current.map((row) => (
        row.id === selectedRowId
          ? { ...row, name: form.name.trim(), owner: form.owner, status: form.status, notes: form.notes.trim(), updated: nowStamp }
          : row
      ))
      return { ...prev, [activeSubmodule]: next }
    })
    setModalOpen(false)
  }

  const deleteRecord = (row) => {
    const yes = window.confirm(`Delete "${row.name}" from ${activeSubmodule}?`)
    if (!yes) return
    setRecordsBySubmodule((prev) => ({
      ...prev,
      [activeSubmodule]: (prev[activeSubmodule] || []).filter((item) => item.id !== row.id)
    }))
  }

  const exportCurrent = () => {
    const list = filteredRows
    if (!list.length) return
    const csv = [
      'Record,Owner,Status,Updated,Notes',
      ...list.map((row) => `"${row.name}","${row.owner}","${row.status}","${row.updated}","${String(row.notes || '').replace(/"/g, '""')}"`)
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${toKey(activeModule.label)}-${toKey(activeSubmodule)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="HR Management"
        description="Frontend-only complete HR workspace with module-wise operations for Admin control."
        breadcrumb={['Company Admin', 'HR Management']}
        primaryActionLabel="Add Record"
        onPrimaryAction={openCreate}
      />

      <div className="workspace-nav" aria-label="HR module navigation">
        {modules.map((module) => (
          <button
            key={module.key}
            type="button"
            className={`chip-btn ${activeModuleKey === module.key ? 'active' : ''}`}
            onClick={() => setActiveModuleKey(module.key)}
          >
            {module.label}
          </button>
        ))}
      </div>

      <div className="workspace-subnav" aria-label="HR submodule navigation">
        {activeModule.submodules.map((submodule) => (
          <button
            key={submodule}
            type="button"
            className={`chip-btn ${activeSubmodule === submodule ? 'active' : ''}`}
            onClick={() => setActiveSubmodule(submodule)}
          >
            {submodule}
          </button>
        ))}
      </div>

      <div className="panel filters-panel">
        <div className="filters-row">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder={`Search in ${activeSubmodule}`} />
          </div>
          <FilterDropdown label="Status" value={status} onChange={setStatus} options={statusOptions} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>{activeSubmodule}</h3>
          <div className="actions-row">
            <Button variant="ghost" onClick={exportCurrent}>Export</Button>
            <Button variant="ghost" onClick={openCreate}>Create</Button>
          </div>
        </div>
        <p style={{ marginTop: 0 }}>{activeModule.summary}</p>
        {filteredRows.length === 0 ? (
          <EmptyState title={`No records found in ${activeSubmodule}`} description="Try changing filters or create a new record." />
        ) : (
          <DataTable
            columns={rowColumns}
            rows={filteredRows}
            onView={(row) => openEdit(row, 'view')}
            onEdit={(row) => openEdit(row, 'edit')}
            onDelete={deleteRecord}
          />
        )}
      </div>

      <Modal
        open={modalOpen}
        title={modalMode === 'create' ? `Create Record • ${activeSubmodule}` : modalMode === 'view' ? `View Record • ${activeSubmodule}` : `Edit Record • ${activeSubmodule}`}
        onClose={() => setModalOpen(false)}
      >
        <div className="form-grid">
          <FormInput
            label="Record Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            disabled={modalMode === 'view'}
          />
          <FilterDropdown
            label="Owner"
            value={form.owner}
            onChange={(value) => setForm((prev) => ({ ...prev, owner: value }))}
            options={owners.map((owner) => ({ value: owner, label: owner }))}
            disabled={modalMode === 'view'}
          />
          <FilterDropdown
            label="Status"
            value={form.status}
            onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
            options={statusOptions.filter((item) => item.value !== 'all')}
            disabled={modalMode === 'view'}
          />
          <FormInput
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            disabled={modalMode === 'view'}
          />
        </div>
        <div className="actions-row">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>{modalMode === 'view' ? 'Close' : 'Cancel'}</Button>
          {modalMode !== 'view' ? <Button onClick={saveRecord}>Save Record</Button> : null}
        </div>
      </Modal>
    </section>
  )
}

export default CompanyAdminHRPage

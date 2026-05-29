import { useMemo, useState } from 'react'
import PageHeader from '../ui/PageHeader'
import Button from '../ui/Button'
import FilterDropdown from '../ui/FilterDropdown'
import DataTable from '../ui/DataTable'
import Modal from '../ui/Modal'

const POLICY_LIBRARY = [
  {
    id: 'pl-001',
    policyCode: 'POL-HR-001',
    title: 'Attendance & Punctuality Policy',
    category: 'Attendance',
    audience: 'all',
    status: 'Active',
    version: 'v2.1',
    effectiveDate: '2026-01-15',
    summary: 'Defines office timing, late marks, grace periods, and regularization process.'
  },
  {
    id: 'pl-002',
    policyCode: 'POL-HR-002',
    title: 'Leave & Holiday Policy',
    category: 'Leave',
    audience: 'all',
    status: 'Active',
    version: 'v3.0',
    effectiveDate: '2026-02-01',
    summary: 'Explains leave types, eligibility, approval flow, and holiday calendar rules.'
  },
  {
    id: 'pl-003',
    policyCode: 'POL-HR-003',
    title: 'Code of Conduct Policy',
    category: 'Conduct',
    audience: 'all',
    status: 'Active',
    version: 'v1.8',
    effectiveDate: '2025-12-01',
    summary: 'Covers workplace ethics, behavior standards, anti-harassment, and disciplinary actions.'
  },
  {
    id: 'pl-004',
    policyCode: 'POL-HR-004',
    title: 'Information Security Policy',
    category: 'Security',
    audience: 'all',
    status: 'Active',
    version: 'v2.4',
    effectiveDate: '2026-03-10',
    summary: 'Guidelines for password hygiene, data handling, phishing prevention, and access controls.'
  },
  {
    id: 'pl-005',
    policyCode: 'POL-MGR-001',
    title: 'Manager Approval Matrix Policy',
    category: 'Operations',
    audience: 'manager',
    status: 'Active',
    version: 'v1.2',
    effectiveDate: '2026-01-05',
    summary: 'Defines manager approval responsibilities for leaves, attendance corrections, and escalations.'
  },
  {
    id: 'pl-006',
    policyCode: 'POL-EMP-001',
    title: 'Employee Remote Work Policy',
    category: 'Work Mode',
    audience: 'employee',
    status: 'Active',
    version: 'v1.6',
    effectiveDate: '2026-02-20',
    summary: 'Rules for work from home eligibility, communication expectations, and productivity tracking.'
  }
]

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'Attendance', label: 'Attendance' },
  { value: 'Leave', label: 'Leave' },
  { value: 'Conduct', label: 'Conduct' },
  { value: 'Security', label: 'Security' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Work Mode', label: 'Work Mode' }
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Archived', label: 'Archived' }
]

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Audience' },
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'all-users', label: 'All Users' }
]

const audienceLabel = (value) => {
  if (value === 'all') return 'All Users'
  if (value === 'employee') return 'Employee'
  if (value === 'manager') return 'Manager'
  return value || '-'
}

const downloadBlob = (content, fileName, type = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1200)
}

function PolicyWorkspace({ portalLabel = 'Employee Portal', roleAudience = 'employee' }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [audienceFilter, setAudienceFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const availablePolicies = useMemo(
    () => {
      if (roleAudience === 'admin') return POLICY_LIBRARY
      return POLICY_LIBRARY.filter((item) => item.audience === 'all' || item.audience === roleAudience)
    },
    [roleAudience]
  )

  const filteredPolicies = useMemo(() => {
    const q = search.trim().toLowerCase()
    return availablePolicies.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (audienceFilter !== 'all') {
        if (audienceFilter === 'all-users' && item.audience !== 'all') return false
        if (audienceFilter !== 'all-users' && item.audience !== audienceFilter) return false
      }
      if (!q) return true
      const bag = `${item.policyCode} ${item.title} ${item.category} ${item.summary}`.toLowerCase()
      return bag.includes(q)
    })
  }, [availablePolicies, search, categoryFilter, statusFilter, audienceFilter])

  const rows = filteredPolicies.map((item) => ({
    id: item.id,
    policyCode: item.policyCode,
    title: item.title,
    category: item.category,
    audience: audienceLabel(item.audience),
    status: item.status,
    effectiveDate: item.effectiveDate,
    version: item.version,
    raw: item
  }))

  const handleDownload = (item) => {
    const body = [
      `Policy Code: ${item.policyCode}`,
      `Title: ${item.title}`,
      `Category: ${item.category}`,
      `Audience: ${audienceLabel(item.audience)}`,
      `Status: ${item.status}`,
      `Version: ${item.version}`,
      `Effective Date: ${item.effectiveDate}`,
      '',
      'Summary:',
      item.summary
    ].join('\n')
    downloadBlob(body, `${item.policyCode}.txt`)
  }

  const downloadFilteredList = () => {
    const header = 'Policy Code,Title,Category,Audience,Status,Effective Date,Version'
    const lines = filteredPolicies.map((item) => [
      item.policyCode,
      `"${String(item.title).replace(/"/g, '""')}"`,
      item.category,
      audienceLabel(item.audience),
      item.status,
      item.effectiveDate,
      item.version
    ].join(','))
    downloadBlob([header, ...lines].join('\n'), `policy-list-${roleAudience}.csv`, 'text/csv;charset=utf-8')
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Policy Module"
        description="View, filter, and download policies relevant to your role."
        breadcrumb={[portalLabel, 'Policy']}
      />

      <div className="panel">
        <div className="filters-row complaint-filters-grid">
          <label className="form-input-wrap complaint-search-wrap">
            <span>Search</span>
            <input
              className="form-input"
              placeholder="Search by policy code, title, category, summary"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <FilterDropdown label="Category" value={categoryFilter} onChange={setCategoryFilter} options={CATEGORY_OPTIONS} />
          <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
          <FilterDropdown label="Audience" value={audienceFilter} onChange={setAudienceFilter} options={AUDIENCE_OPTIONS} />
          <div className="actions-row" style={{ alignSelf: 'end' }}>
            <Button variant="ghost" onClick={downloadFilteredList}>Download Filtered List</Button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Policy Library</h3></div>
        <DataTable
          columns={[
            { key: 'policyCode', label: 'Policy Code' },
            { key: 'title', label: 'Title' },
            { key: 'category', label: 'Category' },
            { key: 'audience', label: 'Audience' },
            { key: 'status', label: 'Status' },
            { key: 'effectiveDate', label: 'Effective Date' },
            { key: 'version', label: 'Version' }
          ]}
          rows={rows}
          showViewAction
          showEditAction
          showDeleteAction={false}
          editLabel="Download"
          onView={(row) => setSelected(row.raw)}
          onEdit={(row) => handleDownload(row.raw)}
          emptyTitle="No policies found"
          emptyDescription="Try changing filters or search keywords."
        />
      </div>

      <Modal open={Boolean(selected)} title={selected?.title || 'Policy Details'} onClose={() => setSelected(null)}>
        <div className="modal-form">
          <div className="inline-action-card"><strong>Policy Code:</strong> <span>{selected?.policyCode || '-'}</span></div>
          <div className="inline-action-card"><strong>Category:</strong> <span>{selected?.category || '-'}</span></div>
          <div className="inline-action-card"><strong>Audience:</strong> <span>{audienceLabel(selected?.audience)}</span></div>
          <div className="inline-action-card"><strong>Status:</strong> <span>{selected?.status || '-'}</span></div>
          <div className="inline-action-card"><strong>Effective Date:</strong> <span>{selected?.effectiveDate || '-'}</span></div>
          <div className="inline-action-card"><strong>Version:</strong> <span>{selected?.version || '-'}</span></div>
          <div className="inline-action-card"><strong>Summary:</strong> <span>{selected?.summary || '-'}</span></div>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
            <Button onClick={() => selected && handleDownload(selected)}>Download Policy</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default PolicyWorkspace

import { useMemo, useState } from 'react'
import PageHeader from '../ui/PageHeader'
import Button from '../ui/Button'
import FilterDropdown from '../ui/FilterDropdown'
import DataTable from '../ui/DataTable'
import Modal from '../ui/Modal'
import FormInput from '../ui/FormInput'
import ConfirmDialog from '../ui/ConfirmDialog'

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
  const isAdmin = roleAudience === 'admin'
  const isEmployeeView = roleAudience === 'employee'
  const [policies, setPolicies] = useState(POLICY_LIBRARY)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [audienceFilter, setAudienceFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [mode, setMode] = useState('create')
  const [editingId, setEditingId] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editConfirmOpen, setEditConfirmOpen] = useState(false)
  const [pendingEditPolicy, setPendingEditPolicy] = useState(null)
  const [deletingPolicy, setDeletingPolicy] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [form, setForm] = useState({
    policyCode: '',
    title: '',
    category: 'Attendance',
    audience: 'all',
    status: 'Active',
    version: 'v1.0',
    effectiveDate: '',
    summary: ''
  })

  const availablePolicies = useMemo(
    () => {
      if (roleAudience === 'admin') return policies
      return policies.filter((item) => item.audience === 'all' || item.audience === roleAudience)
    },
    [roleAudience, policies]
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

  const resetForm = (policy = null) => {
    setForm({
      policyCode: policy?.policyCode || '',
      title: policy?.title || '',
      category: policy?.category || 'Attendance',
      audience: policy?.audience || 'all',
      status: policy?.status || 'Active',
      version: policy?.version || 'v1.0',
      effectiveDate: policy?.effectiveDate || '',
      summary: policy?.summary || ''
    })
    setFormErrors({})
  }

  const openCreate = () => {
    setMode('create')
    setEditingId('')
    resetForm()
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setMode('edit')
    setEditingId(row.id)
    resetForm(row.raw)
    setFormOpen(true)
  }

  const validateForm = () => {
    const next = {}
    if (!String(form.policyCode || '').trim()) next.policyCode = 'Policy code is required'
    if (!String(form.title || '').trim()) next.title = 'Title is required'
    if (!String(form.category || '').trim()) next.category = 'Category is required'
    if (!String(form.audience || '').trim()) next.audience = 'Audience is required'
    if (!String(form.status || '').trim()) next.status = 'Status is required'
    if (!String(form.version || '').trim()) next.version = 'Version is required'
    if (!String(form.effectiveDate || '').trim()) next.effectiveDate = 'Effective date is required'
    if (!String(form.summary || '').trim()) next.summary = 'Summary is required'

    const duplicateCode = policies.some((item) =>
      String(item.policyCode || '').toLowerCase() === String(form.policyCode || '').trim().toLowerCase()
      && item.id !== editingId
    )
    if (duplicateCode) next.policyCode = 'Policy code already exists'

    setFormErrors(next)
    return Object.keys(next).length === 0
  }

  const onSavePolicy = (event) => {
    event.preventDefault()
    if (!validateForm()) return
    const payload = {
      policyCode: String(form.policyCode).trim().toUpperCase(),
      title: String(form.title).trim(),
      category: String(form.category).trim(),
      audience: form.audience,
      status: form.status,
      version: String(form.version).trim(),
      effectiveDate: form.effectiveDate,
      summary: String(form.summary).trim()
    }

    if (mode === 'edit' && editingId) {
      setPolicies((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...payload } : item)))
    } else {
      setPolicies((prev) => [{ id: `pl-${Date.now()}`, ...payload }, ...prev])
    }
    setFormOpen(false)
  }

  const onDeletePolicy = () => {
    if (!deletingPolicy?.id) return
    setPolicies((prev) => prev.filter((item) => item.id !== deletingPolicy.id))
    setConfirmOpen(false)
    setDeletingPolicy(null)
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
          {!isEmployeeView ? <FilterDropdown label="Category" value={categoryFilter} onChange={setCategoryFilter} options={CATEGORY_OPTIONS} /> : null}
          <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
          {!isEmployeeView ? <FilterDropdown label="Audience" value={audienceFilter} onChange={setAudienceFilter} options={AUDIENCE_OPTIONS} /> : null}
          <div className="actions-row" style={{ alignSelf: 'end' }}>
            <Button variant="ghost" onClick={downloadFilteredList}>Download Filtered List</Button>
            {isAdmin ? <Button onClick={openCreate}>Add Policy</Button> : null}
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
          showEditAction={isAdmin}
          showDeleteAction={isAdmin}
          editLabel="Edit"
          deleteLabel="Delete"
          onView={(row) => setSelected(row.raw)}
          onEdit={(row) => {
            setPendingEditPolicy(row)
            setEditConfirmOpen(true)
          }}
          onDelete={(row) => {
            setDeletingPolicy(row.raw)
            setConfirmOpen(true)
          }}
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

      <Modal open={formOpen} title={mode === 'edit' ? 'Edit Policy' : 'Add Policy'} onClose={() => setFormOpen(false)}>
        <form className="modal-form company-form-modal" onSubmit={onSavePolicy}>
          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Policy Info</h4>
              <p>Define policy identity and categorization details.</p>
            </div>
            <div className="form-grid company-form-grid">
              <FormInput
                label="Policy Code"
                value={form.policyCode}
                onChange={(event) => setForm((prev) => ({ ...prev, policyCode: event.target.value }))}
                error={formErrors.policyCode}
              />
              <FormInput
                label="Title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                error={formErrors.title}
              />
              <FilterDropdown
                label="Category"
                value={form.category}
                onChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
                options={CATEGORY_OPTIONS.filter((item) => item.value !== 'all')}
              />
              <FilterDropdown
                label="Audience"
                value={form.audience}
                onChange={(value) => setForm((prev) => ({ ...prev, audience: value }))}
                options={[
                  { value: 'all', label: 'All Users' },
                  { value: 'employee', label: 'Employee' },
                  { value: 'manager', label: 'Manager' }
                ]}
              />
            </div>
          </div>

          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Version & Status</h4>
              <p>Maintain lifecycle state and effective release info.</p>
            </div>
            <div className="form-grid company-form-grid">
              <FilterDropdown
                label="Status"
                value={form.status}
                onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
                options={STATUS_OPTIONS.filter((item) => item.value !== 'all')}
              />
              <FormInput
                label="Version"
                value={form.version}
                onChange={(event) => setForm((prev) => ({ ...prev, version: event.target.value }))}
                error={formErrors.version}
              />
              <FormInput
                label="Effective Date"
                type="date"
                value={form.effectiveDate}
                onChange={(event) => setForm((prev) => ({ ...prev, effectiveDate: event.target.value }))}
                error={formErrors.effectiveDate}
              />
            </div>
          </div>

          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Policy Summary</h4>
              <p>Add short description for quick policy understanding.</p>
            </div>
            <div className="form-grid company-form-grid">
              <label className="form-input-wrap" style={{ gridColumn: '1 / -1' }}>
                <span>Summary</span>
                <textarea
                  className="form-input"
                  rows={4}
                  value={form.summary}
                  onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
                />
              </label>
              {formErrors.summary ? <p className="error">{formErrors.summary}</p> : null}
            </div>
          </div>

          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit">{mode === 'edit' ? 'Save Changes' : 'Create Policy'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={editConfirmOpen}
        title="Edit Policy"
        message={`Edit ${pendingEditPolicy?.raw?.title || 'this policy'}?`}
        onCancel={() => setEditConfirmOpen(false)}
        onConfirm={() => {
          if (pendingEditPolicy) openEdit(pendingEditPolicy)
          setEditConfirmOpen(false)
          setPendingEditPolicy(null)
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Policy"
        message={`Delete ${deletingPolicy?.title || 'this policy'}?`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onDeletePolicy}
      />
    </section>
  )
}

export default PolicyWorkspace

import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import SearchBar from '../components/ui/SearchBar'
import DataTable from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import FormInput from '../components/ui/FormInput'
import FilterDropdown from '../components/ui/FilterDropdown'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const STORAGE_KEY = 'company_admin_hr_flow_v3'

const steps = [
  {
    key: 'create-hr',
    pipeline: 'Access Setup',
    label: 'Create HR',
    hint: 'Create HR profile and base department assignment.',
    columns: [
      { key: 'hrName', label: 'HR Name' },
      { key: 'email', label: 'Email' },
      { key: 'department', label: 'Department' },
      { key: 'joiningDate', label: 'Joining' },
      { key: 'status', label: 'Status' }
    ],
    fields: [
      { key: 'hrName', label: 'HR Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'department', label: 'Department', type: 'select', options: ['HR Operations', 'Recruitment', 'L&D', 'Payroll'] },
      { key: 'joiningDate', label: 'Joining Date', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'pending', 'disabled'] }
    ]
  },
  {
    key: 'assign-role',
    pipeline: 'Access Setup',
    label: 'Assign Role',
    hint: 'Map HR account with business role and scope.',
    columns: [
      { key: 'hrName', label: 'HR Name' },
      { key: 'role', label: 'Role' },
      { key: 'scope', label: 'Scope' },
      { key: 'assignedBy', label: 'Assigned By' },
      { key: 'status', label: 'Status' }
    ],
    fields: [
      { key: 'hrName', label: 'HR Name', type: 'text' },
      { key: 'role', label: 'Role', type: 'select', options: ['HR Admin', 'Recruitment Lead', 'Payroll Officer', 'L&D Coordinator'] },
      { key: 'scope', label: 'Scope', type: 'select', options: ['Company', 'Department', 'Payroll', 'Recruitment'] },
      { key: 'assignedBy', label: 'Assigned By', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'pending', 'disabled'] }
    ]
  },
  {
    key: 'assign-permissions',
    pipeline: 'Access Setup',
    label: 'Assign Permissions',
    hint: 'Grant module-level permissions to HR account.',
    columns: [
      { key: 'hrName', label: 'HR Name' },
      { key: 'module', label: 'Module' },
      { key: 'permissions', label: 'Permissions' },
      { key: 'approvedBy', label: 'Approved By' },
      { key: 'status', label: 'Status' }
    ],
    fields: [
      { key: 'hrName', label: 'HR Name', type: 'text' },
      { key: 'module', label: 'Module', type: 'select', options: ['Attendance', 'Leaves', 'Recruitment', 'Payroll', 'Documents'] },
      { key: 'permissions', label: 'Permissions', type: 'text' },
      { key: 'approvedBy', label: 'Approved By', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'pending', 'disabled'] }
    ]
  },
  {
    key: 'monitor-activities',
    pipeline: 'Monitoring',
    label: 'Monitor Activities',
    hint: 'Track sensitive actions and manual overrides.',
    columns: [
      { key: 'activity', label: 'Activity' },
      { key: 'actor', label: 'Actor' },
      { key: 'severity', label: 'Severity' },
      { key: 'timeStamp', label: 'Time' },
      { key: 'status', label: 'Status' }
    ],
    fields: [
      { key: 'activity', label: 'Activity', type: 'text' },
      { key: 'actor', label: 'Actor', type: 'text' },
      { key: 'severity', label: 'Severity', type: 'select', options: ['Low', 'Medium', 'High'] },
      { key: 'timeStamp', label: 'Time', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'pending', 'completed'] }
    ]
  },
  {
    key: 'view-attendance',
    pipeline: 'Monitoring',
    label: 'View Attendance',
    hint: 'Attendance snapshots for HR users.',
    columns: [
      { key: 'hrName', label: 'HR Name' },
      { key: 'month', label: 'Month' },
      { key: 'presentDays', label: 'Present' },
      { key: 'lateMarks', label: 'Late' },
      { key: 'status', label: 'Status' }
    ],
    fields: [
      { key: 'hrName', label: 'HR Name', type: 'text' },
      { key: 'month', label: 'Month', type: 'text' },
      { key: 'presentDays', label: 'Present Days', type: 'number' },
      { key: 'lateMarks', label: 'Late Marks', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'pending', 'completed'] }
    ]
  },
  {
    key: 'view-performance',
    pipeline: 'Monitoring',
    label: 'View Performance',
    hint: 'Quarterly review and goal completion tracking.',
    columns: [
      { key: 'hrName', label: 'HR Name' },
      { key: 'rating', label: 'Rating' },
      { key: 'goals', label: 'Goals' },
      { key: 'reviewCycle', label: 'Review Cycle' },
      { key: 'status', label: 'Status' }
    ],
    fields: [
      { key: 'hrName', label: 'HR Name', type: 'text' },
      { key: 'rating', label: 'Rating', type: 'select', options: ['A', 'B', 'C'] },
      { key: 'goals', label: 'Goals', type: 'text' },
      { key: 'reviewCycle', label: 'Review Cycle', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'pending', 'completed'] }
    ]
  },
  {
    key: 'manage-recruitment',
    pipeline: 'Operations',
    label: 'Manage Recruitment',
    hint: 'Manage requisitions, candidates and interview pipeline.',
    columns: [
      { key: 'owner', label: 'Owner' },
      { key: 'positions', label: 'Open Positions' },
      { key: 'candidates', label: 'Candidates' },
      { key: 'pipelineStage', label: 'Pipeline' },
      { key: 'status', label: 'Status' }
    ],
    fields: [
      { key: 'owner', label: 'Owner', type: 'text' },
      { key: 'positions', label: 'Open Positions', type: 'number' },
      { key: 'candidates', label: 'Candidates', type: 'number' },
      { key: 'pipelineStage', label: 'Pipeline Stage', type: 'select', options: ['Screening', 'Interview', 'Offer', 'Joining'] },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'pending', 'completed'] }
    ]
  },
  {
    key: 'manage-payroll-access',
    pipeline: 'Operations',
    label: 'Manage Payroll Access',
    hint: 'Control payroll module access by HR user.',
    columns: [
      { key: 'hrName', label: 'HR Name' },
      { key: 'accessLevel', label: 'Access Level' },
      { key: 'approvedBy', label: 'Approved By' },
      { key: 'auditDate', label: 'Audit Date' },
      { key: 'status', label: 'Status' }
    ],
    fields: [
      { key: 'hrName', label: 'HR Name', type: 'text' },
      { key: 'accessLevel', label: 'Access Level', type: 'select', options: ['Read', 'Approve', 'Full Control'] },
      { key: 'approvedBy', label: 'Approved By', type: 'text' },
      { key: 'auditDate', label: 'Audit Date', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'pending', 'disabled'] }
    ]
  },
  {
    key: 'manage-documents',
    pipeline: 'Operations',
    label: 'Manage Documents',
    hint: 'Validate and track HR-led employee documentation.',
    columns: [
      { key: 'hrName', label: 'HR Name' },
      { key: 'verified', label: 'Verified Docs' },
      { key: 'pending', label: 'Pending Docs' },
      { key: 'lastAudit', label: 'Last Audit' },
      { key: 'status', label: 'Status' }
    ],
    fields: [
      { key: 'hrName', label: 'HR Name', type: 'text' },
      { key: 'verified', label: 'Verified Docs', type: 'number' },
      { key: 'pending', label: 'Pending Docs', type: 'number' },
      { key: 'lastAudit', label: 'Last Audit', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'pending', 'completed'] }
    ]
  },
  {
    key: 'manage-training',
    pipeline: 'Operations',
    label: 'Manage Training',
    hint: 'Track L&D plans assigned to HR team.',
    columns: [
      { key: 'hrName', label: 'HR Name' },
      { key: 'program', label: 'Program' },
      { key: 'completion', label: 'Completion' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'status', label: 'Status' }
    ],
    fields: [
      { key: 'hrName', label: 'HR Name', type: 'text' },
      { key: 'program', label: 'Program', type: 'text' },
      { key: 'completion', label: 'Completion', type: 'text' },
      { key: 'dueDate', label: 'Due Date', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'pending', 'completed'] }
    ]
  },
  {
    key: 'disable-delete-hr',
    pipeline: 'Exit Control',
    label: 'Disable/Delete HR',
    hint: 'Final risk action panel for disable/delete operations.',
    columns: [
      { key: 'hrName', label: 'HR Name' },
      { key: 'actionType', label: 'Action' },
      { key: 'reason', label: 'Reason' },
      { key: 'requestedBy', label: 'Requested By' },
      { key: 'status', label: 'Status' }
    ],
    fields: [
      { key: 'hrName', label: 'HR Name', type: 'text' },
      { key: 'actionType', label: 'Action Type', type: 'select', options: ['Disable', 'Delete'] },
      { key: 'reason', label: 'Reason', type: 'text' },
      { key: 'requestedBy', label: 'Requested By', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'completed'] }
    ]
  }
]

const pipelineGroups = ['Access Setup', 'Monitoring', 'Operations', 'Exit Control']
const stepByKey = Object.fromEntries(steps.map((s) => [s.key, s]))

const seed = {
  'create-hr': [{ id: '1', hrName: 'Anita Sharma', email: 'anita.hr@acme.com', department: 'HR Operations', joiningDate: '15-04-2026', status: 'active' }],
  'assign-role': [{ id: '2', hrName: 'Anita Sharma', role: 'HR Admin', scope: 'Company', assignedBy: 'Company Admin', status: 'active' }],
  'assign-permissions': [{ id: '3', hrName: 'Anita Sharma', module: 'Payroll', permissions: 'View, Approve, Export', approvedBy: 'Security Desk', status: 'active' }],
  'monitor-activities': [{ id: '4', activity: 'Updated leave routing', actor: 'Anita Sharma', severity: 'Medium', timeStamp: 'Today 12:10 PM', status: 'completed' }],
  'view-attendance': [{ id: '5', hrName: 'Anita Sharma', month: 'May 2026', presentDays: 24, lateMarks: 1, status: 'completed' }],
  'view-performance': [{ id: '6', hrName: 'Anita Sharma', rating: 'A', goals: '6/6', reviewCycle: 'Q1 FY26', status: 'completed' }],
  'manage-recruitment': [{ id: '7', owner: 'Recruitment Team', positions: 4, candidates: 29, pipelineStage: 'Interview', status: 'active' }],
  'manage-payroll-access': [{ id: '8', hrName: 'Anita Sharma', accessLevel: 'Full Control', approvedBy: 'Finance Admin', auditDate: '30-05-2026', status: 'active' }],
  'manage-documents': [{ id: '9', hrName: 'Neha Singh', verified: 22, pending: 3, lastAudit: 'Today 09:40 AM', status: 'active' }],
  'manage-training': [{ id: '10', hrName: 'Anita Sharma', program: 'Policy Compliance', completion: '92%', dueDate: '10-06-2026', status: 'active' }],
  'disable-delete-hr': [{ id: '11', hrName: 'Vivek Rao', actionType: 'Disable', reason: 'Investigation pending', requestedBy: 'Company Admin', status: 'pending' }]
}

function CompanyAdminHRPage() {
  const [activeGroup, setActiveGroup] = useState(pipelineGroups[0])
  const [activeStep, setActiveStep] = useState(steps[0].key)
  const [query, setQuery] = useState('')
  const [data, setData] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      return Object.keys(parsed).length ? parsed : seed
    } catch {
      return seed
    }
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [mode, setMode] = useState('create')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})

  const groupSteps = useMemo(() => steps.filter((s) => s.pipeline === activeGroup), [activeGroup])
  useEffect(() => {
    if (!groupSteps.find((x) => x.key === activeStep)) setActiveStep(groupSteps[0]?.key || steps[0].key)
  }, [groupSteps, activeStep])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const currentStep = stepByKey[activeStep] || steps[0]
  const rawRows = data[activeStep] || []
  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return rawRows
    return rawRows.filter((row) => Object.values(row).some((v) => String(v || '').toLowerCase().includes(term)))
  }, [rawRows, query])

  const summary = useMemo(() => {
    const allGroupRows = groupSteps.flatMap((step) => data[step.key] || [])
    return {
      total: allGroupRows.length,
      active: allGroupRows.filter((r) => String(r.status || '') === 'active').length,
      pending: allGroupRows.filter((r) => String(r.status || '') === 'pending').length,
      completed: allGroupRows.filter((r) => String(r.status || '') === 'completed').length,
      disabled: allGroupRows.filter((r) => String(r.status || '') === 'disabled').length
    }
  }, [groupSteps, data])

  const resetForm = (row = null) => {
    const initial = {}
    currentStep.fields.forEach((field) => {
      initial[field.key] = row?.[field.key] ?? (field.type === 'select' ? field.options[0] : '')
    })
    setForm(initial)
  }

  const openCreate = () => {
    setMode('create')
    setSelected(null)
    resetForm()
    setErrors({})
    setModalOpen(true)
  }

  const openView = (row) => {
    setMode('view')
    setSelected(row)
    resetForm(row)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setMode('edit')
    setSelected(row)
    resetForm(row)
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const next = {}
    currentStep.fields.forEach((field) => {
      if (String(form[field.key] ?? '').trim() === '') next[field.key] = `${field.label} is required`
    })
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = () => {
    if (!validate()) return
    const payload = { ...form }
    setData((prev) => {
      const list = prev[activeStep] || []
      if (mode === 'create') return { ...prev, [activeStep]: [{ id: `${activeStep}-${Date.now()}`, ...payload }, ...list] }
      return { ...prev, [activeStep]: list.map((row) => (row.id === selected.id ? { ...row, ...payload } : row)) }
    })
    setModalOpen(false)
  }

  const remove = () => {
    setData((prev) => ({ ...prev, [activeStep]: (prev[activeStep] || []).filter((row) => row.id !== selected?.id) }))
    setConfirmOpen(false)
  }

  const exportCsv = () => {
    const header = currentStep.columns.map((c) => c.label).join(',')
    const body = filteredRows.map((row) => currentStep.columns.map((c) => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hr-${activeStep}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="HR Management"
        description="Action-based HR governance workspace with clear module-wise working flows."
        breadcrumb={['Company Admin', 'HR Management']}
        primaryActionLabel="Create Record"
        onPrimaryAction={openCreate}
      />

      <div className="workspace-subnav">
        {pipelineGroups.map((group) => (
          <button key={group} type="button" className={`chip-btn ${group === activeGroup ? 'active' : ''}`} onClick={() => setActiveGroup(group)}>
            {group}
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>{activeGroup}</h3>
          <div className="actions-row">
            <span className="chip-btn">Total {summary.total}</span>
            <span className="chip-btn">Active {summary.active}</span>
            <span className="chip-btn">Pending {summary.pending}</span>
            <span className="chip-btn">Completed {summary.completed}</span>
            <span className="chip-btn">Disabled {summary.disabled}</span>
          </div>
        </div>
        <div className="tabs-row">
          {groupSteps.map((step) => (
            <button key={step.key} type="button" className={`chip-btn ${step.key === activeStep ? 'active' : ''}`} onClick={() => setActiveStep(step.key)}>
              {step.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>{currentStep.label}</h3>
          <div className="actions-row">
            <Button variant="ghost" onClick={exportCsv}>Export</Button>
            <Button onClick={openCreate}>Create</Button>
          </div>
        </div>
        <p style={{ marginTop: 0 }}>{currentStep.hint}</p>
        <SearchBar value={query} onChange={setQuery} placeholder={`Search in ${currentStep.label}`} />
      </div>

      <div className="panel">
        <DataTable
          columns={currentStep.columns}
          rows={filteredRows}
          onView={openView}
          onEdit={openEdit}
          onDelete={(row) => { setSelected(row); setConfirmOpen(true) }}
          emptyTitle={`No records in ${currentStep.label}`}
          emptyDescription="Create first record to start this step."
        />
      </div>

      <Modal open={modalOpen} title={`${mode === 'create' ? 'Create' : mode === 'edit' ? 'Edit' : 'View'} - ${currentStep.label}`} onClose={() => setModalOpen(false)}>
        <div className="form-grid">
          {currentStep.fields.map((field) => (
            field.type === 'select' ? (
              <FilterDropdown
                key={field.key}
                label={field.label}
                value={form[field.key] ?? ''}
                onChange={(value) => setForm((prev) => ({ ...prev, [field.key]: value }))}
                options={(field.options || []).map((item) => ({ value: item, label: item }))}
                disabled={mode === 'view'}
              />
            ) : (
              <FormInput
                key={field.key}
                label={field.label}
                type={field.type === 'number' ? 'number' : 'text'}
                value={form[field.key] ?? ''}
                error={errors[field.key]}
                onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                disabled={mode === 'view'}
              />
            )
          ))}
        </div>
        <div className="actions-row">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>{mode === 'view' ? 'Close' : 'Cancel'}</Button>
          {mode !== 'view' ? <Button onClick={save}>Save</Button> : null}
        </div>
      </Modal>

      <ConfirmDialog open={confirmOpen} title="Delete Record" message="Delete selected record?" onCancel={() => setConfirmOpen(false)} onConfirm={remove} />
    </section>
  )
}

export default CompanyAdminHRPage

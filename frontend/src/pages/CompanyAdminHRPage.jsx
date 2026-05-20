import { useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import FilterDropdown from '../components/ui/FilterDropdown'
import SearchBar from '../components/ui/SearchBar'
import EmptyState from '../components/ui/EmptyState'

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
  { value: 'blocked', label: 'Blocked' }
]

function CompanyAdminHRPage() {
  const [moduleKey, setModuleKey] = useState(modules[0].key)
  const [submodule, setSubmodule] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const activeModule = useMemo(() => modules.find((item) => item.key === moduleKey) || modules[0], [moduleKey])
  const activeSubmodule = submodule || activeModule.submodules[0]

  return (
    <section className="section-layout">
      <PageHeader
        title="HR Management"
        description="Unified HR workspace with full module architecture aligned to Admin/Super Admin UI."
        breadcrumb={['Company Admin', 'HR Management', activeModule.label]}
        primaryActionLabel="Add Record"
      />

      <div className="panel">
        <div className="panel-head"><h3>HR Modules</h3></div>
        <div className="tabs-row">
          {modules.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`chip-btn ${item.key === activeModule.key ? 'active' : ''}`}
              onClick={() => { setModuleKey(item.key); setSubmodule('') }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>{activeModule.label} Sub Modules</h3></div>
        <div className="tabs-row">
          {activeModule.submodules.map((item) => (
            <button
              key={item}
              type="button"
              className={`chip-btn ${item === activeSubmodule ? 'active' : ''}`}
              onClick={() => setSubmodule(item)}
            >
              {item}
            </button>
          ))}
        </div>
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
            <Button variant="ghost">Export</Button>
            <Button>Create</Button>
          </div>
        </div>
        <p style={{ marginTop: 0 }}>{activeModule.summary}</p>
        <EmptyState
          title={`${activeSubmodule} module shell is ready`}
          description="UI is ready in Admin style. Next we will implement API, table, forms, and actions for this sub-module."
        />
      </div>
    </section>
  )
}

export default CompanyAdminHRPage

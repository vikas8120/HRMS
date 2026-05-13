import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormInput from '../../components/ui/FormInput'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import {
  addBranch,
  createCompany,
  deleteBranch,
  deleteCompany,
  fetchCompanies,
  fetchCompanyActivityLogs,
  getCompanyById,
  updateBranding,
  updateBranch,
  updateCompany,
  updateCompanyStatus,
  updateDomain
} from '../../api/companyManagementApi'
import { listPlans } from '../../api/subscriptionBillingApi'

const defaultForm = {
  companyName: '', companyCode: '', industry: '', email: '', phone: '', address: '', city: '', state: '',
  country: '', timezone: '', currency: '', gst: '', pan: '', plan: 'Starter', employeeLimit: 50, storageLimit: 5, status: 'active'
}
const defaultBrandingForm = { logoUrl: '', primaryColor: '#0f766e', secondaryColor: '#115e59', customDomain: '', loginPageBranding: '' }
const defaultDomainForm = { customDomain: '', verified: false, sslStatus: 'pending' }

const companyColumns = [
  { key: 'companyName', label: 'Company Name' },
  { key: 'companyCode', label: 'Code' },
  { key: 'industry', label: 'Industry' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'plan', label: 'Plan' },
  { key: 'status', label: 'Status' },
  { key: 'employees', label: 'Employees' },
  { key: 'createdDate', label: 'Created Date' }
]

const sectionByPage = {
  'Company Management': 'company-list-section',
  'Company List': 'company-list-section',
  'Add Company': 'company-list-section',
  'Edit Company': 'company-list-section',
  'Company Profile': 'company-profile-section',
  'Company Status': 'company-status-section',
  'Company Branding': 'company-branding-section',
  'Branch Management': 'branch-management-section',
  'Company Storage Usage': 'company-storage-section',
  'Company Domain Setup': 'company-domain-section',
  'Company Activity Logs': 'company-logs-section',
  'Company Configuration': 'company-config-section',
  'Company Suspension': 'company-suspend-section',
  'Company Reactivation': 'company-reactivate-section'
}

function CompanyManagementModulePage({ page }) {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ type: '', message: '' })
  const [planOptions, setPlanOptions] = useState([
    { value: 'Starter', label: 'Starter' },
    { value: 'Growth', label: 'Growth' },
    { value: 'Enterprise', label: 'Enterprise' }
  ])

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [form, setForm] = useState(defaultForm)
  const [formErrors, setFormErrors] = useState({})
  const [companyCodeManuallySet, setCompanyCodeManuallySet] = useState(false)

  const [profileData, setProfileData] = useState(null)
  const [profileTab, setProfileTab] = useState('Overview')
  const [branchForm, setBranchForm] = useState({ name: '', code: '', address: '', city: '', state: '', manager: '', phone: '', status: 'active' })
  const [domainForm, setDomainForm] = useState(defaultDomainForm)
  const [brandingForm, setBrandingForm] = useState(defaultBrandingForm)
  const [activityLogs, setActivityLogs] = useState([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [targetCompany, setTargetCompany] = useState(null)
  const [suspensionReason, setSuspensionReason] = useState('')

  const showError = (message) => setToast({ type: 'error', message })
  const showSuccess = (message) => setToast({ type: 'success', message })
  const getEffectiveCompanyId = () => selectedId || profileData?.id || profileData?._id || targetCompany?.id || ''

  const syncSelectedCompany = (company) => {
    if (!company) return
    setSelectedId(company.id || company._id || '')
    setProfileData(company)
    setBrandingForm(company.branding || defaultBrandingForm)
    setDomainForm(company.domainSetup || defaultDomainForm)
  }

  const loadCompanies = async () => {
    setLoading(true)
    try {
      const res = await fetchCompanies({ page: pagination.page, limit: pagination.limit, search, status: statusFilter, plan: planFilter })
      setItems(res.items)
      setPagination(res.pagination)
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  const loadPlanOptions = async () => {
    try {
      const response = await listPlans({ page: 1, limit: 200, search: '' })
      const activePlans = (response?.items || []).filter((item) => item.status === 'active')
      if (activePlans.length > 0) {
        const normalized = activePlans.map((plan) => ({
          value: plan.name,
          label: plan.name
        }))
        setPlanOptions(normalized)
      }
    } catch (_error) {
      // Keep existing fallback options to avoid blocking company creation.
    }
  }

  useEffect(() => {
    loadCompanies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, search, statusFilter, planFilter])

  useEffect(() => {
    loadPlanOptions()
  }, [])

  useEffect(() => {
    if (!page || !sectionByPage[page]) return
    const timer = setTimeout(() => {
      const element = document.getElementById(sectionByPage[page])
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => clearTimeout(timer)
  }, [page])

  const companyRows = useMemo(() => items.map((item) => ({
    id: item.id,
    companyName: item.companyName,
    companyCode: item.companyCode,
    industry: item.industry,
    email: item.email,
    phone: item.phone,
    plan: item.plan,
    status: item.status,
    employees: item.employees || 0,
    createdDate: new Date(item.createdAt).toLocaleDateString()
  })), [items])

  const openAdd = () => {
    setSelectedId('')
    setForm(defaultForm)
    setCompanyCodeManuallySet(false)
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = async (row) => {
    try {
      const res = await getCompanyById(row.id)
      setSelectedId(row.id)
      setForm({ ...defaultForm, ...res.item })
      setCompanyCodeManuallySet(true)
      syncSelectedCompany(res.item)
      setFormErrors({})
      setModalOpen(true)
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to load company')
    }
  }

  const validateCompanyForm = () => {
    const errors = {}
    if (!form.companyName?.trim()) errors.companyName = 'Company name is required'
    if (!form.companyCode?.trim()) errors.companyCode = 'Company code is required'
    if (!form.industry?.trim()) errors.industry = 'Industry is required'
    if (!form.email?.trim()) errors.email = 'Email is required'
    if (!form.phone?.trim()) errors.phone = 'Phone is required'
    if (!form.plan?.trim()) errors.plan = 'Plan is required'

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (form.email && !emailRegex.test(form.email)) errors.email = 'Invalid email format'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const saveCompany = async (event) => {
    if (event) event.preventDefault()
    if (!validateCompanyForm()) {
      showError('Please fix highlighted fields')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) return showError('Invalid email format')

    try {
      if (selectedId) {
        const res = await updateCompany(selectedId, form)
        syncSelectedCompany(res.item)
        showSuccess('Company updated successfully')
      } else {
        const res = await createCompany(form)
        syncSelectedCompany(res.item)
        setActivityLogs([])
        setProfileTab('Overview')
        showSuccess('Company created successfully')
      }
      setModalOpen(false)
      await loadCompanies()
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to save company')
    }
  }

  const openProfile = async (row) => {
    try {
      const [companyRes, logsRes] = await Promise.all([getCompanyById(row.id), fetchCompanyActivityLogs(row.id)])
      syncSelectedCompany(companyRes.item)
      setActivityLogs(logsRes.items || [])
      setProfileTab('Overview')
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to load profile')
    }
  }

  const branchColumns = [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code' },
    { key: 'city', label: 'City' },
    { key: 'manager', label: 'Manager' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status' }
  ]

  const logColumns = [
    { key: 'action', label: 'Action' },
    { key: 'description', label: 'Description' },
    { key: 'dateTime', label: 'Date/Time' }
  ]

  const renderCompanyList = () => (
    <>
      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder="Search company name/code/email" />
          </div>
          <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }, { value: 'trial', label: 'Trial' }, { value: 'expired', label: 'Expired' }]} />
          <FilterDropdown label="Plan" value={planFilter} onChange={setPlanFilter} options={[{ value: 'all', label: 'All' }, { value: 'Starter', label: 'Starter' }, { value: 'Growth', label: 'Growth' }, { value: 'Enterprise', label: 'Enterprise' }]} />
        </div>
      </div>
      <div className="panel">
        <div className="panel-head">
          <h3>Company List</h3>
        </div>
        {loading ? <LoadingSkeleton rows={8} /> : (
          <>
            <DataTable columns={companyColumns} rows={companyRows} onView={openProfile} onEdit={openEdit} onDelete={(row) => { setTargetCompany(row); setConfirmOpen(true) }} />
            <div className="pagination-row">
              <Button variant="ghost" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>Prev</Button>
              <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
              <Button variant="ghost" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Next</Button>
            </div>
          </>
        )}
      </div>
    </>
  )

  const renderProfile = () => {
    if (!profileData) return <EmptyState title="Select a company from Company List and click View" description="Company profile appears here with tabs." />

    const tabs = ['Overview', 'Branches', 'Admins', 'Subscription', 'Storage', 'Activity Logs', 'Settings']

    return (
      <div className="panel">
        <div className="panel-head">
          <h3>{profileData.companyName} Profile</h3>
          <div className="actions-row">{tabs.map((tab) => <Button key={tab} variant={profileTab === tab ? 'primary' : 'ghost'} onClick={() => setProfileTab(tab)}>{tab}</Button>)}</div>
        </div>

        {profileTab === 'Overview' ? <div className="form-grid"><div><strong>Code:</strong> {profileData.companyCode}</div><div><strong>Industry:</strong> {profileData.industry}</div><div><strong>Email:</strong> {profileData.email}</div><div><strong>Phone:</strong> {profileData.phone}</div></div> : null}
        {profileTab === 'Branches' ? <DataTable columns={branchColumns} rows={(profileData.branches || []).map((b) => ({ ...b, id: b._id }))} showActions={false} /> : null}
        {profileTab === 'Admins' ? <p>Admins integration available via Admin Management module.</p> : null}
        {profileTab === 'Subscription' ? <div className="form-grid"><div><strong>Plan:</strong> {profileData.plan}</div><div><strong>Status:</strong> {profileData.status}</div><div><strong>Employee Limit:</strong> {profileData.employeeLimit}</div></div> : null}
        {profileTab === 'Storage' ? <div className="form-grid"><div><strong>Used Storage:</strong> {profileData.storageUsage?.usedStorage || 0} GB</div><div><strong>Storage Limit:</strong> {profileData.storageLimit} GB</div><div><strong>Documents:</strong> {profileData.storageUsage?.documentsCount || 0}</div><div><strong>Backup Size:</strong> {profileData.storageUsage?.backupSize || 0} GB</div></div> : null}
        {profileTab === 'Activity Logs' ? <DataTable columns={logColumns} rows={activityLogs.map((l) => ({ id: l._id, action: l.action, description: l.description, dateTime: new Date(l.dateTime).toLocaleString() }))} showActions={false} /> : null}
        {profileTab === 'Settings' ? <div className="form-grid"><div><strong>Timezone:</strong> {profileData.timezone}</div><div><strong>Currency:</strong> {profileData.currency}</div><div><strong>Domain:</strong> {profileData.domainSetup?.customDomain || '-'}</div></div> : null}
      </div>
    )
  }

  const renderStatus = () => (
    <div className="panel">
      <h3>Company Status</h3>
      <DataTable columns={companyColumns.filter((c) => ['companyName', 'plan', 'status'].includes(c.key))} rows={companyRows} showViewAction={false} onEdit={(row) => setTargetCompany(row)} showDeleteAction={false} />
      <div className="actions-row">
        {['active', 'inactive', 'suspended', 'trial', 'expired'].map((status) => <Button key={status} variant="ghost" onClick={async () => {
          try {
            const companyId = targetCompany?.id || getEffectiveCompanyId()
            if (!companyId) return showError('Select a company first from Company List')
            const res = await updateCompanyStatus(companyId, status)
            syncSelectedCompany(res.item)
            showSuccess(`Status updated to ${status}`)
            await loadCompanies()
          } catch (error) {
            showError(error?.response?.data?.message || 'Failed to update status')
          }
        }}>{status}</Button>)}
      </div>
    </div>
  )

  const renderBranding = () => (
    <div className="panel">
      <h3>Company Branding</h3>
      <FormInput label="Company ID" value={getEffectiveCompanyId()} onChange={(e) => setSelectedId(e.target.value)} />
      <div className="form-grid">
        <FormInput label="Logo URL" value={brandingForm.logoUrl} onChange={(e) => setBrandingForm((p) => ({ ...p, logoUrl: e.target.value }))} />
        <FormInput label="Primary Color" value={brandingForm.primaryColor} onChange={(e) => setBrandingForm((p) => ({ ...p, primaryColor: e.target.value }))} />
        <FormInput label="Secondary Color" value={brandingForm.secondaryColor} onChange={(e) => setBrandingForm((p) => ({ ...p, secondaryColor: e.target.value }))} />
        <FormInput label="Custom Domain" value={brandingForm.customDomain} onChange={(e) => setBrandingForm((p) => ({ ...p, customDomain: e.target.value }))} />
        <FormInput label="Login Page Branding" value={brandingForm.loginPageBranding} onChange={(e) => setBrandingForm((p) => ({ ...p, loginPageBranding: e.target.value }))} />
      </div>
      <Button onClick={async () => {
        try {
          const companyId = getEffectiveCompanyId()
          if (!companyId) return showError('Select a company first from Company List')
          const res = await updateBranding(companyId, brandingForm)
          syncSelectedCompany(res.item)
          showSuccess('Branding updated')
          await loadCompanies()
        } catch (error) {
          showError(error?.response?.data?.message || 'Failed to update branding')
        }
      }}>Save Branding</Button>
    </div>
  )

  const renderBranches = () => (
    <div className="panel">
      <h3>Branch Management</h3>
      <FormInput label="Company ID" value={getEffectiveCompanyId()} onChange={(e) => setSelectedId(e.target.value)} />
      <div className="form-grid">
        <FormInput label="Name" value={branchForm.name} onChange={(e) => setBranchForm((p) => ({ ...p, name: e.target.value }))} />
        <FormInput label="Code" value={branchForm.code} onChange={(e) => setBranchForm((p) => ({ ...p, code: e.target.value }))} />
        <FormInput label="Address" value={branchForm.address} onChange={(e) => setBranchForm((p) => ({ ...p, address: e.target.value }))} />
        <FormInput label="City" value={branchForm.city} onChange={(e) => setBranchForm((p) => ({ ...p, city: e.target.value }))} />
        <FormInput label="State" value={branchForm.state} onChange={(e) => setBranchForm((p) => ({ ...p, state: e.target.value }))} />
        <FormInput label="Manager" value={branchForm.manager} onChange={(e) => setBranchForm((p) => ({ ...p, manager: e.target.value }))} />
        <FormInput label="Phone" value={branchForm.phone} onChange={(e) => setBranchForm((p) => ({ ...p, phone: e.target.value }))} />
        <FilterDropdown label="Status" value={branchForm.status} onChange={(value) => setBranchForm((p) => ({ ...p, status: value }))} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }]} />
      </div>
      <div className="actions-row">
        <Button onClick={async () => {
          try {
            const companyId = getEffectiveCompanyId()
            if (!companyId) return showError('Select a company first from Company List')
            const res = await addBranch(companyId, branchForm)
            showSuccess('Branch added')
            setProfileData((p) => p ? { ...p, branches: res.branches } : p)
          } catch (error) {
            showError(error?.response?.data?.message || 'Failed to add branch')
          }
        }}>Add Branch</Button>
        <Button variant="danger" onClick={async () => {
          try {
            const companyId = getEffectiveCompanyId()
            if (!companyId || !profileData?.branches?.[0]) return showError('Load company profile first')
            const b = profileData.branches[0]
            const res = await deleteBranch(companyId, b._id)
            showSuccess('First branch deleted')
            setProfileData((p) => p ? { ...p, branches: res.branches } : p)
          } catch (error) {
            showError(error?.response?.data?.message || 'Failed to delete branch')
          }
        }}>Delete First Branch</Button>
      </div>
      {profileData?.branches?.length ? <DataTable columns={branchColumns} rows={profileData.branches.map((b) => ({ ...b, id: b._id }))} showViewAction={false} onEdit={async (row) => {
        try {
          const companyId = getEffectiveCompanyId()
          if (!companyId) return showError('Select a company first from Company List')
          const res = await updateBranch(companyId, row.id, { status: row.status === 'active' ? 'inactive' : 'active' })
          setProfileData((p) => p ? { ...p, branches: res.branches } : p)
          showSuccess('Branch updated')
        } catch (error) {
          showError(error?.response?.data?.message || 'Failed to update branch')
        }
      }} showDeleteAction={false} /> : <EmptyState title="No branches yet" description="Add branch using form." />}
    </div>
  )

  const renderStorage = () => (
    <div className="panel"><h3>Company Storage Usage</h3><DataTable columns={companyColumns.filter((c) => ['companyName', 'plan', 'status'].includes(c.key))} rows={companyRows} onView={openProfile} showEditAction={false} showDeleteAction={false} /><p>Open company profile and go to Storage tab for detailed metrics: used storage, limit, documents, backup size.</p></div>
  )

  const renderDomain = () => (
    <div className="panel">
      <h3>Company Domain Setup</h3>
      <FormInput label="Company ID" value={getEffectiveCompanyId()} onChange={(e) => setSelectedId(e.target.value)} />
      <div className="form-grid">
        <FormInput label="Custom Domain" value={domainForm.customDomain} onChange={(e) => setDomainForm((p) => ({ ...p, customDomain: e.target.value }))} />
        <FilterDropdown label="SSL Status" value={domainForm.sslStatus} onChange={(value) => setDomainForm((p) => ({ ...p, sslStatus: value }))} options={[{ value: 'pending', label: 'Pending' }, { value: 'active', label: 'Active' }, { value: 'failed', label: 'Failed' }]} />
        <FilterDropdown label="Verified" value={domainForm.verified ? 'yes' : 'no'} onChange={(value) => setDomainForm((p) => ({ ...p, verified: value === 'yes' }))} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
      </div>
      <Button onClick={async () => {
        try {
          const companyId = getEffectiveCompanyId()
          if (!companyId) return showError('Select a company first from Company List')
          const res = await updateDomain(companyId, domainForm)
          syncSelectedCompany(res.item)
          showSuccess('Domain setup updated')
          await loadCompanies()
        } catch (error) {
          showError(error?.response?.data?.message || 'Failed to update domain setup')
        }
      }}>Save Domain Setup</Button>
    </div>
  )

  const renderLogs = () => (
    <div className="panel"><h3>Company Activity Logs</h3>{profileData ? <DataTable columns={logColumns} rows={activityLogs.map((l) => ({ id: l._id, action: l.action, description: l.description, dateTime: new Date(l.dateTime).toLocaleString() }))} showActions={false} /> : <EmptyState title="Load company profile first" description="Go to Company List and click View." />}</div>
  )

  const renderConfig = () => <div className="panel"><h3>Company Configuration</h3><p>Use Edit Company to configure timezone, currency, limits, and status. Advanced flags are available in backend schema.</p></div>

  const renderSuspendReactivate = (mode) => (
    <div className="panel">
      <h3>{mode === 'suspend' ? 'Company Suspension' : 'Company Reactivation'}</h3>
      <FormInput label="Reason" value={suspensionReason} onChange={(e) => setSuspensionReason(e.target.value)} placeholder="Add reason" />
      <DataTable columns={companyColumns.filter((c) => ['companyName', 'status'].includes(c.key))} rows={companyRows} showViewAction={false} onEdit={(row) => setTargetCompany(row)} showDeleteAction={false} />
      <Button variant={mode === 'suspend' ? 'danger' : 'primary'} onClick={async () => {
        try {
          const companyId = targetCompany?.id || getEffectiveCompanyId()
          if (!companyId) return showError('Select a company first from Company List')
          const res = await updateCompanyStatus(companyId, mode === 'suspend' ? 'suspended' : 'active', suspensionReason)
          syncSelectedCompany(res.item)
          showSuccess(mode === 'suspend' ? 'Company suspended' : 'Company reactivated')
          await loadCompanies()
        } catch (error) {
          showError(error?.response?.data?.message || 'Failed to update company state')
        }
      }}>{mode === 'suspend' ? 'Confirm Suspension' : 'Confirm Reactivation'}</Button>
    </div>
  )

  const renderByPage = () => {
    switch (page) {
      case 'Company Management': return renderCompanyList()
      case 'Company List': return renderCompanyList()
      case 'Add Company':
        return (
          <div className="panel">
            <h3>Add Company</h3>
            <Button onClick={openAdd}>Open Add Company Form</Button>
            <div className="spacer" />
            <DataTable
              columns={companyColumns}
              rows={companyRows}
              showActions={false}
            />
          </div>
        )
      case 'Edit Company': return <div className="panel"><h3>Edit Company</h3><p>Click Edit on a company row to load details.</p>{renderCompanyList()}</div>
      case 'Company Profile': return renderProfile()
      case 'Company Status': return renderStatus()
      case 'Company Branding': return renderBranding()
      case 'Branch Management': return renderBranches()
      case 'Company Storage Usage': return renderStorage()
      case 'Company Domain Setup': return renderDomain()
      case 'Company Activity Logs': return renderLogs()
      case 'Company Configuration': return renderConfig()
      case 'Company Suspension': return renderSuspendReactivate('suspend')
      case 'Company Reactivation': return renderSuspendReactivate('reactivate')
      default: return renderCompanyList()
    }
  }

  return (
    <section className="section-layout company-management-page">
      <PageHeader
        title="Company Management"
        description="Single-page control center for tenant lifecycle, profile, branding, domain, branches, and governance."
        breadcrumb={['Super Admin', 'Company Management', page || 'Company Management']}
        primaryActionLabel="Add Company"
        onPrimaryAction={openAdd}
      />
      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}
      {renderByPage()}

      <Modal open={modalOpen} title={selectedId ? 'Edit Company' : 'Add Company'} onClose={() => setModalOpen(false)}>
        <form onSubmit={saveCompany}>
          <div className="form-grid">
            <FormInput
              label="Company Name"
              value={form.companyName}
              error={formErrors.companyName}
              onChange={(e) => {
                const companyName = e.target.value
                const derivedCode = companyName
                  .toUpperCase()
                  .replace(/[^A-Z0-9 ]/g, '')
                  .split(' ')
                  .filter(Boolean)
                  .map((part) => part.slice(0, 3))
                  .join('')
                  .slice(0, 8)
                setForm((p) => ({ ...p, companyName, companyCode: !selectedId && !companyCodeManuallySet ? derivedCode : p.companyCode }))
              }}
            />
            <FormInput
              label="Company Code"
              value={form.companyCode}
              error={formErrors.companyCode}
              onChange={(e) => {
                setCompanyCodeManuallySet(true)
                setForm((p) => ({ ...p, companyCode: e.target.value.toUpperCase() }))
              }}
              disabled={Boolean(selectedId)}
            />
            <FormInput label="Industry" value={form.industry} error={formErrors.industry} onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))} />
            <FormInput label="Email" value={form.email} error={formErrors.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            <FormInput label="Phone" value={form.phone} error={formErrors.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            <FormInput label="Address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
            <FormInput label="City" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
            <FormInput label="State" value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} />
            <FormInput label="Country" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
            <FormInput label="Timezone" value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))} />
            <FormInput label="Currency" value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} />
            <FormInput label="GST" value={form.gst} onChange={(e) => setForm((p) => ({ ...p, gst: e.target.value }))} />
            <FormInput label="PAN" value={form.pan} onChange={(e) => setForm((p) => ({ ...p, pan: e.target.value }))} />
            <FilterDropdown label="Plan" value={form.plan} onChange={(value) => setForm((p) => ({ ...p, plan: value }))} options={planOptions} />
            <FormInput label="Employee Limit" type="number" value={form.employeeLimit} onChange={(e) => setForm((p) => ({ ...p, employeeLimit: Number(e.target.value) }))} />
            <FormInput label="Storage Limit (GB)" type="number" value={form.storageLimit} onChange={(e) => setForm((p) => ({ ...p, storageLimit: Number(e.target.value) }))} />
            <FilterDropdown label="Status" value={form.status} onChange={(value) => setForm((p) => ({ ...p, status: value }))} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }, { value: 'trial', label: 'Trial' }, { value: 'expired', label: 'Expired' }]} />
          </div>
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Company</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Company"
        message={`Are you sure you want to delete ${targetCompany?.companyName || 'this company'}?`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          try {
            if (!targetCompany) return
            await deleteCompany(targetCompany.id)
            if ((selectedId || profileData?.id) === targetCompany.id) {
              setSelectedId('')
              setProfileData(null)
              setActivityLogs([])
            }
            setConfirmOpen(false)
            showSuccess('Company deleted')
            await loadCompanies()
          } catch (error) {
            showError(error?.response?.data?.message || 'Failed to delete company')
          }
        }}
      />
    </section>
  )
}

export default CompanyManagementModulePage

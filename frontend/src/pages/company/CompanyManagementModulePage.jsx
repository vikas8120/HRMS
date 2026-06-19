import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
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
  createCompany,
  deleteCompany,
  fetchCompanies,
  fetchCompanyActivityLogs,
  getCompanyById,
  updateBranding,
  updateCompany,
  updateCompanyStatus
} from '../../api/companyManagementApi'
import { listPlans } from '../../api/subscriptionBillingApi'

const fallbackPlanCatalog = [
  { value: 'Starter', label: 'Starter', employeeLimit: 50, storageLimit: 5 },
  { value: 'Growth', label: 'Growth', employeeLimit: 150, storageLimit: 25 },
  { value: 'Enterprise', label: 'Enterprise', employeeLimit: 500, storageLimit: 100 },
  { value: 'Custom', label: 'Custom', employeeLimit: 10, storageLimit: 5 }
]

const defaultForm = {
  companyName: '', companyCode: '', industry: '', email: '', phone: '', address: '', city: '', state: '',
  country: '', timezone: '', currency: '', gst: '', pan: '', plan: 'Starter', employeeLimit: 50, storageLimit: 5, status: 'active'
}
const defaultBrandingForm = { logoUrl: '', primaryColor: '#0f766e', secondaryColor: '#115e59', customDomain: '', loginPageBranding: '' }
const currencyOptions = [
  { value: '', label: 'Select Currency' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' }
]

const locationOptions = {
  India: {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun'],
    Assam: ['Guwahati', 'Dibrugarh', 'Silchar'],
    Bihar: ['Patna', 'Gaya', 'Muzaffarpur'],
    Chhattisgarh: ['Raipur', 'Bilaspur', 'Durg'],
    Goa: ['Panaji', 'Margao', 'Vasco da Gama'],
    Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
    Haryana: ['Gurugram', 'Faridabad', 'Panipat'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan'],
    Jharkhand: ['Ranchi', 'Jamshedpur', 'Dhanbad'],
    Karnataka: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi'],
    Kerala: ['Thiruvananthapuram', 'Kochi', 'Kozhikode'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur'],
    Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
    Manipur: ['Imphal', 'Thoubal'],
    Meghalaya: ['Shillong', 'Tura'],
    Mizoram: ['Aizawl', 'Lunglei'],
    Nagaland: ['Kohima', 'Dimapur'],
    Odisha: ['Bhubaneswar', 'Cuttack', 'Rourkela'],
    Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar'],
    Rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur'],
    Sikkim: ['Gangtok', 'Namchi'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
    Telangana: ['Hyderabad', 'Warangal', 'Nizamabad'],
    Tripura: ['Agartala', 'Udaipur'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Noida'],
    Uttarakhand: ['Dehradun', 'Haridwar', 'Haldwani'],
    'West Bengal': ['Kolkata', 'Siliguri', 'Durgapur'],
    'Andaman and Nicobar Islands': ['Port Blair'],
    Chandigarh: ['Chandigarh'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Silvassa'],
    Delhi: ['New Delhi'],
    Jammu: ['Jammu'],
    Kashmir: ['Srinagar'],
    Ladakh: ['Leh', 'Kargil'],
    Lakshadweep: ['Kavaratti'],
    Puducherry: ['Puducherry']
  },
  USA: {
    California: ['Los Angeles', 'San Francisco', 'San Diego'],
    Texas: ['Houston', 'Dallas', 'Austin'],
    'New York': ['New York City', 'Buffalo']
  },
  UAE: {
    Dubai: ['Dubai'],
    AbuDhabi: ['Abu Dhabi'],
    Sharjah: ['Sharjah']
  }
}

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
  'Company Storage Usage': 'company-storage-section',
  'Company Activity Logs': 'company-logs-section',
  'Company Configuration': 'company-config-section',
  'Company Suspension': 'company-suspend-section',
  'Company Reactivation': 'company-reactivate-section'
}
const COMPACT_ROW_LIMIT = 8
const companyModuleRoot = '/super-admin/company-management'
const companyWorkspaceGroups = [
  {
    title: 'Core',
    path: `${companyModuleRoot}/company-management`,
    items: [
      { label: 'Company Management', path: `${companyModuleRoot}/company-management` },
      { label: 'Company Branding', path: `${companyModuleRoot}/company-branding` },
      { label: 'Company Suspension', path: `${companyModuleRoot}/company-suspension` },
      { label: 'Company Reactivation', path: `${companyModuleRoot}/company-reactivation` }
    ]
  },
  {
    title: 'Operations',
    path: `${companyModuleRoot}/company-storage-usage`,
    items: [
      { label: 'Company Storage Usage', path: `${companyModuleRoot}/company-storage-usage` },
      { label: 'Company Activity Logs', path: `${companyModuleRoot}/company-activity-logs` }
    ]
  }
]

function CompanyManagementModulePage({ page }) {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ type: '', title: '', message: '' })
  const [planCatalog, setPlanCatalog] = useState(fallbackPlanCatalog)
  const planOptions = useMemo(
    () => planCatalog.map(({ value, label }) => ({ value, label })),
    [planCatalog]
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [form, setForm] = useState(defaultForm)
  const [formErrors, setFormErrors] = useState({})
  const [formSubmitError, setFormSubmitError] = useState('')
  const [companyCodeManuallySet, setCompanyCodeManuallySet] = useState(false)

  const [profileData, setProfileData] = useState(null)
  const [profileTab, setProfileTab] = useState('Overview')
  const [brandingForm, setBrandingForm] = useState(defaultBrandingForm)
  const [activityLogs, setActivityLogs] = useState([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editConfirmOpen, setEditConfirmOpen] = useState(false)
  const [pendingEditRow, setPendingEditRow] = useState(null)
  const [targetCompany, setTargetCompany] = useState(null)
  const [suspensionReason, setSuspensionReason] = useState('')
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [statusEditTarget, setStatusEditTarget] = useState(null)
  const [statusEditValue, setStatusEditValue] = useState('active')
  const [expandedTables, setExpandedTables] = useState({})
  const [storagePreview, setStoragePreview] = useState(null)
  const [configForm, setConfigForm] = useState({
    currency: '',
    employeeLimit: 0,
    storageLimit: 0,
    status: 'active',
    plan: 'Starter'
  })

  const showToast = (type, title, message = '') => setToast({ type, title, message })
  const showError = (message) => showToast('error', 'Action failed', message)
  const showSuccess = (title, message = '') => showToast('success', title, message)
  const normalizeId = (value) => String(value || '').trim()
  const normalizePlanKey = (value) => String(value || '').trim().toLowerCase()
  const resolvePlanLimits = (planName, fallback = defaultForm) => {
    const normalized = normalizePlanKey(planName)
    const match = planCatalog.find((plan) => normalizePlanKey(plan.value) === normalized || normalizePlanKey(plan.label) === normalized)
    return {
      employeeLimit: Number(match?.employeeLimit ?? fallback.employeeLimit ?? defaultForm.employeeLimit),
      storageLimit: Number(match?.storageLimit ?? fallback.storageLimit ?? defaultForm.storageLimit)
    }
  }
  const applyPlanDefaults = (planName, baseForm = defaultForm) => {
    const limits = resolvePlanLimits(planName, baseForm)
    return {
      ...baseForm,
      plan: planName || baseForm.plan || defaultForm.plan,
      employeeLimit: limits.employeeLimit,
      storageLimit: limits.storageLimit
    }
  }
  const getEffectiveCompanyId = () => normalizeId(selectedId || profileData?.id || profileData?._id || targetCompany?.id || '')
  const isTableExpanded = (key) => Boolean(expandedTables[key])
  const toggleTable = (key) => setExpandedTables((prev) => ({ ...prev, [key]: !prev[key] }))
  const tableRows = (key, rows = []) => (isTableExpanded(key) ? rows : rows.slice(0, COMPACT_ROW_LIMIT))
  const activeWorkspaceGroup = useMemo(() => {
    const normalizedPage = String(page || '').toLowerCase()
    return companyWorkspaceGroups.find((group) =>
      group.items.some((item) => item.label.toLowerCase() === normalizedPage)
    ) || companyWorkspaceGroups[0]
  }, [page])
  const syncSelectedCompany = (company) => {
    if (!company) return
    setSelectedId(normalizeId(company.id || company._id || ''))
    setProfileData(company)
    setBrandingForm(company.branding || defaultBrandingForm)
    const planName = company.plan || defaultForm.plan
    const planLimits = resolvePlanLimits(planName, company)
    setConfigForm({
      currency: company.currency || '',
      employeeLimit: planLimits.employeeLimit,
      storageLimit: planLimits.storageLimit,
      status: String(company.status || 'active').toLowerCase(),
      plan: planName
    })
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
      const activePlans = (response?.items || response?.plans || []).filter((item) => String(item.status || 'active').toLowerCase() === 'active' || !item.status)
      if (!activePlans.length) return
      const normalized = activePlans.map((plan) => ({
        value: plan.name || plan.type || plan.plan || 'Starter',
        label: plan.name || plan.type || plan.plan || 'Starter',
        employeeLimit: Number(plan.employeeLimit ?? plan.userLimit ?? plan.seatLimit ?? defaultForm.employeeLimit),
        storageLimit: Number(plan.storageLimit ?? defaultForm.storageLimit)
      }))
      const merged = [...normalized, ...fallbackPlanCatalog]
      const unique = merged.filter((item, index, array) => index === array.findIndex((entry) => String(entry.value).toLowerCase() === String(item.value).toLowerCase()))
      setPlanCatalog(unique)
    } catch (_error) {
      setPlanCatalog(fallbackPlanCatalog)
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
    id: normalizeId(item.id || item._id),
    companyName: item.companyName,
    companyCode: item.companyCode,
    industry: item.industry,
    email: item.email,
    phone: item.phone,
    plan: item.plan,
    status: item.status,
    employees: item.employees || 0,
    createdDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'
  })), [items])

  const countryDropdownOptions = useMemo(
    () => [{ value: '', label: 'Select Country' }, ...Object.keys(locationOptions).map((country) => ({ value: country, label: country }))],
    []
  )

  const stateDropdownOptions = useMemo(() => {
    const states = form.country ? Object.keys(locationOptions[form.country] || {}) : []
    return [{ value: '', label: 'Select State' }, ...states.map((state) => ({ value: state, label: state }))]
  }, [form.country])

  const cityDropdownOptions = useMemo(() => {
    const cities = form.country && form.state ? (locationOptions[form.country]?.[form.state] || []) : []
    return [{ value: '', label: 'Select City' }, ...cities.map((city) => ({ value: city, label: city }))]
  }, [form.country, form.state])

  const storageRows = useMemo(() => items.map((item) => ({
    id: normalizeId(item.id || item._id),
    companyName: item.companyName,
    plan: item.plan,
    status: item.status,
    usedStorage: Number(item.storageUsage?.usedStorage || 0),
    storageLimit: Number(item.storageLimit || 0),
    documentsCount: Number(item.storageUsage?.documentsCount || 0),
    backupSize: Number(item.storageUsage?.backupSize || 0)
  })), [items])
  const openAdd = () => {
    setSelectedId('')
    setForm(applyPlanDefaults(defaultForm.plan, defaultForm))
    setCompanyCodeManuallySet(false)
    setFormErrors({})
    setFormSubmitError('')
    setModalOpen(true)
  }

  const openEdit = async (row) => {
    try {
      const res = await getCompanyById(row.id)
      setSelectedId(row.id)
      setForm(applyPlanDefaults(res.item?.plan || defaultForm.plan, { ...defaultForm, ...res.item }))
      setCompanyCodeManuallySet(true)
      syncSelectedCompany(res.item)
      setFormErrors({})
      setFormSubmitError('')
      setModalOpen(true)
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to load company')
    }
  }

  const openStatusEdit = (row) => {
    setStatusEditTarget(row)
    setTargetCompany(row)
    setStatusEditValue(String(row?.status || 'active').toLowerCase())
    setStatusModalOpen(true)
  }

  const saveStatusOnly = async () => {
    if (!statusEditTarget?.id) return
    try {
      const reason = statusEditValue === 'suspended' ? suspensionReason : ''
      const res = await updateCompanyStatus(statusEditTarget.id, statusEditValue, reason)
      syncSelectedCompany(res.item)
      showSuccess(`Status updated to ${statusEditValue}`)
      setStatusModalOpen(false)
      await loadCompanies()
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to update status')
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
      setFormSubmitError('Please fix highlighted fields')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      setFormSubmitError('Invalid email format')
      return
    }

    try {
      setFormSubmitError('')
      const planDrivenValues = applyPlanDefaults(form.plan, form)
      const payload = { ...form, ...planDrivenValues }
      if (selectedId) {
        const res = await updateCompany(selectedId, payload)
        syncSelectedCompany(res.item)
        showSuccess('Company updated successfully')
      } else {
        const res = await createCompany(payload)
        syncSelectedCompany(res.item)
        setActivityLogs([])
        setProfileTab('Overview')
        showSuccess('Company created successfully')
      }
      setModalOpen(false)
      await loadCompanies()
    } catch (error) {
      setFormSubmitError(error?.response?.data?.message || 'Failed to save company')
    }
  }

  const openProfile = async (row) => {
    try {
      const companyId = normalizeId(row?.id || row?._id)
      if (!companyId) {
        showError('Company id missing for selected row')
        return
      }

      const companyRes = await getCompanyById(companyId)
      syncSelectedCompany(companyRes.item)

      try {
        const logsRes = await fetchCompanyActivityLogs(companyId)
        setActivityLogs(logsRes.items || [])
      } catch (_logsError) {
        setActivityLogs([])
      }

      setProfileTab('Overview')
    } catch (error) {
      showError(error?.response?.data?.message || 'Failed to load profile')
    }
  }

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
          <FilterDropdown label="Plan" value={planFilter} onChange={setPlanFilter} options={[{ value: 'all', label: 'All' }, ...planOptions]} />
        </div>
      </div>
      <div className="panel">
        <div className="panel-head">
          <h3>Company List</h3>
        </div>
        {loading ? <LoadingSkeleton rows={8} /> : (
          <>
            <DataTable columns={companyColumns} rows={tableRows('company-list', companyRows)} onView={openProfile} onEdit={(row) => { setPendingEditRow(row); setEditConfirmOpen(true) }} onDelete={(row) => { setTargetCompany(row); setConfirmOpen(true) }} showViewAction={false} />
            {companyRows.length > COMPACT_ROW_LIMIT ? (
              <div className="actions-row" style={{ marginTop: 8 }}>
                <Button variant="ghost" onClick={() => toggleTable('company-list')}>
                  {isTableExpanded('company-list') ? 'Show less' : `Show all (${companyRows.length})`}
                </Button>
              </div>
            ) : null}
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

    const tabs = ['Overview', 'Admins', 'Subscription', 'Storage', 'Activity Logs', 'Settings']

    return (
      <div className="panel">
        <div className="panel-head">
          <h3>{profileData.companyName} Profile</h3>
          <div className="actions-row">{tabs.map((tab) => <Button key={tab} variant={profileTab === tab ? 'primary' : 'ghost'} onClick={() => setProfileTab(tab)}>{tab}</Button>)}</div>
        </div>

        {profileTab === 'Overview' ? <div className="form-grid"><div><strong>Code:</strong> {profileData.companyCode}</div><div><strong>Industry:</strong> {profileData.industry}</div><div><strong>Email:</strong> {profileData.email}</div><div><strong>Phone:</strong> {profileData.phone}</div></div> : null}
        {profileTab === 'Admins' ? <p>Admins integration available via Admin Management module.</p> : null}
        {profileTab === 'Subscription' ? <div className="form-grid"><div><strong>Plan:</strong> {profileData.plan}</div><div><strong>Status:</strong> {profileData.status}</div><div><strong>Employee Limit:</strong> {profileData.employeeLimit}</div></div> : null}
        {profileTab === 'Storage' ? <div className="form-grid"><div><strong>Used Storage:</strong> {profileData.storageUsage?.usedStorage || 0} GB</div><div><strong>Storage Limit:</strong> {profileData.storageLimit} GB</div><div><strong>Documents:</strong> {profileData.storageUsage?.documentsCount || 0}</div><div><strong>Backup Size:</strong> {profileData.storageUsage?.backupSize || 0} GB</div></div> : null}
        {profileTab === 'Activity Logs' ? (
          <>
            <DataTable columns={logColumns} rows={tableRows('profile-logs', activityLogs.map((l) => ({ id: l._id, action: l.action, description: l.description, dateTime: new Date(l.dateTime).toLocaleString() })))} showActions={false} />
            {activityLogs.length > COMPACT_ROW_LIMIT ? (
              <div className="actions-row" style={{ marginTop: 8 }}>
                <Button variant="ghost" onClick={() => toggleTable('profile-logs')}>
                  {isTableExpanded('profile-logs') ? 'Show less' : `Show all (${activityLogs.length})`}
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
        {profileTab === 'Settings' ? <div className="form-grid"><div><strong>Timezone:</strong> {profileData.timezone}</div><div><strong>Currency:</strong> {profileData.currency}</div><div><strong>Domain:</strong> {profileData.domainSetup?.customDomain || '-'}</div></div> : null}
      </div>
    )
  }

  const renderStatus = () => (
    <div className="panel">
      <h3>Company Status</h3>
      <DataTable columns={companyColumns.filter((c) => ['companyName', 'plan', 'status'].includes(c.key))} rows={tableRows('status-table', companyRows)} showViewAction={false} onEdit={openStatusEdit} showDeleteAction={false} />
      {companyRows.length > COMPACT_ROW_LIMIT ? (
        <div className="actions-row" style={{ marginTop: 8 }}>
          <Button variant="ghost" onClick={() => toggleTable('status-table')}>
            {isTableExpanded('status-table') ? 'Show less' : `Show all (${companyRows.length})`}
          </Button>
        </div>
      ) : null}
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
      <FilterDropdown
        label="Company"
        value={getEffectiveCompanyId()}
        onChange={async (value) => {
          const nextId = normalizeId(value)
          setSelectedId(nextId)
          if (!nextId) {
            setProfileData(null)
            setBrandingForm(defaultBrandingForm)
            return
          }
          try {
            const res = await getCompanyById(nextId)
            syncSelectedCompany(res.item)
          } catch (error) {
            showError(error?.response?.data?.message || 'Failed to load company')
          }
        }}
        options={[
          { value: '', label: 'Select Company' },
          ...companyRows.map((company) => ({ value: normalizeId(company.id), label: `${company.companyName} (${company.companyCode})` }))
        ]}
      />
      <div className="form-grid">
        <FormInput label="Logo URL" value={brandingForm.logoUrl} onChange={(e) => setBrandingForm((p) => ({ ...p, logoUrl: e.target.value }))} />
        <FormInput label="Custom Domain" value={brandingForm.customDomain} onChange={(e) => setBrandingForm((p) => ({ ...p, customDomain: e.target.value }))} />
        <FormInput label="Login Page Branding" value={brandingForm.loginPageBranding} onChange={(e) => setBrandingForm((p) => ({ ...p, loginPageBranding: e.target.value }))} />
      </div>
      <div className="form-grid" style={{ marginBottom: 12 }}>
        <div>
          <strong>Company</strong>
          <p>{profileData?.companyName || 'No company selected'}</p>
        </div>
      </div>
      <Button onClick={async () => {
        try {
          const companyId = getEffectiveCompanyId()
          if (!companyId) return showError('Select a company first from Company List')
          const urlRegex = /^(https?:\/\/)[^\s]+$/i
          const domainRegex = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/
          if (brandingForm.logoUrl && !urlRegex.test(brandingForm.logoUrl)) return showError('Logo URL must start with http:// or https://')
          if (brandingForm.customDomain && !domainRegex.test(brandingForm.customDomain)) return showError('Custom domain format is invalid')
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

  const renderStorage = () => (
    <div className="panel">
      <h3>Company Storage Usage</h3>
      <DataTable
        columns={[
          { key: 'companyName', label: 'Company Name' },
          { key: 'usedStorage', label: 'Used (GB)' },
          { key: 'storageLimit', label: 'Limit (GB)' },
          { key: 'documentsCount', label: 'Documents' },
          { key: 'backupSize', label: 'Backup (GB)' },
          { key: 'status', label: 'Status' }
        ]}
        rows={tableRows('storage-table', storageRows)}
        onView={(row) => {
          setStoragePreview(row)
          setTargetCompany(row)
        }}
        showEditAction={false}
        showDeleteAction={false}
      />
      {storageRows.length > COMPACT_ROW_LIMIT ? (
        <div className="actions-row" style={{ marginTop: 8 }}>
          <Button variant="ghost" onClick={() => toggleTable('storage-table')}>
            {isTableExpanded('storage-table') ? 'Show less' : `Show all (${storageRows.length})`}
          </Button>
        </div>
      ) : null}
      {storagePreview ? (
        <div className="form-grid" style={{ marginTop: 12 }}>
          <div><strong>Company:</strong> {storagePreview.companyName}</div>
          <div><strong>Plan:</strong> {storagePreview.plan || '-'}</div>
          <div><strong>Used Storage:</strong> {storagePreview.usedStorage} GB</div>
          <div><strong>Storage Limit:</strong> {storagePreview.storageLimit} GB</div>
          <div><strong>Documents:</strong> {storagePreview.documentsCount}</div>
          <div><strong>Backup Size:</strong> {storagePreview.backupSize} GB</div>
        </div>
      ) : null}
      <p>Select a row with View to inspect storage details quickly.</p>
    </div>
  )

  const renderLogs = () => (
    <div className="panel">
      <h3>Company Activity Logs</h3>
      <FilterDropdown
        label="Company"
        value={getEffectiveCompanyId()}
        onChange={async (value) => {
          const nextId = normalizeId(value)
          setSelectedId(nextId)
          if (!nextId) {
            setProfileData(null)
            setActivityLogs([])
            return
          }
          try {
            const [companyRes, logsRes] = await Promise.all([getCompanyById(nextId), fetchCompanyActivityLogs(nextId)])
            syncSelectedCompany(companyRes.item)
            setActivityLogs(logsRes.items || [])
          } catch (error) {
            setActivityLogs([])
            showError(error?.response?.data?.message || 'Failed to load company activity logs')
          }
        }}
        options={[
          { value: '', label: 'Select Company' },
          ...companyRows.map((company) => ({ value: normalizeId(company.id), label: `${company.companyName} (${company.companyCode})` }))
        ]}
      />

      {getEffectiveCompanyId() ? (
        <>
          <DataTable
            columns={logColumns}
            rows={tableRows('company-activity-table', activityLogs.map((l) => ({ id: l._id, action: l.action, description: l.description, dateTime: new Date(l.dateTime).toLocaleString() })))}
            showActions={false}
            emptyTitle="No activity logs yet"
            emptyDescription="This company has no logged actions yet."
          />
          {activityLogs.length > COMPACT_ROW_LIMIT ? (
            <div className="actions-row" style={{ marginTop: 8 }}>
              <Button variant="ghost" onClick={() => toggleTable('company-activity-table')}>
                {isTableExpanded('company-activity-table') ? 'Show less' : `Show all (${activityLogs.length})`}
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState title="Select a company" description="Choose a company above to load activity logs." />
      )}
    </div>
  )

  const renderConfig = () => (
    <div className="panel">
      <h3>Company Configuration</h3>
      {profileData ? (
        <>
          <div className="form-grid">
            <FilterDropdown label="Currency" value={configForm.currency} onChange={(value) => setConfigForm((p) => ({ ...p, currency: value }))} options={currencyOptions} />
            <FormInput label="Employee Limit" type="number" value={configForm.employeeLimit} disabled />
            <FormInput label="Storage Limit (GB)" type="number" value={configForm.storageLimit} disabled />
            <FilterDropdown label="Plan" value={configForm.plan} onChange={(value) => setConfigForm((p) => ({ ...p, plan: value, ...resolvePlanLimits(value, p) }))} options={planOptions} />
            <FilterDropdown label="Status" value={configForm.status} onChange={(value) => setConfigForm((p) => ({ ...p, status: value }))} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }, { value: 'trial', label: 'Trial' }, { value: 'expired', label: 'Expired' }]} />
          </div>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => syncSelectedCompany(profileData)}>Reset</Button>
            <Button onClick={async () => {
              try {
                const companyId = getEffectiveCompanyId()
                if (!companyId) return showError('Select a company first')
                const planDrivenValues = resolvePlanLimits(configForm.plan, configForm)
                const res = await updateCompany(companyId, {
                  currency: configForm.currency,
                  employeeLimit: Number(planDrivenValues.employeeLimit || 0),
                  storageLimit: Number(planDrivenValues.storageLimit || 0),
                  status: configForm.status,
                  plan: configForm.plan
                })
                syncSelectedCompany(res.item)
                showSuccess('Company configuration updated')
                await loadCompanies()
              } catch (error) {
                showError(error?.response?.data?.message || 'Failed to update company configuration')
              }
            }}>Save Configuration</Button>
          </div>
        </>
      ) : null}
    </div>
  )

  const renderSuspendReactivate = (mode) => (
    <div className="panel">
      <h3>{mode === 'suspend' ? 'Company Suspension' : 'Company Reactivation'}</h3>
      <FilterDropdown
        label="Target Company"
        value={normalizeId(targetCompany?.id || '')}
        onChange={(value) => {
          const nextId = normalizeId(value)
          const picked = companyRows.find((row) => normalizeId(row.id) === nextId) || null
          setTargetCompany(picked)
        }}
        options={[
          { value: '', label: 'Select Company' },
          ...companyRows.map((company) => ({ value: normalizeId(company.id), label: `${company.companyName} (${company.companyCode})` }))
        ]}
      />
      <FormInput label="Reason" value={suspensionReason} onChange={(e) => setSuspensionReason(e.target.value)} placeholder="Add reason" />
      <DataTable
        columns={companyColumns.filter((c) => ['companyName', 'status'].includes(c.key))}
        rows={tableRows(`suspend-reactivate-${mode}`, companyRows)}
        showActions={false}
        showViewAction={false}
        showEditAction={false}
        showDeleteAction={false}
      />
      {companyRows.length > COMPACT_ROW_LIMIT ? (
        <div className="actions-row" style={{ marginTop: 8 }}>
          <Button variant="ghost" onClick={() => toggleTable(`suspend-reactivate-${mode}`)}>
            {isTableExpanded(`suspend-reactivate-${mode}`) ? 'Show less' : `Show all (${companyRows.length})`}
          </Button>
        </div>
      ) : null}
      <div className="suspend-summary-bar">
        <p>
          <strong>Selected:</strong> {targetCompany?.companyName || 'None'}
        </p>
        <Button disabled={!targetCompany?.id} variant={mode === 'suspend' ? 'danger' : 'primary'} onClick={async () => {
          try {
            const companyId = normalizeId(targetCompany?.id)
            if (!companyId) return showError('Select a company first')
            const res = await updateCompanyStatus(companyId, mode === 'suspend' ? 'suspended' : 'active', suspensionReason)
            syncSelectedCompany(res.item)
            setTargetCompany({ id: normalizeId(res.item?.id || res.item?._id), companyName: res.item?.companyName, status: res.item?.status })
            if (mode !== 'suspend') setSuspensionReason('')
            showSuccess(mode === 'suspend' ? 'Company suspended' : 'Company reactivated')
            await loadCompanies()
          } catch (error) {
            showError(error?.response?.data?.message || 'Failed to update company state')
          }
        }}>{mode === 'suspend' ? 'Confirm Suspension' : 'Confirm Reactivation'}</Button>
      </div>
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
      case 'Company Storage Usage': return renderStorage()
      case 'Company Activity Logs': return renderLogs()
      case 'Company Configuration': return renderConfig()
      case 'Company Suspension': return renderSuspendReactivate('suspend')
      case 'Company Reactivation': return renderSuspendReactivate('reactivate')
      default: return renderCompanyList()
    }
  }

  const pageBreadcrumb = page && page !== 'Company Management' ? page : null

  return (
    <section className="section-layout company-management-page">
      <PageHeader
        title="Company Management"
        description="Single-page control center for tenant lifecycle, profile, branding, storage, and governance."
        breadcrumb={['Super Admin', 'Company Management', pageBreadcrumb].filter(Boolean)}
        primaryActionLabel="Add Company"
        onPrimaryAction={openAdd}
      />

      <div className="workspace-nav company-workspace-nav" aria-label="Company category navigation">
        {companyWorkspaceGroups.map((group) => (
          <NavLink
            key={group.title}
            to={group.path}
            className={({ isActive }) => `workspace-nav-chip ${isActive || activeWorkspaceGroup.title === group.title ? 'active' : ''}`}
            data-group={group.title.toLowerCase()}
          >
            {group.title.toUpperCase()}
          </NavLink>
        ))}
      </div>

      <div className="workspace-subnav company-workspace-subnav" aria-label="Company module navigation">
        {activeWorkspaceGroup.items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `workspace-nav-chip ${isActive ? 'active' : ''}`}
            data-group={activeWorkspaceGroup.title.toLowerCase()}
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      {toast.title ? (
        <div className={`toast toast-${toast.type} company-action-toast`} role="status" aria-live="polite">
          <strong className="company-action-toast-title">{toast.title}</strong>
          {toast.message ? <p className="company-action-toast-detail">{toast.message}</p> : null}
        </div>
      ) : null}
      {renderByPage()}

      <Modal
        open={modalOpen}
        title={selectedId ? 'Edit Company' : 'Add Company'}
        onClose={() => setModalOpen(false)}
        modalClassName="company-form-shell"
        bodyClassName="company-form-body"
      >
        <form className="company-form-modal" onSubmit={saveCompany}>
          {formSubmitError ? (
            <div className="form-inline-alert form-inline-alert-error" role="alert">
              {formSubmitError}
            </div>
          ) : null}
          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Company Info</h4>
              <p>Start with key company identity details.</p>
            </div>
            <div className="form-grid company-form-grid">
              <FormInput
                label="Company Name *"
                placeholder="Ex: Acme Technologies Pvt Ltd"
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
              <div className="company-form-field">
                <FormInput
                  label="Company Code *"
                  placeholder="Ex: ACMTEC01"
                  value={form.companyCode}
                  error={formErrors.companyCode}
                  onChange={(e) => {
                    setCompanyCodeManuallySet(true)
                    setForm((p) => ({ ...p, companyCode: e.target.value.toUpperCase() }))
                  }}
                  disabled={Boolean(selectedId)}
                />
                <small className="field-hint">Uppercase, up to 8 characters.</small>
              </div>
              <FormInput label="Industry *" placeholder="Ex: IT Services" value={form.industry} error={formErrors.industry} onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))} />
              <FilterDropdown label="Status" value={form.status} onChange={(value) => setForm((p) => ({ ...p, status: value }))} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }, { value: 'trial', label: 'Trial' }, { value: 'expired', label: 'Expired' }]} />
            </div>
          </div>

          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Contact</h4>
              <p>Primary communication details for the tenant.</p>
            </div>
            <div className="form-grid company-form-grid">
              <div className="company-form-field">
                <FormInput label="Email *" placeholder="name@company.com" value={form.email} error={formErrors.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                <small className="field-hint">Business email only.</small>
              </div>
              <div className="company-form-field">
                <FormInput label="Phone *" placeholder="+91 98765 43210" value={form.phone} error={formErrors.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
                <small className="field-hint">Include country code.</small>
              </div>
              <FormInput label="Address" placeholder="Street, building, area" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
            </div>
          </div>

          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Location</h4>
              <p>Choose operational geography for this company.</p>
            </div>
            <div className="form-grid company-form-grid">
              <FilterDropdown
                label="Country"
                value={form.country}
                onChange={(value) => setForm((p) => ({ ...p, country: value, state: '', city: '' }))}
                options={countryDropdownOptions}
              />
              <FilterDropdown
                label="State"
                value={form.state}
                onChange={(value) => setForm((p) => ({ ...p, state: value, city: '' }))}
                options={stateDropdownOptions}
                disabled={!form.country}
              />
              <FilterDropdown
                label="City"
                value={form.city}
                onChange={(value) => setForm((p) => ({ ...p, city: value }))}
                options={cityDropdownOptions}
                disabled={!form.country || !form.state}
              />
              <FilterDropdown label="Currency" value={form.currency} onChange={(value) => setForm((p) => ({ ...p, currency: value }))} options={currencyOptions} />
            </div>
          </div>

          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Compliance</h4>
              <p>Tax and legal identity fields for invoicing.</p>
            </div>
            <div className="form-grid company-form-grid">
              <div className="company-form-field">
                <FormInput label="GST" placeholder="22AAAAA0000A1Z5" value={form.gst} onChange={(e) => setForm((p) => ({ ...p, gst: e.target.value.toUpperCase() }))} />
                <small className="field-hint">Format: 15 characters (India GSTIN).</small>
              </div>
              <div className="company-form-field">
                <FormInput label="PAN" placeholder="ABCDE1234F" value={form.pan} onChange={(e) => setForm((p) => ({ ...p, pan: e.target.value.toUpperCase() }))} />
                <small className="field-hint">Format: 5 letters + 4 digits + 1 letter.</small>
              </div>
            </div>
          </div>

          <div className="company-form-section">
            <div className="company-form-section-head">
              <h4>Plan & Limits</h4>
              <p>Configure subscription and usage limits.</p>
            </div>
            <div className="form-grid company-form-grid">
              <FilterDropdown label="Plan *" value={form.plan} onChange={(value) => setForm((p) => applyPlanDefaults(value, { ...p }))} options={planOptions} />
              <FormInput label="Employee Limit" type="number" min="0" value={form.employeeLimit} disabled />
              <FormInput label="Storage Limit (GB)" type="number" min="0" value={form.storageLimit} disabled />
            </div>
            <small className="field-hint">These values come from the selected subscription plan and are managed from Subscription & Billing.</small>
          </div>

          <div className="company-form-meta-note">
            <span>* Required fields</span>
            <span>Tip: You can update optional details later from Company Profile.</span>
          </div>
          <div className="modal-actions company-form-actions">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Company</Button>
          </div>
        </form>
      </Modal>

      <Modal open={statusModalOpen} title="Update Company Status" onClose={() => setStatusModalOpen(false)}>
        <div className="modal-form">
          <FormInput label="Company" value={statusEditTarget?.companyName || ''} disabled />
          <FilterDropdown
            label="Status"
            value={statusEditValue}
            onChange={setStatusEditValue}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'suspended', label: 'Suspended' },
              { value: 'expired', label: 'Expired' }
            ]}
          />
          {statusEditValue === 'suspended' ? (
            <FormInput
              label="Reason"
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              placeholder="Add suspension reason"
            />
          ) : null}
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setStatusModalOpen(false)}>Cancel</Button>
            <Button type="button" onClick={saveStatusOnly}>Update Status</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={editConfirmOpen}
        title="Edit Company"
        message={`Edit details for ${pendingEditRow?.companyName || 'this company'}?`}
        onCancel={() => setEditConfirmOpen(false)}
        onConfirm={async () => {
          if (pendingEditRow) await openEdit(pendingEditRow)
          setEditConfirmOpen(false)
          setPendingEditRow(null)
        }}
      />

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
            showSuccess('Delete completed', `${targetCompany.companyName || 'Company'} has been deleted successfully.`)
            await loadCompanies()
          } catch (error) {
            const responseData = error?.response?.data || {}
            const details = responseData?.details
            if (details && (details.linkedUsers || details.linkedSubscriptions || details.linkedGlobalUsers)) {
              showError(
                `Cannot delete company: linked records exist (users: ${details.linkedUsers || 0}, subscriptions: ${details.linkedSubscriptions || 0}, global users: ${details.linkedGlobalUsers || 0}).`
              )
            } else {
              showError(responseData?.message || 'Failed to delete company')
            }
          }
        }}
      />
    </section>
  )
}

export default CompanyManagementModulePage



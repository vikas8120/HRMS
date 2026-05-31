import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import FilterDropdown from '../../components/ui/FilterDropdown'
import EmptyState from '../../components/ui/EmptyState'
import StatCard from '../../components/ui/StatCard'
import FormInput from '../../components/ui/FormInput'
import { getFeatureFlags, updateFeatureFlags } from '../../api/featureManagementApi'
import { fetchCompanies } from '../../api/companyManagementApi'
import { companyAdminNavItems } from '../../data/companyAdminData'
import { hrNavItems } from '../../data/hrPortalData'
import { managerNavItems } from '../../data/managerPortalData'
import { employeeNavItems } from '../../data/employeePortalData'

const defaultFlags = {
  moduleEnableDisable: true,
  featureFlags: true,
  betaFeatures: false,
  tenantWiseFeatures: true,
  planWiseFeatures: true,
  apiFeatureAccess: true,
  customFeatureAccess: true,
  usageLimits: true,
  mobileAppAccess: true,
  whiteLabelControl: true,
  brandingAccess: true,
  aiFeatureAccess: true,
  premiumFeatureLock: false
}

const labels = {
  moduleEnableDisable: 'Module Enable/Disable',
  featureFlags: 'Feature Flags',
  betaFeatures: 'Beta Features',
  tenantWiseFeatures: 'Tenant-wise Features',
  planWiseFeatures: 'Plan-wise Features',
  apiFeatureAccess: 'API Feature Access',
  customFeatureAccess: 'Custom Feature Access',
  usageLimits: 'Usage Limits',
  mobileAppAccess: 'Mobile App Access',
  whiteLabelControl: 'White Label Control',
  brandingAccess: 'Branding Access',
  aiFeatureAccess: 'AI Feature Access',
  premiumFeatureLock: 'Premium Feature Lock'
}
const featureModuleRoot = '/super-admin/feature-management'
const featureWorkspaceGroups = [
  {
    title: 'Controls',
    path: `${featureModuleRoot}/module-enable-disable`,
    items: [
      { label: 'Feature Management', path: featureModuleRoot },
      { label: 'Module Enable/Disable', path: `${featureModuleRoot}/module-enable-disable` },
      { label: 'Feature Flags', path: `${featureModuleRoot}/feature-flags` },
      { label: 'Beta Features', path: `${featureModuleRoot}/beta-features` }
    ]
  },
  {
    title: 'Access',
    path: `${featureModuleRoot}/tenant-wise-features`,
    items: [
      { label: 'Tenant-wise Features', path: `${featureModuleRoot}/tenant-wise-features` },
      { label: 'Plan-wise Features', path: `${featureModuleRoot}/plan-wise-features` },
      { label: 'API Feature Access', path: `${featureModuleRoot}/api-feature-access` },
      { label: 'Custom Feature Access', path: `${featureModuleRoot}/custom-feature-access` },
      { label: 'AI Feature Access', path: `${featureModuleRoot}/ai-feature-access` },
      { label: 'Branding Access', path: `${featureModuleRoot}/branding-access` }
    ]
  },
  {
    title: 'Limits & Channels',
    path: `${featureModuleRoot}/usage-limits`,
    items: [
      { label: 'Usage Limits', path: `${featureModuleRoot}/usage-limits` },
      { label: 'Mobile App Access', path: `${featureModuleRoot}/mobile-app-access` },
      { label: 'White Label Control', path: `${featureModuleRoot}/white-label-control` },
      { label: 'Premium Feature Lock', path: `${featureModuleRoot}/premium-feature-lock` }
    ]
  }
]

const hiddenWorkspaceGroups = new Set(['Access'])
const hiddenWorkspaceItems = new Set([
  'Feature Flags',
  'Beta Features',
  'Mobile App Access',
  'White Label Control',
  'Premium Feature Lock'
])
const moduleRoleOptions = [
  { value: '', label: 'Select Role' },
  { value: 'company_admin', label: 'Company Admin' },
  { value: 'hr', label: 'HR' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employee' }
]
const moduleItemsByRole = {
  company_admin: companyAdminNavItems.map((item) => item.label),
  hr: hrNavItems.map((item) => item.label),
  manager: managerNavItems.map((item) => item.label),
  employee: employeeNavItems.map((item) => item.label)
}
const defaultUsageLimits = {
  maxEmployees: 500,
  maxHrUsers: 25,
  maxManagerUsers: 75,
  maxStorageGb: 250,
  monthlyPayrollRuns: 4,
  apiRequestsPerDay: 50000,
  monthlyReportExports: 2000,
  maxActiveDevices: 800
}
const usageLimitLabels = {
  maxEmployees: 'Max Employees',
  maxHrUsers: 'Max HR Users',
  maxManagerUsers: 'Max Manager Users',
  maxStorageGb: 'Max Storage (GB)',
  monthlyPayrollRuns: 'Monthly Payroll Runs',
  apiRequestsPerDay: 'API Requests / Day',
  monthlyReportExports: 'Monthly Report Exports',
  maxActiveDevices: 'Max Active Devices'
}

function FeatureManagementModulePage() {
  const { pathname } = useLocation()
  const [flags, setFlags] = useState(defaultFlags)
  const [baselineFlags, setBaselineFlags] = useState(defaultFlags)
  const [filter, setFilter] = useState('all')
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ type: '', message: '' })
  const [selectedRole, setSelectedRole] = useState('')
  const [roleModuleFlags, setRoleModuleFlags] = useState({})
  const [roleModuleBaseline, setRoleModuleBaseline] = useState({})
  const [usageLimits, setUsageLimits] = useState(defaultUsageLimits)
  const [usageLimitBaseline, setUsageLimitBaseline] = useState(defaultUsageLimits)
  const visibleWorkspaceGroups = useMemo(
    () => featureWorkspaceGroups.filter((group) => !hiddenWorkspaceGroups.has(group.title)),
    []
  )
  const flatWorkspaceItems = useMemo(
    () => visibleWorkspaceGroups
      .flatMap((group) => group.items)
      .filter((item) => !hiddenWorkspaceItems.has(item.label)),
    [visibleWorkspaceGroups]
  )
  const showModuleEnableDisableContent = pathname === `${featureModuleRoot}/module-enable-disable`
  const showUsageLimitsMinimalContent = pathname === `${featureModuleRoot}/usage-limits`
  const showMinimalTabContent = false

  const loadCompanies = async () => {
    try {
      const response = await fetchCompanies({ page: 1, limit: 500, search: '', status: 'all', plan: 'all' })
      setCompanies(response?.items || [])
    } catch (_error) {
      setCompanies([])
    }
  }

  const load = async (companyId = selectedCompanyId) => {
    setLoading(true)
    try {
      const res = await getFeatureFlags(companyId)
      const values = res?.data?.value && typeof res.data.value === 'object' ? res.data.value : {}
      const next = { ...defaultFlags, ...values }
      setFlags(next)
      setBaselineFlags(next)
    } catch (error) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Failed to load feature flags' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCompanies() }, [])
  useEffect(() => {
    if (!selectedCompanyId) {
      setFlags(defaultFlags)
      setBaselineFlags(defaultFlags)
      return
    }
    load(selectedCompanyId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId])
  useEffect(() => {
    if (!showModuleEnableDisableContent) return
    if (!selectedCompanyId || !selectedRole) {
      setRoleModuleFlags({})
      setRoleModuleBaseline({})
      return
    }
    const roleModules = moduleItemsByRole[selectedRole] || []
    const defaults = roleModules.reduce((acc, moduleName) => {
      acc[moduleName] = true
      return acc
    }, {})
    const storageKey = `feature-module-access:${selectedCompanyId}:${selectedRole}`
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || '{}')
      const next = { ...defaults, ...(saved && typeof saved === 'object' ? saved : {}) }
      setRoleModuleFlags(next)
      setRoleModuleBaseline(next)
    } catch (_error) {
      setRoleModuleFlags(defaults)
      setRoleModuleBaseline(defaults)
    }
  }, [selectedCompanyId, selectedRole, showModuleEnableDisableContent])
  useEffect(() => {
    if (!showUsageLimitsMinimalContent) return
    if (!selectedCompanyId) {
      setUsageLimits(defaultUsageLimits)
      setUsageLimitBaseline(defaultUsageLimits)
      return
    }
    const storageKey = `feature-usage-limits:${selectedCompanyId}`
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || '{}')
      const next = { ...defaultUsageLimits, ...(saved && typeof saved === 'object' ? saved : {}) }
      setUsageLimits(next)
      setUsageLimitBaseline(next)
    } catch (_error) {
      setUsageLimits(defaultUsageLimits)
      setUsageLimitBaseline(defaultUsageLimits)
    }
  }, [selectedCompanyId, showUsageLimitsMinimalContent])

  const rows = useMemo(() => {
    const allRows = Object.keys(labels).map((key) => ({
      key,
      label: labels[key],
      status: flags[key] ? 'Enabled' : 'Disabled'
    }))
    const byStatus = filter === 'enabled'
      ? allRows.filter((item) => item.status === 'Enabled')
      : filter === 'disabled'
        ? allRows.filter((item) => item.status === 'Disabled')
        : allRows
    return byStatus
  }, [flags, filter])

  const totalFeatures = Object.keys(labels).length
  const enabledCount = Object.values(flags).filter(Boolean).length
  const disabledCount = totalFeatures - enabledCount
  const hasPendingChanges = useMemo(
    () => Object.keys(labels).some((key) => Boolean(flags[key]) !== Boolean(baselineFlags[key])),
    [flags, baselineFlags]
  )

  const save = async () => {
    if (!selectedCompanyId) {
      setToast({ type: 'error', message: 'Please select a company first' })
      return
    }
    setLoading(true)
    try {
      await updateFeatureFlags(flags, selectedCompanyId)
      setBaselineFlags(flags)
      setToast({ type: 'success', message: 'Feature settings saved successfully' })
    } catch (error) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Failed to save feature settings' })
    } finally {
      setLoading(false)
    }
  }

  const setAllFlags = (nextValue) => {
    const updated = Object.keys(labels).reduce((acc, key) => {
      acc[key] = nextValue
      return acc
    }, {})
    setFlags(updated)
  }
  const roleModuleRows = useMemo(() => {
    const roleModules = moduleItemsByRole[selectedRole] || []
    return roleModules.map((name) => ({
      name,
      enabled: Boolean(roleModuleFlags[name])
    }))
  }, [selectedRole, roleModuleFlags])
  const roleModulesChanged = useMemo(
    () => Object.keys(roleModuleFlags).some((name) => Boolean(roleModuleFlags[name]) !== Boolean(roleModuleBaseline[name])),
    [roleModuleFlags, roleModuleBaseline]
  )
  const setAllRoleModules = (nextValue) => {
    setRoleModuleFlags((prev) => Object.keys(prev).reduce((acc, name) => {
      acc[name] = nextValue
      return acc
    }, {}))
  }
  const saveRoleModuleAccess = () => {
    if (!selectedCompanyId) {
      setToast({ type: 'error', message: 'Please select a company first' })
      return
    }
    if (!selectedRole) {
      setToast({ type: 'error', message: 'Please select a role first' })
      return
    }
    const storageKey = `feature-module-access:${selectedCompanyId}:${selectedRole}`
    window.localStorage.setItem(storageKey, JSON.stringify(roleModuleFlags))
    setRoleModuleBaseline(roleModuleFlags)
    setToast({ type: 'success', message: 'Role module access saved successfully' })
  }
  const usageLimitErrors = useMemo(
    () => Object.entries(usageLimits).reduce((acc, [key, value]) => {
      if (!Number.isFinite(Number(value)) || Number(value) < 0) acc[key] = 'Must be 0 or greater'
      return acc
    }, {}),
    [usageLimits]
  )
  const hasUsageLimitErrors = Object.keys(usageLimitErrors).length > 0
  const usageLimitsChanged = useMemo(
    () => Object.keys(defaultUsageLimits).some((key) => Number(usageLimits[key]) !== Number(usageLimitBaseline[key])),
    [usageLimits, usageLimitBaseline]
  )
  const usageLimitChangedCount = useMemo(
    () => Object.keys(defaultUsageLimits).filter((key) => Number(usageLimits[key]) !== Number(usageLimitBaseline[key])).length,
    [usageLimits, usageLimitBaseline]
  )
  const validationIssueCount = Object.keys(usageLimitErrors).length
  const selectedCompanyName = useMemo(() => {
    if (!selectedCompanyId) return 'No Company Selected'
    const found = companies.find((company) => (company._id || company.id) === selectedCompanyId)
    return found?.companyName || 'Selected Company'
  }, [selectedCompanyId, companies])
  const onUsageLimitChange = (key, value) => {
    const normalized = value === '' ? '' : Number(value)
    setUsageLimits((prev) => ({ ...prev, [key]: normalized }))
  }
  const resetUsageLimits = () => setUsageLimits(usageLimitBaseline)
  const restoreDefaultUsageLimits = () => setUsageLimits(defaultUsageLimits)
  const saveUsageLimits = () => {
    if (!selectedCompanyId) {
      setToast({ type: 'error', message: 'Please select a company first' })
      return
    }
    if (hasUsageLimitErrors) {
      setToast({ type: 'error', message: 'Please fix invalid usage limit values' })
      return
    }
    const payload = Object.keys(defaultUsageLimits).reduce((acc, key) => {
      acc[key] = Number(usageLimits[key] || 0)
      return acc
    }, {})
    const storageKey = `feature-usage-limits:${selectedCompanyId}`
    window.localStorage.setItem(storageKey, JSON.stringify(payload))
    setUsageLimits(payload)
    setUsageLimitBaseline(payload)
    setToast({ type: 'success', message: 'Usage limits saved successfully' })
  }

  return (
    <section className="section-layout feature-management-page">
      <PageHeader
        title="Feature Management"
        description="Manage platform feature toggles from persisted backend settings."
        breadcrumb={['Super Admin', 'Feature Management', 'Workspace']}
        primaryActionLabel="Refresh"
        onPrimaryAction={() => load(selectedCompanyId)}
      />
      <div className="workspace-subnav feature-workspace-subnav" aria-label="Feature module navigation">
        {flatWorkspaceItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === featureModuleRoot}
              className={({ isActive }) => `workspace-nav-chip ${isActive ? 'active' : ''}`}
              data-group="all-modules"
            >
              {item.label}
            </NavLink>
          ))}
      </div>

      {showModuleEnableDisableContent ? (
        <>
          {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}

          <div className="panel filters-panel">
            <div className="filters-row">
              <FilterDropdown
                label="Company"
                value={selectedCompanyId}
                onChange={(companyId) => {
                  setSelectedCompanyId(companyId)
                  setSelectedRole('')
                }}
                options={[{ value: '', label: 'Select Company' }, ...companies.map((company) => ({ value: company._id || company.id, label: company.companyName }))]}
              />
              <FilterDropdown
                label="Role"
                value={selectedRole}
                onChange={setSelectedRole}
                options={moduleRoleOptions}
              />
              <div className="actions-row">
                <Button variant="ghost" onClick={() => setAllRoleModules(true)} disabled={!selectedCompanyId || !selectedRole || !roleModuleRows.length}>Enable All</Button>
                <Button variant="ghost" onClick={() => setAllRoleModules(false)} disabled={!selectedCompanyId || !selectedRole || !roleModuleRows.length}>Disable All</Button>
                <Button variant="ghost" onClick={() => setRoleModuleFlags(roleModuleBaseline)} disabled={!roleModulesChanged}>Reset</Button>
                <Button onClick={saveRoleModuleAccess} disabled={!roleModulesChanged}>Save Changes</Button>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Role Module Access</h3></div>
            {!selectedCompanyId ? (
              <EmptyState title="Select company first" description="Choose a company to configure role module access." />
            ) : !selectedRole ? (
              <EmptyState title="Select role first" description="Choose role to view modules for enable/disable." />
            ) : roleModuleRows.length === 0 ? (
              <EmptyState title="No modules found" description="No modules are configured for this role." />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Module</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleModuleRows.map((row) => (
                      <tr key={row.name}>
                        <td>{row.name}</td>
                        <td>
                          <span className={`badge ${row.enabled ? 'badge-success' : 'badge-neutral'}`}>
                            {row.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td>
                          <Button
                            variant={row.enabled ? 'danger' : 'ghost'}
                            onClick={() => setRoleModuleFlags((prev) => ({ ...prev, [row.name]: !prev[row.name] }))}
                          >
                            {row.enabled ? 'Disable' : 'Enable'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : showUsageLimitsMinimalContent ? (
        <>
          {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}

          <div className="panel filters-panel">
            <div className="filters-row">
              <FilterDropdown
                label="Company"
                value={selectedCompanyId}
                onChange={setSelectedCompanyId}
                options={[{ value: '', label: 'Select Company' }, ...companies.map((company) => ({ value: company._id || company.id, label: company.companyName }))]}
              />
              <div className="actions-row">
                <Button variant="ghost" onClick={restoreDefaultUsageLimits} disabled={!selectedCompanyId}>Restore Defaults</Button>
                <Button variant="ghost" onClick={resetUsageLimits} disabled={!usageLimitsChanged}>Reset</Button>
                <Button onClick={saveUsageLimits} disabled={!selectedCompanyId || !usageLimitsChanged || hasUsageLimitErrors}>Save Changes</Button>
              </div>
            </div>
          </div>

          <div className="stats-grid premium-stats-grid">
            <StatCard
              title="Selected Company"
              value={selectedCompanyId ? selectedCompanyName : 'Not Selected'}
              trend={selectedCompanyId ? 'Limits are being edited for this company' : 'Please select a company first'}
              trendTone={selectedCompanyId ? 'info' : 'warning'}
            />
            <StatCard
              title="Changed Fields"
              value={String(usageLimitChangedCount)}
              trend={usageLimitChangedCount ? 'Unsaved limit fields changed' : 'No pending changes'}
              trendTone={usageLimitChangedCount ? 'warning' : 'success'}
            />
            <StatCard
              title="Validation Issues"
              value={String(validationIssueCount)}
              trend={validationIssueCount ? 'Fix invalid fields before saving' : 'All fields are valid'}
              trendTone={validationIssueCount ? 'warning' : 'success'}
            />
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Usage Limit Configuration</h3></div>
            {!selectedCompanyId ? (
              <EmptyState title="Select company first" description="Choose a company to configure usage limits." />
            ) : (
              <div className="form-grid">
                {Object.keys(defaultUsageLimits).map((key) => (
                  <FormInput
                    key={key}
                    label={usageLimitLabels[key]}
                    type="number"
                    value={String(usageLimits[key] ?? '')}
                    onChange={(event) => onUsageLimitChange(key, event.target.value)}
                    hint={usageLimitErrors[key] || ''}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : showMinimalTabContent ? (
        <div className="panel">
          <EmptyState
            title="Clean tab view enabled"
            description="Unnecessary page content is hidden for this tab."
          />
        </div>
      ) : (
        <>
          {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}

          <div className="stats-grid premium-stats-grid">
            <StatCard title="Total Features" value={String(totalFeatures)} trend="Platform controls" trendTone="info" />
            <StatCard title="Enabled" value={String(enabledCount)} trend="Currently active" trendTone="success" />
            <StatCard title="Disabled" value={String(disabledCount)} trend="Needs review" trendTone={disabledCount ? 'warning' : 'info'} />
            <StatCard title="Pending Changes" value={hasPendingChanges ? 'Yes' : 'No'} trend={hasPendingChanges ? 'Unsaved edits present' : 'All changes saved'} trendTone={hasPendingChanges ? 'warning' : 'success'} />
          </div>

          <div className="panel filters-panel">
            <div className="filters-row">
              <FilterDropdown
                label="Company"
                value={selectedCompanyId}
                onChange={setSelectedCompanyId}
                options={[{ value: '', label: 'Select Company' }, ...companies.map((company) => ({ value: company._id || company.id, label: company.companyName }))]}
              />
              <FilterDropdown
                label="Filter"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: 'All Features' },
                  { value: 'enabled', label: 'Enabled' },
                  { value: 'disabled', label: 'Disabled' }
                ]}
              />
              <div className="actions-row">
                <Button variant="ghost" onClick={() => setAllFlags(true)} disabled={loading}>Enable All</Button>
                <Button variant="ghost" onClick={() => setAllFlags(false)} disabled={loading}>Disable All</Button>
                <Button variant="ghost" onClick={() => setFlags(baselineFlags)} disabled={loading || !hasPendingChanges}>Reset</Button>
                <Button onClick={save} disabled={loading || !hasPendingChanges || !selectedCompanyId}>{loading ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Feature Flags</h3></div>
            {!selectedCompanyId ? (
              <EmptyState title="Select a company first" description="Choose a company to enable/disable its features." />
            ) : rows.length === 0 ? (
              <EmptyState title="No features found" description="Adjust filter to view all feature toggles." />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.key}>
                        <td>{row.label}</td>
                        <td>
                          <span className={`badge ${flags[row.key] ? 'badge-success' : 'badge-neutral'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <Button
                            variant={flags[row.key] ? 'danger' : 'ghost'}
                            onClick={() => setFlags((prev) => ({ ...prev, [row.key]: !prev[row.key] }))}
                          >
                            {flags[row.key] ? 'Disable' : 'Enable'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export default FeatureManagementModulePage

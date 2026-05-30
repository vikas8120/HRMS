import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import FilterDropdown from '../../components/ui/FilterDropdown'
import EmptyState from '../../components/ui/EmptyState'
import { getFeatureFlags, updateFeatureFlags } from '../../api/featureManagementApi'

const defaultFlags = {
  moduleEnableDisable: true,
  featureFlags: true,
  betaFeatures: false,
  usageLimits: true,
  mobileAppAccess: true,
  whiteLabelControl: true
}

const labels = {
  moduleEnableDisable: 'Module Enable/Disable',
  featureFlags: 'Feature Flags',
  betaFeatures: 'Beta Features',
  usageLimits: 'Usage Limits',
  mobileAppAccess: 'Mobile App Access',
  whiteLabelControl: 'White Label Control'
}
const featureModuleRoot = '/super-admin/feature-management'
const featureWorkspaceGroups = [
  {
    title: 'Controls',
    path: `${featureModuleRoot}/module-enable-disable`,
    items: [
      { label: 'Module Enable/Disable', path: `${featureModuleRoot}/module-enable-disable` },
      { label: 'Feature Flags', path: `${featureModuleRoot}/feature-flags` },
      { label: 'Beta Features', path: `${featureModuleRoot}/beta-features` }
    ]
  },
  {
    title: 'Limits & Channels',
    path: `${featureModuleRoot}/usage-limits`,
    items: [
      { label: 'Usage Limits', path: `${featureModuleRoot}/usage-limits` },
      { label: 'Mobile App Access', path: `${featureModuleRoot}/mobile-app-access` },
      { label: 'White Label Control', path: `${featureModuleRoot}/white-label-control` }
    ]
  }
]

function FeatureManagementModulePage() {
  const { pathname } = useLocation()
  const [flags, setFlags] = useState(defaultFlags)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ type: '', message: '' })
  const activeWorkspaceGroupIndex = useMemo(() => {
    const foundIndex = featureWorkspaceGroups.findIndex((group) =>
      group.items.some((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
    )
    return foundIndex >= 0 ? foundIndex : 0
  }, [pathname])
  const activeWorkspaceGroup = featureWorkspaceGroups[activeWorkspaceGroupIndex] || featureWorkspaceGroups[0]

  const load = async () => {
    setLoading(true)
    try {
      const res = await getFeatureFlags()
      const values = res?.data?.value && typeof res.data.value === 'object' ? res.data.value : {}
      setFlags({ ...defaultFlags, ...values })
    } catch (error) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Failed to load feature flags' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const rows = useMemo(() => {
    const allRows = Object.keys(labels).map((key) => ({
      key,
      label: labels[key],
      status: flags[key] ? 'Enabled' : 'Disabled'
    }))
    if (filter === 'enabled') return allRows.filter((item) => item.status === 'Enabled')
    if (filter === 'disabled') return allRows.filter((item) => item.status === 'Disabled')
    return allRows
  }, [flags, filter])

  const save = async () => {
    setLoading(true)
    try {
      await updateFeatureFlags(flags)
      setToast({ type: 'success', message: 'Feature settings saved successfully' })
    } catch (error) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Failed to save feature settings' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section-layout feature-management-page">
      <PageHeader
        title="Feature Management"
        description="Manage platform feature toggles from persisted backend settings."
        breadcrumb={['Super Admin', 'Feature Management', 'Workspace']}
        primaryActionLabel="Refresh"
        onPrimaryAction={load}
      />
      <div className="workspace-nav feature-workspace-nav" aria-label="Feature category navigation">
        {featureWorkspaceGroups.map((group) => (
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
      <div className="workspace-subnav feature-workspace-subnav" aria-label="Feature module navigation">
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

      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}

      <div className="panel filters-panel">
        <div className="filters-row">
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
          <Button onClick={save} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Feature Flags</h3></div>
        {rows.length === 0 ? (
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
                    <td>{row.status}</td>
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
    </section>
  )
}

export default FeatureManagementModulePage

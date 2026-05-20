import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import FilterDropdown from '../../components/ui/FilterDropdown'
import EmptyState from '../../components/ui/EmptyState'
import { getFeatureFlags, updateFeatureFlags } from '../../api/featureManagementApi'

const defaultFlags = {
  moduleEnableDisable: true,
  featureFlags: true,
  betaFeatures: false,
  tenantWiseFeatures: true,
  planWiseFeatures: true,
  apiFeatureAccess: true,
  usageLimits: true,
  mobileAppAccess: true,
  whiteLabelControl: true,
  aiFeatureAccess: true
}

const labels = {
  moduleEnableDisable: 'Module Enable/Disable',
  featureFlags: 'Feature Flags',
  betaFeatures: 'Beta Features',
  tenantWiseFeatures: 'Tenant-wise Features',
  planWiseFeatures: 'Plan-wise Features',
  apiFeatureAccess: 'API Feature Access',
  usageLimits: 'Usage Limits',
  mobileAppAccess: 'Mobile App Access',
  whiteLabelControl: 'White Label Control',
  aiFeatureAccess: 'AI Feature Access'
}

function FeatureManagementModulePage() {
  const [flags, setFlags] = useState(defaultFlags)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ type: '', message: '' })

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
    <section className="section-layout">
      <PageHeader
        title="Feature Management"
        description="Manage platform feature toggles from persisted backend settings."
        breadcrumb={['Super Admin', 'Feature Management', 'Workspace']}
        primaryActionLabel="Refresh"
        onPrimaryAction={load}
      />

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

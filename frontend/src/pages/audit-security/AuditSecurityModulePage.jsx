import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import FormInput from '../../components/ui/FormInput'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import { exportAuditLogs, listAuditLogs, listSecuritySettings, saveSecuritySetting, seedAuditLog } from '../../api/auditSecurityApi'

const logCategories = [
  'Login Logs',
  'User Activity Logs',
  'Company Activity Logs',
  'Admin Activity Logs',
  'API Logs',
  'Security Logs',
  'Configuration Changes',
  'Permission Changes',
  'Billing Logs',
  'IP Tracking',
  'Device Logs',
  'Export Logs'
]

const settingsGroups = [
  'Password Policies',
  'Two-Factor Authentication',
  'SSO Settings',
  'OAuth Settings',
  'IP Whitelisting',
  'Session Timeout',
  'Captcha Settings',
  'Token Expiry Settings',
  'Threat Monitoring'
]

const sectionByPage = Object.fromEntries([
  ...logCategories.map((name) => [name, 'audit-logs-section']),
  ...settingsGroups.map((name) => [name, 'audit-settings-section'])
])

function AuditSecurityModulePage({ page }) {
  const [logs, setLogs] = useState([])
  const [settings, setSettings] = useState([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 50, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ type: '', message: '' })
  const [editValues, setEditValues] = useState({})

  const toastError = (message) => setToast({ type: 'error', message })
  const toastOk = (message) => setToast({ type: 'success', message })

  const load = async () => {
    setLoading(true)
    try {
      const [logsRes, settingsRes] = await Promise.all([
        listAuditLogs({ category: categoryFilter, search, page: pagination.page, limit: pagination.limit }),
        listSecuritySettings()
      ])
      setLogs(logsRes.items)
      setPagination(logsRes.pagination)
      setSettings(settingsRes.items)

      const grouped = {}
      settingsRes.items.forEach((x) => { grouped[x.key] = x.value || {} })
      setEditValues(grouped)
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to load audit & security data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, categoryFilter, pagination.page])

  useEffect(() => {
    if (!page || !sectionByPage[page]) return
    const timer = setTimeout(() => {
      const element = document.getElementById(sectionByPage[page])
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => clearTimeout(timer)
  }, [page])

  const logCols = [
    { key: 'dateTime', label: 'Date/Time' },
    { key: 'category', label: 'Category' },
    { key: 'actorName', label: 'Actor' },
    { key: 'module', label: 'Module' },
    { key: 'action', label: 'Action' },
    { key: 'description', label: 'Description' },
    { key: 'ipAddress', label: 'IP' },
    { key: 'device', label: 'Device' }
  ]

  const logRows = useMemo(() => logs.map((x) => ({
    id: x._id,
    dateTime: new Date(x.dateTime).toLocaleString(),
    category: x.category,
    actorName: x.actorName || '-',
    module: x.module || '-',
    action: x.action,
    description: x.description || '-',
    ipAddress: x.ipAddress || '-',
    device: x.device || '-'
  })), [logs])

  const filteredSettings = categoryFilter === 'all'
    ? settings
    : settings.filter((x) => x.group === categoryFilter)

  const setSettingValue = (key, field, value) => {
    setEditValues((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value
      }
    }))
  }

  const renderBoolean = (settingKey, field, label) => (
    <FilterDropdown
      label={label}
      value={editValues?.[settingKey]?.[field] ? 'true' : 'false'}
      onChange={(value) => setSettingValue(settingKey, field, value === 'true')}
      options={[
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ]}
    />
  )

  const renderSettingForm = (setting) => {
    const value = editValues?.[setting.key] || {}

    if (setting.key === 'password_policy') {
      return (
        <div className="form-grid">
          <FormInput label="Minimum Length" type="number" value={Number(value.minLength || 0)} onChange={(e) => setSettingValue(setting.key, 'minLength', Number(e.target.value || 0))} />
          {renderBoolean(setting.key, 'requireUppercase', 'Require Uppercase')}
          {renderBoolean(setting.key, 'requireNumber', 'Require Number')}
        </div>
      )
    }

    if (setting.key === 'two_factor_auth') {
      return (
        <div className="form-grid">
          {renderBoolean(setting.key, 'enabled', '2FA Enabled')}
          <FormInput
            label="Methods (comma separated)"
            value={(value.methods || []).join(', ')}
            onChange={(e) => setSettingValue(setting.key, 'methods', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))}
          />
        </div>
      )
    }

    if (setting.key === 'sso_settings') {
      return (
        <div className="form-grid">
          {renderBoolean(setting.key, 'enabled', 'SSO Enabled')}
          <FormInput label="Provider" value={value.provider || ''} onChange={(e) => setSettingValue(setting.key, 'provider', e.target.value)} />
        </div>
      )
    }

    if (setting.key === 'oauth_settings') {
      return (
        <div className="form-grid">
          {renderBoolean(setting.key, 'enabled', 'OAuth Enabled')}
          <FormInput label="Client ID" value={value.clientId || ''} onChange={(e) => setSettingValue(setting.key, 'clientId', e.target.value)} />
          <FormInput label="Client Secret" value={value.clientSecret || ''} onChange={(e) => setSettingValue(setting.key, 'clientSecret', e.target.value)} />
        </div>
      )
    }

    if (setting.key === 'ip_whitelisting') {
      return (
        <div className="form-grid">
          {renderBoolean(setting.key, 'enabled', 'IP Whitelisting Enabled')}
          <FormInput
            label="Allowed IPs (comma separated)"
            value={(value.ips || []).join(', ')}
            onChange={(e) => setSettingValue(setting.key, 'ips', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))}
          />
        </div>
      )
    }

    if (setting.key === 'session_timeout') {
      return (
        <div className="form-grid">
          <FormInput label="Session Timeout (minutes)" type="number" value={Number(value.minutes || 0)} onChange={(e) => setSettingValue(setting.key, 'minutes', Number(e.target.value || 0))} />
        </div>
      )
    }

    if (setting.key === 'captcha_settings') {
      return (
        <div className="form-grid">
          {renderBoolean(setting.key, 'enabled', 'Captcha Enabled')}
          <FormInput label="Provider" value={value.provider || ''} onChange={(e) => setSettingValue(setting.key, 'provider', e.target.value)} />
        </div>
      )
    }

    if (setting.key === 'token_expiry_settings') {
      return (
        <div className="form-grid">
          <FormInput label="Access Token Expiry (minutes)" type="number" value={Number(value.accessTokenMinutes || 0)} onChange={(e) => setSettingValue(setting.key, 'accessTokenMinutes', Number(e.target.value || 0))} />
          <FormInput label="Refresh Token Expiry (days)" type="number" value={Number(value.refreshTokenDays || 0)} onChange={(e) => setSettingValue(setting.key, 'refreshTokenDays', Number(e.target.value || 0))} />
        </div>
      )
    }

    if (setting.key === 'threat_monitoring') {
      return (
        <div className="form-grid">
          {renderBoolean(setting.key, 'enabled', 'Threat Monitoring Enabled')}
          <FilterDropdown
            label="Alert Level"
            value={value.alertLevel || 'medium'}
            onChange={(alertLevel) => setSettingValue(setting.key, 'alertLevel', alertLevel)}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' }
            ]}
          />
        </div>
      )
    }

    return (
      <div className="form-grid">
        <FormInput
          label="Value"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => setEditValues((prev) => ({ ...prev, [setting.key]: e.target.value }))}
        />
      </div>
    )
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Audit & Security"
        description="Single-page governance workspace for logs, monitoring, and security policy settings."
        breadcrumb={['Super Admin', 'Audit & Security', 'Workspace']}
        primaryActionLabel="Refresh"
        onPrimaryAction={load}
      />
      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}
      {loading ? <div className="panel"><LoadingSkeleton rows={5} /></div> : null}

      <div className="panel">
        <div className="panel-head"><h3>All Audit & Security Controls In One Page</h3></div>
        <p>Operate platform audit trails and core security settings from this unified compliance workspace.</p>
      </div>

      <div id="audit-logs-section">
        <div className="panel filters-panel">
          <div className="filters-row">
            <div className="search-wrap"><label>Search Logs</label><SearchBar value={search} onChange={setSearch} placeholder="Search action/description/actor" /></div>
            <FilterDropdown label="Log Category" value={categoryFilter} onChange={setCategoryFilter} options={[{ value: 'all', label: 'All' }, ...logCategories.map((name) => ({ value: name, label: name }))]} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <h3>Audit Logs</h3>
            <div className="actions-row">
              <Button variant="ghost" onClick={async () => { try { await seedAuditLog({ category: categoryFilter === 'all' ? 'Security Logs' : categoryFilter, actorType: 'super_admin', actorName: 'Super Admin', module: 'Audit & Security', action: 'MANUAL_LOG', description: 'Manual log entry from unified workspace' }); toastOk('Audit log entry added'); load() } catch (error) { toastError(error?.response?.data?.message || 'Failed to add log entry') } }}>Add Audit Entry</Button>
              <Button onClick={async () => { try { const res = await exportAuditLogs(categoryFilter); toastOk(`Exported ${res.count || 0} logs`) } catch (error) { toastError(error?.response?.data?.message || 'Failed to export logs') } }}>Export Logs</Button>
            </div>
          </div>
          {loading ? <LoadingSkeleton rows={6} /> : <DataTable columns={logCols} rows={logRows} showActions={false} />}
          {!loading && logRows.length === 0 ? <EmptyState title="No audit logs found" /> : null}
          <div className="pagination-row">
            <Button variant="ghost" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>Prev</Button>
            <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
            <Button variant="ghost" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Next</Button>
          </div>
        </div>
      </div>

      <div id="audit-settings-section" className="panel">
        <div className="panel-head"><h3>Security Settings</h3></div>
        {filteredSettings.length === 0 ? <EmptyState title="No settings found for selected filter" /> : filteredSettings.map((s) => (
          <div key={s._id} className="panel" style={{ marginBottom: '10px' }}>
            <h4 style={{ marginTop: 0 }}>{s.group} / {s.key}</h4>
            <p style={{ color: 'var(--muted)' }}>{s.description || 'Configuration setting'}</p>
            {renderSettingForm(s)}
            <div className="actions-row" style={{ marginTop: '8px' }}>
              <Button onClick={async () => {
                try {
                  const res = await saveSecuritySetting({ key: s.key, group: s.group, value: editValues[s.key], description: s.description })
                  toastOk(res?.message || `${s.key} saved`)
                  load()
                } catch (error) {
                  toastError(error?.response?.data?.message || 'Failed to save security setting')
                }
              }}>Save Setting</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default AuditSecurityModulePage

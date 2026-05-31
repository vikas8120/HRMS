import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Button from '../../components/ui/Button'

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

const normalizeLabel = (value = '') => value.toLowerCase().replace(/[^a-z0-9]/g, '')
const AUDIT_STORAGE_KEY = 'hrms_frontend_audit_security_v1'

const initialLogs = [
  { id: 'log-1', dateTime: '2026-05-31T14:20:00.000Z', category: 'Security Logs', actorName: 'Super Admin', module: 'Audit & Security', action: 'POLICY_UPDATE', description: 'Updated session timeout from 20 to 30 minutes', ipAddress: '122.161.44.10', device: 'Chrome / Windows' },
  { id: 'log-2', dateTime: '2026-05-31T13:52:00.000Z', category: 'Login Logs', actorName: 'Platform Owner', module: 'Authentication', action: 'LOGIN_SUCCESS', description: 'Signed in with 2FA', ipAddress: '49.36.10.44', device: 'Edge / Windows' },
  { id: 'log-3', dateTime: '2026-05-31T11:05:00.000Z', category: 'IP Tracking', actorName: 'Risk Engine', module: 'Network Guard', action: 'BLOCKED_IP', description: 'Blocked repeated failed attempts from suspicious IP', ipAddress: '180.21.50.99', device: 'Server Event' }
]

const initialSettings = {
  'Password Policies': {
    minLength: 10,
    requireUppercase: true,
    requireNumeric: true,
    requireSymbol: true,
    expiryDays: 90
  },
  'Two-Factor Authentication': {
    mode: 'optional',
    backupCodes: true,
    trustedDeviceDays: 15
  },
  'SSO Settings': {
    enabled: false,
    provider: 'Azure AD',
    entityId: 'hrms-super-admin',
    callbackUrl: 'https://hrms.example.com/auth/sso/callback'
  },
  'OAuth Settings': {
    enabled: true,
    clientId: 'hrms-client-web',
    tokenTTLMinutes: 60,
    refreshTokenDays: 30
  },
  'IP Whitelisting': {
    enabled: true,
    ranges: '122.161.44.0/24\n49.36.10.0/24',
    enforceForAdmins: true
  },
  'Session Timeout': {
    idleTimeoutMinutes: 30,
    absoluteTimeoutHours: 10,
    forceLogoutOnPasswordChange: true
  },
  'Captcha Settings': {
    enabled: true,
    provider: 'reCAPTCHA v3',
    threshold: 0.5
  },
  'Token Expiry Settings': {
    accessTokenMinutes: 30,
    refreshTokenDays: 14,
    rotateOnUse: true
  },
  'Threat Monitoring': {
    bruteForceLimit: 5,
    lockoutMinutes: 30,
    notifyOnCritical: true
  }
}

function Field({ label, children }) {
  return (
    <label className="form-input-wrap" style={{ minWidth: 220 }}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function AuditSecurityModulePage({ page }) {
  const [logs, setLogs] = useState(() => {
    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed?.logs?.length ? parsed.logs : initialLogs
    } catch {
      return initialLogs
    }
  })
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [toast, setToast] = useState({ type: '', message: '' })
  const [settingsByGroup, setSettingsByGroup] = useState(() => {
    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed?.settingsByGroup ? parsed.settingsByGroup : initialSettings
    } catch {
      return initialSettings
    }
  })

  useEffect(() => {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify({ logs, settingsByGroup }))
  }, [logs, settingsByGroup])

  const activeLogCategory = useMemo(() => {
    const pageKey = normalizeLabel(page)
    if (pageKey === 'alllogs') return 'all'
    const matched = logCategories.find((item) => normalizeLabel(item) === pageKey)
    return matched || ''
  }, [page])

  const activeSettingsGroup = useMemo(() => {
    const pageKey = normalizeLabel(page)
    const matched = settingsGroups.find((item) => normalizeLabel(item) === pageKey)
    return matched || ''
  }, [page])

  const showLogsSection = !page || Boolean(activeLogCategory)
  const showSettingsSection = !page || Boolean(activeSettingsGroup)

  const visibleLogRows = useMemo(() => {
    const selected = activeLogCategory || categoryFilter
    const term = search.trim().toLowerCase()
    return logs
      .filter((row) => (selected === 'all' ? true : row.category === selected))
      .filter((row) => {
        if (!term) return true
        return [row.actorName, row.action, row.description, row.module, row.ipAddress].join(' ').toLowerCase().includes(term)
      })
      .map((x) => ({ ...x, dateTime: new Date(x.dateTime).toLocaleString() }))
  }, [logs, activeLogCategory, categoryFilter, search])

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

  const currentSettings = activeSettingsGroup ? settingsByGroup[activeSettingsGroup] : null

  const setGroupField = (group, key, value) => {
    setSettingsByGroup((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }))
  }

  const saveGroup = (groupName) => {
    setToast({ type: 'success', message: `${groupName} settings saved (frontend only)` })
    setTimeout(() => setToast({ type: '', message: '' }), 1800)
  }

  const addAuditEntry = () => {
    const selectedCategory = activeLogCategory || (categoryFilter === 'all' ? 'Security Logs' : categoryFilter)
    setLogs((prev) => [{
      id: `log-${Date.now()}`,
      dateTime: new Date().toISOString(),
      category: selectedCategory,
      actorName: 'Super Admin',
      module: 'Audit & Security',
      action: 'MANUAL_ENTRY',
      description: `Manual audit entry added in ${selectedCategory}`,
      ipAddress: '127.0.0.1',
      device: 'Frontend Session'
    }, ...prev])
    setToast({ type: 'success', message: 'Audit log entry added (frontend only)' })
    setTimeout(() => setToast({ type: '', message: '' }), 1800)
  }

  return (
    <section className="section-layout">
      <PageHeader
        title={page || 'Audit & Security'}
        description="Dedicated workspace for audit trails and security controls."
        breadcrumb={['Super Admin', 'Audit & Security', page || 'Workspace']}
        primaryActionLabel="Refresh"
        onPrimaryAction={() => setToast({ type: 'success', message: 'Refreshed (frontend state)' })}
      />

      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}

      {showLogsSection ? (
        <div id="audit-logs-section">
          <div className="panel filters-panel">
            <div className="filters-row">
              <div className="search-wrap"><label>Search Logs</label><SearchBar value={search} onChange={setSearch} placeholder="Search action/description/actor" /></div>
              <FilterDropdown
                label="Log Category"
                value={activeLogCategory || categoryFilter}
                onChange={setCategoryFilter}
                options={[{ value: 'all', label: 'All' }, ...logCategories.map((name) => ({ value: name, label: name }))]}
                disabled={Boolean(activeLogCategory && activeLogCategory !== 'all')}
              />
            </div>
          </div>
          <div className="panel">
            <div className="panel-head">
              <h3>{activeLogCategory && activeLogCategory !== 'all' ? `${activeLogCategory} Records` : 'Audit Logs'}</h3>
              <div className="actions-row">
                <Button variant="ghost" onClick={addAuditEntry}>Add Audit Entry</Button>
                <Button onClick={() => setToast({ type: 'success', message: `Exported ${visibleLogRows.length} logs (frontend)` })}>Export Logs</Button>
              </div>
            </div>
            <DataTable columns={logCols} rows={visibleLogRows} showActions={false} emptyTitle="No logs found" />
          </div>
        </div>
      ) : null}

      {showSettingsSection && activeSettingsGroup ? (
        <div id="audit-settings-section" className="panel">
          <div className="panel-head"><h3>{activeSettingsGroup}</h3></div>

          {activeSettingsGroup === 'Password Policies' ? (
            <div className="filters-row">
              <Field label="Minimum Length"><input className="form-input" type="number" value={currentSettings.minLength} onChange={(e) => setGroupField(activeSettingsGroup, 'minLength', Number(e.target.value))} /></Field>
              <Field label="Expiry (Days)"><input className="form-input" type="number" value={currentSettings.expiryDays} onChange={(e) => setGroupField(activeSettingsGroup, 'expiryDays', Number(e.target.value))} /></Field>
            </div>
          ) : null}

          {activeSettingsGroup === 'Two-Factor Authentication' ? (
            <div className="filters-row">
              <Field label="Mode">
                <select className="form-input" value={currentSettings.mode} onChange={(e) => setGroupField(activeSettingsGroup, 'mode', e.target.value)}>
                  <option value="disabled">Disabled</option>
                  <option value="optional">Optional</option>
                  <option value="mandatory">Mandatory</option>
                </select>
              </Field>
              <Field label="Trusted Device Days"><input className="form-input" type="number" value={currentSettings.trustedDeviceDays} onChange={(e) => setGroupField(activeSettingsGroup, 'trustedDeviceDays', Number(e.target.value))} /></Field>
            </div>
          ) : null}

          {activeSettingsGroup === 'SSO Settings' ? (
            <div className="filters-row">
              <Field label="Provider"><input className="form-input" value={currentSettings.provider} onChange={(e) => setGroupField(activeSettingsGroup, 'provider', e.target.value)} /></Field>
              <Field label="Entity ID"><input className="form-input" value={currentSettings.entityId} onChange={(e) => setGroupField(activeSettingsGroup, 'entityId', e.target.value)} /></Field>
              <Field label="Callback URL"><input className="form-input" value={currentSettings.callbackUrl} onChange={(e) => setGroupField(activeSettingsGroup, 'callbackUrl', e.target.value)} /></Field>
            </div>
          ) : null}

          {activeSettingsGroup === 'OAuth Settings' ? (
            <div className="filters-row">
              <Field label="Client ID"><input className="form-input" value={currentSettings.clientId} onChange={(e) => setGroupField(activeSettingsGroup, 'clientId', e.target.value)} /></Field>
              <Field label="Access Token TTL (min)"><input className="form-input" type="number" value={currentSettings.tokenTTLMinutes} onChange={(e) => setGroupField(activeSettingsGroup, 'tokenTTLMinutes', Number(e.target.value))} /></Field>
              <Field label="Refresh Token (days)"><input className="form-input" type="number" value={currentSettings.refreshTokenDays} onChange={(e) => setGroupField(activeSettingsGroup, 'refreshTokenDays', Number(e.target.value))} /></Field>
            </div>
          ) : null}

          {activeSettingsGroup === 'IP Whitelisting' ? (
            <div>
              <Field label="Allowed Ranges (one per line)"><textarea className="form-input" rows={5} value={currentSettings.ranges} onChange={(e) => setGroupField(activeSettingsGroup, 'ranges', e.target.value)} /></Field>
            </div>
          ) : null}

          {activeSettingsGroup === 'Session Timeout' ? (
            <div className="filters-row">
              <Field label="Idle Timeout (min)"><input className="form-input" type="number" value={currentSettings.idleTimeoutMinutes} onChange={(e) => setGroupField(activeSettingsGroup, 'idleTimeoutMinutes', Number(e.target.value))} /></Field>
              <Field label="Absolute Timeout (hours)"><input className="form-input" type="number" value={currentSettings.absoluteTimeoutHours} onChange={(e) => setGroupField(activeSettingsGroup, 'absoluteTimeoutHours', Number(e.target.value))} /></Field>
            </div>
          ) : null}

          {activeSettingsGroup === 'Captcha Settings' ? (
            <div className="filters-row">
              <Field label="Provider"><input className="form-input" value={currentSettings.provider} onChange={(e) => setGroupField(activeSettingsGroup, 'provider', e.target.value)} /></Field>
              <Field label="Threshold"><input className="form-input" type="number" step="0.1" value={currentSettings.threshold} onChange={(e) => setGroupField(activeSettingsGroup, 'threshold', Number(e.target.value))} /></Field>
            </div>
          ) : null}

          {activeSettingsGroup === 'Token Expiry Settings' ? (
            <div className="filters-row">
              <Field label="Access Token (min)"><input className="form-input" type="number" value={currentSettings.accessTokenMinutes} onChange={(e) => setGroupField(activeSettingsGroup, 'accessTokenMinutes', Number(e.target.value))} /></Field>
              <Field label="Refresh Token (days)"><input className="form-input" type="number" value={currentSettings.refreshTokenDays} onChange={(e) => setGroupField(activeSettingsGroup, 'refreshTokenDays', Number(e.target.value))} /></Field>
            </div>
          ) : null}

          {activeSettingsGroup === 'Threat Monitoring' ? (
            <div className="filters-row">
              <Field label="Brute Force Limit"><input className="form-input" type="number" value={currentSettings.bruteForceLimit} onChange={(e) => setGroupField(activeSettingsGroup, 'bruteForceLimit', Number(e.target.value))} /></Field>
              <Field label="Lockout (min)"><input className="form-input" type="number" value={currentSettings.lockoutMinutes} onChange={(e) => setGroupField(activeSettingsGroup, 'lockoutMinutes', Number(e.target.value))} /></Field>
            </div>
          ) : null}

          <div className="actions-row" style={{ marginTop: 12 }}>
            <Button onClick={() => saveGroup(activeSettingsGroup)}>Save Settings</Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default AuditSecurityModulePage

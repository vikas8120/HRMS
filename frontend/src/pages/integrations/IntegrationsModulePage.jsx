import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormInput from '../../components/ui/FormInput'
import FilterDropdown from '../../components/ui/FilterDropdown'
import DataTable from '../../components/ui/DataTable'

const INTEGRATIONS_STORAGE_KEY = 'hrms_frontend_integrations_v2'

const integrationGroups = {
  'Identity & Collaboration': ['Google Workspace', 'Microsoft 365', 'Slack', 'Zoom', 'Teams'],
  'Finance & Messaging': ['Payment Gateway', 'Accounting Software', 'Email Integration', 'SMS Gateway', 'WhatsApp API'],
  'Devices & APIs': ['Biometric Devices', 'Maps API', 'Webhooks', 'Third-party Marketplace']
}

const allProviders = Object.values(integrationGroups).flat()

const defaultCards = Object.entries(integrationGroups).flatMap(([group, names], gIdx) =>
  names.map((name, idx) => ({
    id: `int-${gIdx}-${idx}`,
    group,
    name,
    connected: idx % 3 === 0,
    status: idx % 3 === 0 ? 'active' : 'inactive',
    lastTestStatus: idx % 2 === 0 ? 'passed' : 'not-tested',
    lastTestAt: idx % 2 === 0 ? new Date(Date.now() - idx * 3600 * 1000).toISOString() : '',
    config: {
      endpoint: `https://api.${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.com`,
      apiKey: 'demo-key',
      environment: 'production'
    }
  }))
)

const defaultEvents = [
  { id: 'evt-1', provider: 'Biometric Devices', action: 'TEST', status: 'passed', actor: 'Super Admin', dateTime: '2026-05-31T15:00:00.000Z' },
  { id: 'evt-2', provider: 'Google Workspace', action: 'CONNECT', status: 'success', actor: 'Super Admin', dateTime: '2026-05-31T13:45:00.000Z' }
]

const providerFieldSchema = {
  'Biometric Devices': [
    { key: 'gatewayUrl', label: 'Gateway URL', placeholder: 'https://biometric-gateway.local' },
    { key: 'devicePort', label: 'Device Port', placeholder: '4370' },
    { key: 'syncInterval', label: 'Sync Interval (min)', placeholder: '15' }
  ],
  'Maps API': [
    { key: 'endpoint', label: 'Maps Endpoint', placeholder: 'https://maps.googleapis.com' },
    { key: 'apiKey', label: 'Maps API Key', placeholder: 'maps-key' },
    { key: 'geofenceRadius', label: 'Geofence Radius (m)', placeholder: '250' }
  ],
  Webhooks: [
    { key: 'endpoint', label: 'Callback URL', placeholder: 'https://app.example.com/webhook' },
    { key: 'secret', label: 'Webhook Secret', placeholder: 'whsec_...' },
    { key: 'retryCount', label: 'Retry Count', placeholder: '3' }
  ],
  'Third-party Marketplace': [
    { key: 'vendorId', label: 'Vendor ID', placeholder: 'marketplace-vendor-001' },
    { key: 'apiKey', label: 'Marketplace API Key', placeholder: 'market-key' },
    { key: 'environment', label: 'Environment', placeholder: 'production' }
  ]
}

function IntegrationsModulePage({ page }) {
  const [toast, setToast] = useState({ type: '', message: '' })
  const [integrations, setIntegrations] = useState(() => {
    try {
      const raw = localStorage.getItem(INTEGRATIONS_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed?.integrations?.length ? parsed.integrations : defaultCards
    } catch {
      return defaultCards
    }
  })
  const [events, setEvents] = useState(() => {
    try {
      const raw = localStorage.getItem(INTEGRATIONS_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed?.events?.length ? parsed.events : defaultEvents
    } catch {
      return defaultEvents
    }
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [form, setForm] = useState({ name: '', configText: '{}' })
  const [providerForm, setProviderForm] = useState({ endpoint: '', apiKey: '', environment: 'production' })

  useEffect(() => {
    localStorage.setItem(INTEGRATIONS_STORAGE_KEY, JSON.stringify({ integrations, events }))
  }, [integrations, events])

  const activeGroup = useMemo(() => {
    if (!page) return 'Identity & Collaboration'
    const found = Object.entries(integrationGroups).find(([, names]) => names.includes(page))
    return found?.[0] || 'Identity & Collaboration'
  }, [page])

  const isProviderPage = Boolean(page && allProviders.includes(page))
  const activeProvider = isProviderPage ? page : ''

  const groupItems = integrationGroups[activeGroup] || integrationGroups['Identity & Collaboration']
  const visibleCards = useMemo(() => integrations.filter((item) => groupItems.includes(item.name)), [integrations, groupItems])
  const activeProviderItem = integrations.find((item) => item.name === activeProvider) || null

  useEffect(() => {
    if (!activeProviderItem) return
    setProviderForm({
      endpoint: activeProviderItem.config?.endpoint || '',
      apiKey: activeProviderItem.config?.apiKey || '',
      environment: activeProviderItem.config?.environment || 'production'
    })
  }, [activeProviderItem?.id])

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast({ type: '', message: '' }), 1700)
  }

  const pushEvent = (provider, action, status = 'success') => {
    setEvents((prev) => [{ id: `evt-${Date.now()}`, provider, action, status, actor: 'Super Admin', dateTime: new Date().toISOString() }, ...prev])
  }

  const patchItem = (id, patch) => {
    setIntegrations((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const handleConnect = (item) => {
    patchItem(item.id, { connected: true, status: 'active' })
    pushEvent(item.name, 'CONNECT')
    showToast('success', `${item.name} connected`)
  }

  const handleDisconnect = (item) => {
    patchItem(item.id, { connected: false, status: 'inactive' })
    pushEvent(item.name, 'DISCONNECT')
    showToast('success', `${item.name} disconnected`)
  }

  const handleTest = (item) => {
    const passed = Math.random() > 0.2
    patchItem(item.id, { lastTestAt: new Date().toISOString(), lastTestStatus: passed ? 'passed' : 'failed' })
    pushEvent(item.name, 'TEST', passed ? 'passed' : 'failed')
    showToast(passed ? 'success' : 'error', `${item.name} test ${passed ? 'passed' : 'failed'}`)
  }

  const openConfig = (item) => {
    setSelectedId(item.id)
    setForm({ name: item.name, configText: JSON.stringify(item.config || {}, null, 2) })
    setModalOpen(true)
  }

  const selectedItem = integrations.find((x) => x.id === selectedId) || null

  const eventCols = [
    { key: 'provider', label: 'Provider' },
    { key: 'action', label: 'Action' },
    { key: 'status', label: 'Status' },
    { key: 'actor', label: 'Actor' },
    { key: 'dateTime', label: 'Date/Time' }
  ]

  const eventRows = useMemo(() => events
    .filter((evt) => {
      if (activeProvider) return evt.provider === activeProvider
      return groupItems.includes(evt.provider)
    })
    .map((evt) => ({ ...evt, dateTime: new Date(evt.dateTime).toLocaleString() })), [events, activeProvider, groupItems])

  return (
    <section className="section-layout">
      <PageHeader
        title={activeProvider || activeGroup}
        description="Frontend-only integration workspace with live connect, test, and configuration controls."
        breadcrumb={['Super Admin', 'Integrations', activeProvider || activeGroup]}
        primaryActionLabel="Refresh"
        onPrimaryAction={() => showToast('success', 'Refreshed (frontend state)')}
      />
      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}

      {!isProviderPage ? (
        <>
          <div className="panel">
            <div className="form-grid">
              <FilterDropdown label="Integration Group" value={activeGroup} onChange={() => {}} options={Object.keys(integrationGroups).map((g) => ({ value: g, label: g }))} disabled />
              <FormInput label="Visible Providers" value={`${visibleCards.length}`} disabled />
            </div>
          </div>

          <div id="integrations-list-section" className="permission-grid">
            {visibleCards.map((item) => (
              <div className="permission-card" key={item.id}>
                <h4>{item.name}</h4>
                <p style={{ color: 'var(--muted)' }}>Status: <strong>{item.status}</strong></p>
                <p style={{ color: 'var(--muted)' }}>Connected: {item.connected ? 'Yes' : 'No'}</p>
                <p style={{ color: 'var(--muted)' }}>Last Test: {item.lastTestAt ? new Date(item.lastTestAt).toLocaleString() : 'Never'} ({item.lastTestStatus})</p>
                <div className="actions-row" style={{ flexWrap: 'wrap' }}>
                  <Button onClick={() => openConfig(item)}>Configure</Button>
                  <Button variant="ghost" onClick={() => handleConnect(item)}>Connect</Button>
                  <Button variant="ghost" onClick={() => handleDisconnect(item)}>Disconnect</Button>
                  <Button variant="ghost" onClick={() => handleTest(item)}>Test</Button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {isProviderPage && activeProviderItem ? (
        <>
          <div className="panel">
            <h3>{activeProvider} Configuration</h3>
            <div className="form-grid">
              {(providerFieldSchema[activeProvider] || [
                { key: 'endpoint', label: 'Endpoint', placeholder: 'https://api.provider.com' },
                { key: 'apiKey', label: 'API Key', placeholder: 'api-key' },
                { key: 'environment', label: 'Environment', placeholder: 'production' }
              ]).map((field) => (
                <FormInput
                  key={field.key}
                  label={field.label}
                  value={providerForm[field.key] || ''}
                  placeholder={field.placeholder}
                  onChange={(e) => setProviderForm((p) => ({ ...p, [field.key]: e.target.value }))}
                />
              ))}
              <FilterDropdown label="Environment" value={providerForm.environment || 'production'} onChange={(v) => setProviderForm((p) => ({ ...p, environment: v }))} options={[{ value: 'production', label: 'Production' }, { value: 'staging', label: 'Staging' }, { value: 'sandbox', label: 'Sandbox' }]} />
            </div>
            <div className="actions-row" style={{ marginTop: 10 }}>
              <Button onClick={() => {
                patchItem(activeProviderItem.id, { config: providerForm })
                pushEvent(activeProvider, 'SAVE_CONFIG')
                showToast('success', `${activeProvider} config saved`)
              }}>Save Config</Button>
              <Button variant="ghost" onClick={() => handleConnect(activeProviderItem)}>Connect Provider</Button>
              <Button variant="ghost" onClick={() => handleDisconnect(activeProviderItem)}>Disable Provider</Button>
              <Button variant="ghost" onClick={() => handleTest(activeProviderItem)}>Run Health Test</Button>
            </div>
          </div>

          <div className="panel">
            <h3>{activeProvider} Activity</h3>
            <DataTable columns={eventCols} rows={eventRows} showActions={false} emptyTitle={`No activity found for ${activeProvider}`} />
          </div>
        </>
      ) : null}

      <Modal open={modalOpen} title={`Configure ${selectedItem?.name || 'Integration'}`} onClose={() => setModalOpen(false)}>
        <FormInput label="Integration Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        <label className="form-input-wrap"><span>Config JSON</span><textarea className="form-input" rows={8} value={form.configText} onChange={(e) => setForm((p) => ({ ...p, configText: e.target.value }))} /></label>
        <div className="actions-row">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            try {
              const parsed = JSON.parse(form.configText || '{}')
              setIntegrations((prev) => prev.map((item) => (item.id === selectedId ? { ...item, name: form.name, config: parsed } : item)))
              pushEvent(form.name, 'SAVE_CONFIG')
              showToast('success', 'Integration config saved')
              setModalOpen(false)
            } catch {
              showToast('error', 'Invalid JSON')
            }
          }}>Save</Button>
        </div>
      </Modal>
    </section>
  )
}

export default IntegrationsModulePage

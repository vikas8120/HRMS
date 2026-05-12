import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormInput from '../../components/ui/FormInput'
import EmptyState from '../../components/ui/EmptyState'
import { connectIntegration, createIntegration, disconnectIntegration, listIntegrations, testIntegration, updateIntegration } from '../../api/integrationsApi'

const sectionByPage = {
  'Biometric Devices': 'integrations-list-section',
  'Google Workspace': 'integrations-list-section',
  'Microsoft 365': 'integrations-list-section',
  Slack: 'integrations-list-section',
  Zoom: 'integrations-list-section',
  Teams: 'integrations-list-section',
  'Payment Gateway': 'integrations-list-section',
  'Accounting Software': 'integrations-list-section',
  'Email Integration': 'integrations-list-section',
  'SMS Gateway': 'integrations-list-section',
  'WhatsApp API': 'integrations-list-section',
  'Maps API': 'integrations-list-section',
  Webhooks: 'integrations-list-section',
  'Third-party Marketplace': 'integrations-list-section'
}

function IntegrationsModulePage({ page }) {
  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ type: '', message: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ name: '', configText: '{}' })

  const toastError = (message) => setToast({ type: 'error', message })
  const toastOk = (message) => setToast({ type: 'success', message })

  const loadIntegrations = async () => {
    setLoading(true)
    try {
      const res = await listIntegrations()
      setIntegrations(res.items)
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadIntegrations() }, [])

  useEffect(() => {
    if (!page || !sectionByPage[page]) return
    const timer = setTimeout(() => {
      const element = document.getElementById(sectionByPage[page])
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => clearTimeout(timer)
  }, [page])

  const cards = useMemo(() => integrations, [integrations])

  const openConfig = (item) => {
    setSelected(item)
    setForm({ name: item.name, configText: JSON.stringify(item.config || {}, null, 2) })
    setModalOpen(true)
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Integrations"
        description="Single-page integration hub for provider configuration, connection, health tests, and lifecycle actions."
        breadcrumb={['Super Admin', 'Integrations', 'Workspace']}
        primaryActionLabel="Refresh"
        onPrimaryAction={loadIntegrations}
      />
      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}
      {loading ? <div className="panel">Loading integrations...</div> : null}

      <div className="panel">
        <div className="panel-head"><h3>All Integration Controls In One Page</h3></div>
        <p>Connect, disconnect, test, and configure all external services from a unified page.</p>
      </div>

      <div id="integrations-list-section" className="permission-grid">
        {cards.map((item) => (
          <div className="permission-card" key={item._id}>
            <h4>{item.name}</h4>
            <p style={{ color: 'var(--muted)' }}>Status: <strong>{item.status}</strong></p>
            <p style={{ color: 'var(--muted)' }}>Connected: {item.connected ? 'Yes' : 'No'}</p>
            <p style={{ color: 'var(--muted)' }}>Last Test: {item.lastTestAt ? new Date(item.lastTestAt).toLocaleString() : 'Never'} ({item.lastTestStatus})</p>
            <div className="actions-row">
              <Button onClick={() => openConfig(item)}>Configure</Button>
              <Button variant="ghost" onClick={async () => { await connectIntegration(item._id, { placeholderKey: 'demo-value' }); toastOk(`${item.name} connected`); loadIntegrations() }}>Connect</Button>
              <Button variant="ghost" onClick={async () => { await disconnectIntegration(item._id); toastOk(`${item.name} disconnected`); loadIntegrations() }}>Disconnect</Button>
              <Button variant="ghost" onClick={async () => { const res = await testIntegration(item._id); toastOk(res.message || 'Test completed'); loadIntegrations() }}>Test</Button>
            </div>
          </div>
        ))}
      </div>
      {cards.length === 0 ? <EmptyState title="No integrations configured" description="Create a new integration entry." /> : null}

      <div className="panel">
        <h3>Create Custom Integration Entry</h3>
        <div className="actions-row"><Button onClick={async () => { const name = `Custom Integration ${Date.now()}`; await createIntegration({ name, category: 'custom' }); toastOk('Custom integration created'); loadIntegrations() }}>Add Integration</Button></div>
      </div>

      <Modal open={modalOpen} title={`Configure ${selected?.name || 'Integration'}`} onClose={() => setModalOpen(false)}>
        <FormInput label="Integration Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        <label className="form-input-wrap"><span>Config JSON (Placeholder only)</span><textarea className="form-input" rows={8} value={form.configText} onChange={(e) => setForm((p) => ({ ...p, configText: e.target.value }))} /></label>
        <div className="actions-row"><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={async () => {
          try {
            const parsed = JSON.parse(form.configText || '{}')
            if (selected) {
              await updateIntegration(selected._id, { name: form.name, config: parsed })
            }
            toastOk('Integration config saved')
            setModalOpen(false)
            loadIntegrations()
          } catch {
            toastError('Invalid JSON')
          }
        }}>Save</Button></div>
      </Modal>
    </section>
  )
}

export default IntegrationsModulePage

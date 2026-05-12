import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import FilterDropdown from '../../components/ui/FilterDropdown'
import EmptyState from '../../components/ui/EmptyState'
import { listSystemSettings, saveSystemSetting } from '../../api/systemSettingsApi'

const settingGroups = [
  'General Settings',
  'Email Settings',
  'SMS Settings',
  'WhatsApp Settings',
  'Notification Templates',
  'Timezone Settings',
  'Currency Settings',
  'Language Settings',
  'Theme Management',
  'Branding Settings',
  'Date Format',
  'File Upload Limits',
  'Maintenance Mode',
  'Application Version'
]

const sectionByPage = Object.fromEntries(settingGroups.map((group) => [group, 'system-settings-section']))

function SystemSettingsModulePage({ page }) {
  const [settings, setSettings] = useState([])
  const [values, setValues] = useState({})
  const [toast, setToast] = useState({ type: '', message: '' })
  const [groupFilter, setGroupFilter] = useState('all')

  const load = async () => {
    const res = await listSystemSettings()
    setSettings(res.items)
    const map = {}
    res.items.forEach((s) => { map[s.key] = JSON.stringify(s.value, null, 2) })
    setValues(map)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (settingGroups.includes(page)) setGroupFilter(page)
    if (!page || !sectionByPage[page]) return
    const timer = setTimeout(() => {
      const element = document.getElementById(sectionByPage[page])
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => clearTimeout(timer)
  }, [page])

  const filtered = useMemo(() => (groupFilter === 'all' ? settings : settings.filter((x) => x.group === groupFilter)), [settings, groupFilter])

  return (
    <section className="section-layout">
      <PageHeader
        title="System Settings"
        description="Single-page workspace to manage all platform configuration groups and persisted values."
        breadcrumb={['Super Admin', 'System Settings', 'Workspace']}
        primaryActionLabel="Refresh"
        onPrimaryAction={load}
      />
      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}

      <div className="panel">
        <div className="panel-head"><h3>All System Settings In One Page</h3></div>
        <p>Review and update all settings groups from one page using the group filter and JSON editors.</p>
      </div>

      <div id="system-settings-section" className="panel">
        <div className="filters-row">
          <FilterDropdown label="Settings Group" value={groupFilter} onChange={setGroupFilter} options={[{ value: 'all', label: 'All Groups' }, ...settingGroups.map((group) => ({ value: group, label: group }))]} />
        </div>

        {filtered.length === 0 ? <EmptyState title="No setting found for selected group" /> : filtered.map((s) => (
          <div className="panel" key={s._id} style={{ marginBottom: '10px' }}>
            <h4 style={{ marginTop: 0 }}>{s.group} / {s.key}</h4>
            <p style={{ color: 'var(--muted)' }}>{s.description || '-'}</p>
            <textarea className="form-input" rows={6} value={values[s.key] || ''} onChange={(e) => setValues((p) => ({ ...p, [s.key]: e.target.value }))} />
            <div className="actions-row" style={{ marginTop: '8px' }}><Button onClick={async () => {
              try {
                const parsed = JSON.parse(values[s.key] || '{}')
                await saveSystemSetting({ key: s.key, group: s.group, value: parsed, description: s.description })
                setToast({ type: 'success', message: `${s.key} saved` })
                load()
              } catch {
                setToast({ type: 'error', message: 'Invalid JSON format' })
              }
            }}>Save</Button></div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default SystemSettingsModulePage

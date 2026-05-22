import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import FilterDropdown from '../../components/ui/FilterDropdown'
import FormInput from '../../components/ui/FormInput'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import { listSystemSettings, saveSystemSetting } from '../../api/systemSettingsApi'
import { setDateFormat } from '../../utils/dateFormat'

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
  const [loading, setLoading] = useState(false)
  const [savingKey, setSavingKey] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await listSystemSettings()
      setSettings(res.items || [])
      const dateFormatSetting = (res.items || []).find((item) => item.key === 'date_format')
      if (dateFormatSetting?.value?.format) setDateFormat(dateFormatSetting.value.format)
      const map = {}
      ;(res.items || []).forEach((s) => { map[s.key] = s.value || {} })
      setValues(map)
    } catch (error) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
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
  const updateValue = (key, field, value) => {
    setValues((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }))
  }

  const renderFields = (setting) => {
    const current = values[setting.key] || {}
    switch (setting.key) {
      case 'general_settings':
        return (
          <div className="form-grid">
            <FormInput label="App Name" value={current.appName || ''} onChange={(e) => updateValue(setting.key, 'appName', e.target.value)} />
            <FormInput label="Support Email" type="email" value={current.supportEmail || ''} onChange={(e) => updateValue(setting.key, 'supportEmail', e.target.value)} />
          </div>
        )
      case 'email_settings':
        return (
          <div className="form-grid">
            <FormInput label="SMTP Host" value={current.smtpHost || ''} onChange={(e) => updateValue(setting.key, 'smtpHost', e.target.value)} />
            <FormInput label="SMTP Port" type="number" value={current.smtpPort ?? 587} onChange={(e) => updateValue(setting.key, 'smtpPort', Number(e.target.value))} />
          </div>
        )
      case 'sms_settings':
        return (
          <div className="form-grid">
            <FormInput label="Provider" value={current.provider || ''} onChange={(e) => updateValue(setting.key, 'provider', e.target.value)} />
            <FormInput label="Sender ID" value={current.senderId || ''} onChange={(e) => updateValue(setting.key, 'senderId', e.target.value)} />
          </div>
        )
      case 'whatsapp_settings':
        return (
          <div className="form-grid">
            <FormInput label="Provider" value={current.provider || ''} onChange={(e) => updateValue(setting.key, 'provider', e.target.value)} />
            <FormInput label="Phone Number ID" value={current.phoneNumberId || ''} onChange={(e) => updateValue(setting.key, 'phoneNumberId', e.target.value)} />
          </div>
        )
      case 'notification_templates':
        return <FormInput label="Welcome Template" value={current.welcome || ''} onChange={(e) => updateValue(setting.key, 'welcome', e.target.value)} />
      case 'timezone_settings':
        return <FilterDropdown label="Timezone" value={current.timezone || 'Asia/Kolkata'} onChange={(v) => updateValue(setting.key, 'timezone', v)} options={[{ value: 'Asia/Kolkata', label: 'Asia/Kolkata' }, { value: 'UTC', label: 'UTC' }, { value: 'America/New_York', label: 'America/New_York' }, { value: 'Europe/London', label: 'Europe/London' }]} />
      case 'currency_settings':
        return <FilterDropdown label="Currency" value={current.currency || 'INR'} onChange={(v) => updateValue(setting.key, 'currency', v)} options={[{ value: 'INR', label: 'INR' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }, { value: 'GBP', label: 'GBP' }]} />
      case 'language_settings':
        return <FilterDropdown label="Default Language" value={current.defaultLanguage || 'en'} onChange={(v) => updateValue(setting.key, 'defaultLanguage', v)} options={[{ value: 'en', label: 'English' }, { value: 'hi', label: 'Hindi' }]} />
      case 'theme_management':
        return <FilterDropdown label="Theme" value={current.theme || 'light'} onChange={(v) => updateValue(setting.key, 'theme', v)} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System Default' }]} />
      case 'branding_settings':
        return <FormInput label="Primary Color" type="color" value={current.primaryColor || '#0f766e'} onChange={(e) => updateValue(setting.key, 'primaryColor', e.target.value)} />
      case 'date_format':
        return <FilterDropdown label="Date Format" value={current.format || 'DD-MM-YYYY'} onChange={(v) => updateValue(setting.key, 'format', v)} options={[{ value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' }, { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }]} />
      case 'file_upload_limits':
        return <FormInput label="Max Upload Size (MB)" type="number" value={current.maxMb ?? 25} onChange={(e) => updateValue(setting.key, 'maxMb', Number(e.target.value))} />
      case 'maintenance_mode':
        return <FilterDropdown label="Maintenance Mode" value={current.enabled ? 'enabled' : 'disabled'} onChange={(v) => updateValue(setting.key, 'enabled', v === 'enabled')} options={[{ value: 'disabled', label: 'Disabled' }, { value: 'enabled', label: 'Enabled' }]} />
      case 'application_version':
        return <FormInput label="Application Version" value={current.version || ''} onChange={(e) => updateValue(setting.key, 'version', e.target.value)} />
      case 'qa_system':
        return <FilterDropdown label="QA System" value={current.on ? 'on' : 'off'} onChange={(v) => updateValue(setting.key, 'on', v === 'on')} options={[{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }]} />
      default:
        return (
          <FormInput
            label="Value (text)"
            value={typeof current === 'string' ? current : JSON.stringify(current || {})}
            onChange={(e) => {
              const raw = e.target.value
              try {
                updateValue(setting.key, '__raw__', JSON.parse(raw))
              } catch {
                updateValue(setting.key, '__raw__', raw)
              }
            }}
          />
        )
    }
  }

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
        <p>Review and update all settings groups from one page using simple form fields.</p>
      </div>

      <div id="system-settings-section" className="panel">
        <div className="filters-row">
          <FilterDropdown label="Settings Group" value={groupFilter} onChange={setGroupFilter} options={[{ value: 'all', label: 'All Groups' }, ...settingGroups.map((group) => ({ value: group, label: group }))]} />
        </div>

        {loading ? <LoadingSkeleton rows={6} /> : null}
        {!loading && filtered.length === 0 ? <EmptyState title="No setting found for selected group" /> : filtered.map((s) => (
          <div className="panel" key={s._id} style={{ marginBottom: '10px' }}>
            <h4 style={{ marginTop: 0 }}>{s.group} / {s.key}</h4>
            <p style={{ color: 'var(--muted)' }}>{s.description || '-'}</p>
            {renderFields(s)}
            <div className="actions-row" style={{ marginTop: '8px' }}>
              <Button
                disabled={savingKey === s.key}
                onClick={async () => {
                  try {
                    setSavingKey(s.key)
                    const payload = {
                      key: s.key,
                      group: s.group,
                      value: values[s.key]?.__raw__ !== undefined ? values[s.key].__raw__ : (values[s.key] || {}),
                      description: s.description || ''
                    }
                    const res = await saveSystemSetting(payload)
                    if (s.key === 'date_format' && payload.value?.format) setDateFormat(payload.value.format)
                    setToast({ type: 'success', message: res?.message || `${s.group} saved successfully` })
                  } catch (error) {
                    setToast({ type: 'error', message: error?.response?.data?.message || `Failed to save ${s.group}` })
                  } finally {
                    setSavingKey('')
                  }
                }}
              >
                {savingKey === s.key ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default SystemSettingsModulePage

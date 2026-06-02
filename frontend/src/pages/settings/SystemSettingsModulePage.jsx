import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import FilterDropdown from '../../components/ui/FilterDropdown'
import FormInput from '../../components/ui/FormInput'
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

const keyByGroup = {
  'General Settings': 'general_settings',
  'Email Settings': 'email_settings',
  'SMS Settings': 'sms_settings',
  'WhatsApp Settings': 'whatsapp_settings',
  'Notification Templates': 'notification_templates',
  'Timezone Settings': 'timezone_settings',
  'Currency Settings': 'currency_settings',
  'Language Settings': 'language_settings',
  'Theme Management': 'theme_management',
  'Branding Settings': 'branding_settings',
  'Date Format': 'date_format',
  'File Upload Limits': 'file_upload_limits',
  'Maintenance Mode': 'maintenance_mode',
  'Application Version': 'application_version'
}

const SYSTEM_SETTINGS_STORAGE_KEY = 'hrms_frontend_system_settings_v1'

const initialValues = {
  general_settings: { appName: 'HRMS Pro', supportEmail: 'support@hrmspro.com' },
  email_settings: { smtpHost: 'smtp.gmail.com', smtpPort: 587 },
  sms_settings: { provider: 'Twilio', senderId: 'HRMS' },
  whatsapp_settings: { provider: 'Meta Cloud API', phoneNumberId: 'WHATSAPP-001' },
  notification_templates: { welcome: 'Welcome to HRMS. Your account is now active.' },
  timezone_settings: { timezone: 'Asia/Kolkata' },
  currency_settings: { currency: 'INR' },
  language_settings: { defaultLanguage: 'en' },
  theme_management: { theme: 'light' },
  branding_settings: { primaryColor: '#4f67f7' },
  date_format: { format: 'DD-MM-YYYY' },
  file_upload_limits: { maxMb: 25 },
  maintenance_mode: { enabled: false },
  application_version: { version: 'v2.1.0' }
}

function SystemSettingsModulePage({ page }) {
  const [values, setValues] = useState(() => {
    try {
      const raw = localStorage.getItem(SYSTEM_SETTINGS_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed?.values ? parsed.values : initialValues
    } catch {
      return initialValues
    }
  })
  const [toast, setToast] = useState({ type: '', message: '' })

  const activeGroup = useMemo(() => (settingGroups.includes(page) ? page : 'General Settings'), [page])
  const activeKey = keyByGroup[activeGroup]
  const current = values[activeKey] || {}

  const updateValue = (field, value) => {
    setValues((prev) => ({ ...prev, [activeKey]: { ...(prev[activeKey] || {}), [field]: value } }))
  }

  const showSaved = (message) => {
    setToast({ type: 'success', message })
    setTimeout(() => setToast({ type: '', message: '' }), 1500)
  }

  useEffect(() => {
    localStorage.setItem(SYSTEM_SETTINGS_STORAGE_KEY, JSON.stringify({ values }))
  }, [values])

  const saveCurrent = () => {
    if (activeKey === 'date_format' && current.format) setDateFormat(current.format)
    showSaved(`${activeGroup} saved (frontend only)`)
  }

  const renderFields = () => {
    switch (activeKey) {
      case 'general_settings':
        return (
          <div className="form-grid">
            <FormInput label="App Name" value={current.appName || ''} onChange={(e) => updateValue('appName', e.target.value)} />
            <FormInput label="Support Email" type="email" value={current.supportEmail || ''} onChange={(e) => updateValue('supportEmail', e.target.value)} />
          </div>
        )
      case 'email_settings':
        return (
          <div className="form-grid">
            <FormInput label="SMTP Host" value={current.smtpHost || ''} onChange={(e) => updateValue('smtpHost', e.target.value)} />
            <FormInput label="SMTP Port" type="number" value={current.smtpPort ?? 587} onChange={(e) => updateValue('smtpPort', Number(e.target.value))} />
          </div>
        )
      case 'sms_settings':
        return (
          <div className="form-grid">
            <FormInput label="Provider" value={current.provider || ''} onChange={(e) => updateValue('provider', e.target.value)} />
            <FormInput label="Sender ID" value={current.senderId || ''} onChange={(e) => updateValue('senderId', e.target.value)} />
          </div>
        )
      case 'whatsapp_settings':
        return (
          <div className="form-grid">
            <FormInput label="Provider" value={current.provider || ''} onChange={(e) => updateValue('provider', e.target.value)} />
            <FormInput label="Phone Number ID" value={current.phoneNumberId || ''} onChange={(e) => updateValue('phoneNumberId', e.target.value)} />
          </div>
        )
      case 'notification_templates':
        return <FormInput label="Welcome Template" value={current.welcome || ''} onChange={(e) => updateValue('welcome', e.target.value)} />
      case 'timezone_settings':
        return <FilterDropdown label="Timezone" value={current.timezone || 'Asia/Kolkata'} onChange={(v) => updateValue('timezone', v)} options={[{ value: 'Asia/Kolkata', label: 'Asia/Kolkata' }, { value: 'UTC', label: 'UTC' }, { value: 'America/New_York', label: 'America/New_York' }, { value: 'Europe/London', label: 'Europe/London' }]} />
      case 'currency_settings':
        return <FilterDropdown label="Currency" value={current.currency || 'INR'} onChange={(v) => updateValue('currency', v)} options={[{ value: 'INR', label: 'INR' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }, { value: 'GBP', label: 'GBP' }]} />
      case 'language_settings':
        return <FilterDropdown label="Default Language" value={current.defaultLanguage || 'en'} onChange={(v) => updateValue('defaultLanguage', v)} options={[{ value: 'en', label: 'English' }, { value: 'hi', label: 'Hindi' }]} />
      case 'theme_management':
        return <FilterDropdown label="Theme" value={current.theme || 'light'} onChange={(v) => updateValue('theme', v)} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System Default' }]} />
      case 'branding_settings':
        return <FormInput label="Primary Color" type="color" value={current.primaryColor || '#4f67f7'} onChange={(e) => updateValue('primaryColor', e.target.value)} />
      case 'date_format':
        return <FilterDropdown label="Date Format" value={current.format || 'DD-MM-YYYY'} onChange={(v) => updateValue('format', v)} options={[{ value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' }, { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }]} />
      case 'file_upload_limits':
        return <FormInput label="Max Upload Size (MB)" type="number" value={current.maxMb ?? 25} onChange={(e) => updateValue('maxMb', Number(e.target.value))} />
      case 'maintenance_mode':
        return <FilterDropdown label="Maintenance Mode" value={current.enabled ? 'enabled' : 'disabled'} onChange={(v) => updateValue('enabled', v === 'enabled')} options={[{ value: 'disabled', label: 'Disabled' }, { value: 'enabled', label: 'Enabled' }]} />
      case 'application_version':
        return <FormInput label="Application Version" value={current.version || ''} onChange={(e) => updateValue('version', e.target.value)} />
      default:
        return null
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title={activeGroup}
        description="Manage platform configuration with frontend-only editable controls."
        breadcrumb={['Super Admin', 'System Settings', activeGroup]}
      />
      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}

      <div id="system-settings-section" className="panel">
        <div className="panel-head"><h3>{activeGroup}</h3></div>
        {renderFields()}
        <div className="actions-row system-settings-actions" style={{ marginTop: '10px' }}>
          <Button variant="ghost" onClick={() => showSaved('Refreshed (frontend state)')}>Refresh</Button>
          <Button onClick={saveCurrent}>Save Settings</Button>
        </div>
      </div>
    </section>
  )
}

export default SystemSettingsModulePage

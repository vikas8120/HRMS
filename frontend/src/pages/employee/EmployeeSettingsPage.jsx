import { useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import { useAuth } from '../../hooks/useAuth'
import {
  changeEmployeeSettingsPassword,
  getEmployeeSettings,
  logoutEmployeeOtherDevices,
  updateEmployeeSettings
} from '../../api/employeeSettingsApi'

function EmployeeSettingsPage() {
  const { logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [data, setData] = useState(null)

  const [notifications, setNotifications] = useState({ attendance: true, leave: true, payroll: true, task: true, system: true })
  const [theme, setTheme] = useState({ theme: 'system', compactMode: false, language: 'en' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const showMessage = (setter, message) => {
    setter(message)
    setTimeout(() => setter(''), 2500)
  }

  const applyState = (payload) => {
    const next = payload?.data || null
    setData(next)
    setNotifications(next?.notificationPreferences || { attendance: true, leave: true, payroll: true, task: true, system: true })
    setTheme(next?.themePreferences || { theme: 'system', compactMode: false, language: 'en' })
  }

  const loadSettings = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = await getEmployeeSettings()
      applyState(payload)
    } catch (err) {
      setData(null)
      setError(err?.response?.data?.message || err?.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const saveSettings = async () => {
    setSubmitting(true)
    setError('')
    try {
      const payload = await updateEmployeeSettings({ notificationPreferences: notifications, themePreferences: theme })
      applyState(payload)
      showMessage(setSuccess, payload?.message || '')
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to update settings')
    } finally {
      setSubmitting(false)
    }
  }

  const onChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return showMessage(setError, 'All password fields are required')
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return showMessage(setError, 'New password and confirm password do not match')
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      return showMessage(setError, 'New password must be different from current password')
    }

    setSubmitting(true)
    setError('')
    try {
      const payload = await changeEmployeeSettingsPassword(passwordForm)
      showMessage(setSuccess, payload?.message || '')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to change password')
    } finally {
      setSubmitting(false)
    }
  }

  const onLogoutOtherDevices = async () => {
    setSubmitting(true)
    setError('')
    try {
      const payload = await logoutEmployeeOtherDevices()
      showMessage(setSuccess, payload?.message || '')
      await loadSettings()
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to logout other devices')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Employee Settings"
        description="Manage account preferences, notifications, sessions, and password."
        breadcrumb={['Employee Portal', 'Settings']}
      />

      {success ? <div className="panel" style={{ borderColor: 'rgba(34,197,94,0.35)' }}>{success}</div> : null}
      {error ? <div className="panel error-banner">{error}</div> : null}

      <div className="panel">
        <div className="actions-row">
          <Button variant="ghost" onClick={loadSettings} disabled={submitting}>Refresh</Button>
          <Button onClick={saveSettings} disabled={submitting}>{submitting ? 'Saving...' : 'Save Settings'}</Button>
          <Button variant="danger" onClick={logout} disabled={submitting}>Logout</Button>
        </div>
      </div>

      {loading ? <div className="panel"><LoadingSkeleton rows={6} /></div> : null}
      {!loading && !data ? <div className="panel"><EmptyState title="No settings found" description="Unable to load your account settings." /></div> : null}

      {!loading && data ? (
        <>
          <div className="panel modal-form">
            <div className="panel-head"><h3>Notification Preferences</h3></div>
            <label className="inline-action-card"><span>Attendance Alerts</span><input type="checkbox" checked={notifications.attendance} onChange={(e) => setNotifications((p) => ({ ...p, attendance: e.target.checked }))} /></label>
            <label className="inline-action-card"><span>Leave Updates</span><input type="checkbox" checked={notifications.leave} onChange={(e) => setNotifications((p) => ({ ...p, leave: e.target.checked }))} /></label>
            <label className="inline-action-card"><span>Payroll Alerts</span><input type="checkbox" checked={notifications.payroll} onChange={(e) => setNotifications((p) => ({ ...p, payroll: e.target.checked }))} /></label>
            <label className="inline-action-card"><span>Task Updates</span><input type="checkbox" checked={notifications.task} onChange={(e) => setNotifications((p) => ({ ...p, task: e.target.checked }))} /></label>
            <label className="inline-action-card"><span>System Notifications</span><input type="checkbox" checked={notifications.system} onChange={(e) => setNotifications((p) => ({ ...p, system: e.target.checked }))} /></label>
          </div>

          <div className="panel modal-form">
            <div className="panel-head"><h3>Theme & Preferences</h3></div>
            <label className="form-input-wrap">
              <span>Theme</span>
              <select className="form-input" value={theme.theme} onChange={(e) => setTheme((p) => ({ ...p, theme: e.target.value }))}>
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label className="form-input-wrap">
              <span>Language</span>
              <input className="form-input" value={theme.language} onChange={(e) => setTheme((p) => ({ ...p, language: e.target.value }))} />
            </label>
            <label className="inline-action-card"><span>Compact Mode</span><input type="checkbox" checked={theme.compactMode} onChange={(e) => setTheme((p) => ({ ...p, compactMode: e.target.checked }))} /></label>
          </div>

          <div className="panel modal-form">
            <div className="panel-head"><h3>Change Password</h3></div>
            <label className="form-input-wrap"><span>Current Password</span><input className="form-input" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>New Password</span><input className="form-input" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Confirm Password</span><input className="form-input" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))} /></label>
            <div className="actions-row">
              <Button onClick={onChangePassword} disabled={submitting}>{submitting ? 'Updating...' : 'Update Password'}</Button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Active Sessions / Devices</h3></div>
            {(data.sessions || []).length === 0 ? <EmptyState title="No active sessions" description="No active session records available." /> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Device</th><th>IP Address</th><th>Logged In At</th><th>Current</th></tr></thead>
                  <tbody>
                    {(data.sessions || []).map((s) => (
                      <tr key={s.id}>
                        <td>{s.device || '-'}</td>
                        <td>{s.ipAddress || '-'}</td>
                        <td>{s.loggedInAt ? String(s.loggedInAt).slice(0, 19).replace('T', ' ') : '-'}</td>
                        <td>{s.isCurrent ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="actions-row" style={{ marginTop: 12 }}>
              <Button variant="ghost" onClick={onLogoutOtherDevices} disabled={submitting}>Logout Other Devices</Button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}

export default EmployeeSettingsPage

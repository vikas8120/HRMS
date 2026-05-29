import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { changeManagerPassword, getManagerLoginActivity, logoutManagerOtherDevices } from '../../api/managerProfileApi'

const SETTINGS_STORAGE_KEY = 'manager_settings_preferences_v1'

const defaultPreferences = {
  notifications: {
    leaveRequests: true,
    attendanceAlerts: true,
    payrollAlerts: true,
    policyUpdates: false
  },
  ui: {
    compactTables: false,
    autoRefreshDashboard: true
  }
}

const loadPreferences = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return defaultPreferences
    const parsed = JSON.parse(raw)
    return {
      notifications: { ...defaultPreferences.notifications, ...(parsed?.notifications || {}) },
      ui: { ...defaultPreferences.ui, ...(parsed?.ui || {}) }
    }
  } catch {
    return defaultPreferences
  }
}

function ManagerSettingsPage() {
  const [submitting, setSubmitting] = useState(false)
  const [activityLoading, setActivityLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [preferences, setPreferences] = useState(defaultPreferences)
  const [initialPreferences, setInitialPreferences] = useState(defaultPreferences)
  const [activity, setActivity] = useState([])
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const hasPreferenceChanges = useMemo(
    () => JSON.stringify(preferences) !== JSON.stringify(initialPreferences),
    [preferences, initialPreferences]
  )

  const showMessage = (type, text) => {
    setMessage({ type, text })
  }

  const loadLoginActivity = async () => {
    setActivityLoading(true)
    try {
      const payload = await getManagerLoginActivity()
      setActivity(Array.isArray(payload?.data) ? payload.data : [])
    } catch (err) {
      showMessage('error', err?.response?.data?.message || 'Failed to load login activity')
      setActivity([])
    } finally {
      setActivityLoading(false)
    }
  }

  useEffect(() => {
    const next = loadPreferences()
    setPreferences(next)
    setInitialPreferences(next)
    loadLoginActivity()
  }, [])

  useEffect(() => {
    if (!message.text) return undefined
    const timer = setTimeout(() => setMessage({ type: '', text: '' }), 2600)
    return () => clearTimeout(timer)
  }, [message])

  const savePreferences = () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(preferences))
    setInitialPreferences(preferences)
    showMessage('success', 'Settings saved successfully')
  }

  const updatePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return showMessage('error', 'All password fields are required')
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return showMessage('error', 'New password and confirm password do not match')
    }
    if (passwordForm.newPassword.length < 8) {
      return showMessage('error', 'Password must be at least 8 characters')
    }

    setSubmitting(true)
    try {
      const payload = await changeManagerPassword(passwordForm)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      showMessage('success', payload?.message || 'Password updated successfully')
    } catch (err) {
      showMessage('error', err?.response?.data?.message || 'Failed to update password')
    } finally {
      setSubmitting(false)
    }
  }

  const logoutOthers = async () => {
    setSubmitting(true)
    try {
      const payload = await logoutManagerOtherDevices()
      showMessage('success', payload?.message || 'Logged out from other devices')
      await loadLoginActivity()
    } catch (err) {
      showMessage('error', err?.response?.data?.message || 'Failed to logout from other devices')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Settings"
        description="Configure notifications, security, and active sessions."
        breadcrumb={['Manager Portal', 'Settings']}
      />

      {message.text ? (
        <div className={`toast ${message.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {message.text}
        </div>
      ) : null}

      <div className="panel modal-form">
        <div className="panel-head"><h3>Notification Preferences</h3></div>
        <label className="inline-action-card notification-pref-row"><span>Leave Request Alerts</span><input type="checkbox" checked={preferences.notifications.leaveRequests} onChange={(e) => setPreferences((p) => ({ ...p, notifications: { ...p.notifications, leaveRequests: e.target.checked } }))} /></label>
        <label className="inline-action-card notification-pref-row"><span>Attendance Alerts</span><input type="checkbox" checked={preferences.notifications.attendanceAlerts} onChange={(e) => setPreferences((p) => ({ ...p, notifications: { ...p.notifications, attendanceAlerts: e.target.checked } }))} /></label>
        <label className="inline-action-card notification-pref-row"><span>Payroll Alerts</span><input type="checkbox" checked={preferences.notifications.payrollAlerts} onChange={(e) => setPreferences((p) => ({ ...p, notifications: { ...p.notifications, payrollAlerts: e.target.checked } }))} /></label>
        <label className="inline-action-card notification-pref-row"><span>Policy Updates</span><input type="checkbox" checked={preferences.notifications.policyUpdates} onChange={(e) => setPreferences((p) => ({ ...p, notifications: { ...p.notifications, policyUpdates: e.target.checked } }))} /></label>

        <div className="panel-head" style={{ marginTop: 8 }}><h3>Workspace Preferences</h3></div>
        <label className="inline-action-card notification-pref-row"><span>Compact Tables</span><input type="checkbox" checked={preferences.ui.compactTables} onChange={(e) => setPreferences((p) => ({ ...p, ui: { ...p.ui, compactTables: e.target.checked } }))} /></label>
        <label className="inline-action-card notification-pref-row"><span>Auto-refresh Dashboard</span><input type="checkbox" checked={preferences.ui.autoRefreshDashboard} onChange={(e) => setPreferences((p) => ({ ...p, ui: { ...p.ui, autoRefreshDashboard: e.target.checked } }))} /></label>

        <div className="actions-row" style={{ marginTop: 8 }}>
          <Button onClick={savePreferences} disabled={!hasPreferenceChanges}>Save Settings</Button>
        </div>
      </div>

      <div className="panel modal-form">
        <div className="panel-head"><h3>Change Password</h3></div>
        <label className="form-input-wrap"><span>Current Password</span><input className="form-input" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))} /></label>
        <label className="form-input-wrap"><span>New Password</span><input className="form-input" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} /></label>
        <label className="form-input-wrap"><span>Confirm Password</span><input className="form-input" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))} /></label>
        <div className="actions-row">
          <Button onClick={updatePassword} disabled={submitting}>{submitting ? 'Updating...' : 'Update Password'}</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Active Sessions / Devices</h3></div>
        {activityLoading ? <p>Loading session activity...</p> : null}
        {!activityLoading && activity.length === 0 ? <EmptyState title="No login activity" description="Recent login events will appear here." /> : null}
        {!activityLoading && activity.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Message</th>
                  <th>IP Address</th>
                  <th>User Agent</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((row) => (
                  <tr key={row.id}>
                    <td>{row.action || '-'}</td>
                    <td>{row.message || '-'}</td>
                    <td>{row.ipAddress || '-'}</td>
                    <td>{row.userAgent || '-'}</td>
                    <td>{row.createdAt ? String(row.createdAt).slice(0, 19).replace('T', ' ') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <div className="actions-row" style={{ marginTop: 12 }}>
          <Button variant="danger" onClick={logoutOthers} disabled={submitting}>{submitting ? 'Processing...' : 'Logout from Other Devices'}</Button>
        </div>
      </div>
    </section>
  )
}

export default ManagerSettingsPage

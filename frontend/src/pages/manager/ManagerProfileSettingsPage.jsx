import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import {
  changeManagerPassword,
  getManagerLoginActivity,
  getManagerProfile,
  logoutManagerOtherDevices,
  uploadManagerProfileImage,
  updateManagerProfile
} from '../../api/managerProfileApi'

const tabs = ['My Profile', 'Edit Profile', 'Change Password', 'Login Activity']

function ManagerProfileSettingsPage() {
  const [activeTab, setActiveTab] = useState('My Profile')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [profile, setProfile] = useState(null)
  const [activity, setActivity] = useState([])
  const [toast, setToast] = useState(null)

  const [editForm, setEditForm] = useState({ name: '', phone: '', designation: '', address: '', profileImage: '' })
  const [profileImageFile, setProfileImageFile] = useState(null)
  const [profileImagePreview, setProfileImagePreview] = useState('')
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const profileHighlights = useMemo(() => {
    if (!profile) return []
    const pick = (...values) => values.find((value) => String(value || '').trim())
    const mapped = [
      { label: 'Manager ID', value: pick(profile.managerId, profile.employeeId, profile.userId, profile.id) || '' },
      { label: 'Phone', value: pick(profile.phone, profile.contact?.phone, profile.personalInfo?.phone) || '' },
      { label: 'Designation', value: pick(profile.designation, profile.jobDetails?.designation) || '' },
      { label: 'Department', value: pick(profile.departmentName, profile.department, profile.jobDetails?.department) || '' },
      { label: 'Team Size', value: profile.teamSize != null ? String(profile.teamSize) : String(profile.teamMembersCount || '') },
      { label: 'Reporting To', value: pick(profile.reportingManager, profile.reportingTo, profile.jobDetails?.reportingTo) || '' },
      { label: 'Work Location', value: pick(profile.workLocation, profile.location, profile.jobDetails?.workLocation) || '' },
      { label: 'Address', value: pick(profile.address, profile.contact?.address, profile.personalInfo?.address) || '' },
      { label: 'Last Login', value: profile.lastLogin ? String(profile.lastLogin).slice(0, 19).replace('T', ' ') : '' }
    ]
    return mapped.filter((item) => String(item.value || '').trim())
  }, [profile])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  const loadProfile = async () => {
    const payload = await getManagerProfile()
    const data = payload?.data || null
    setProfile(data)
    setEditForm({
      name: data?.name || '',
      phone: data?.phone || '',
      designation: data?.designation || '',
      address: data?.address || '',
      profileImage: data?.profileImage || ''
    })
    setProfileImagePreview(data?.profileImage || '')
  }

  const loadActivity = async () => {
    const payload = await getManagerLoginActivity()
    setActivity(payload?.data || [])
  }

  const loadAll = async () => {
    setLoading(true)
    const results = await Promise.allSettled([loadProfile(), loadActivity()])
    const failed = results.find((x) => x.status === 'rejected')
    if (failed) {
      setToast({ type: 'error', message: failed.reason?.response?.data?.message || 'Failed to load profile data' })
    }
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  const saveProfile = async () => {
    if (!editForm.name.trim()) return setToast({ type: 'error', message: 'Name is required' })
    if (editForm.profileImage && !/^https?:\/\//i.test(String(editForm.profileImage).trim())) {
      return setToast({ type: 'error', message: 'Profile Image URL must start with http:// or https://' })
    }
    setSubmitting(true)
    try {
      const nextPayload = { ...editForm }
      if (profileImageFile) {
        const imageForm = new FormData()
        imageForm.append('file', profileImageFile)
        const uploadPayload = await uploadManagerProfileImage(imageForm)
        const uploadedUrl = uploadPayload?.data?.profileImage || uploadPayload?.file?.fileUrl || ''
        if (uploadedUrl) nextPayload.profileImage = uploadedUrl
      }

      const payload = await updateManagerProfile(nextPayload)
      setProfile(payload?.data || profile)
      setProfileImagePreview(payload?.data?.profileImage || '')
      setProfileImageFile(null)
      setToast({ type: 'success', message: 'Profile updated successfully' })
      setActiveTab('My Profile')
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to update profile' })
    } finally {
      setSubmitting(false)
    }
  }

  const updatePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return setToast({ type: 'error', message: 'All password fields are required' })
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setToast({ type: 'error', message: 'Passwords do not match' })
    }
    if (passwordForm.newPassword.length < 8) {
      return setToast({ type: 'error', message: 'Password must be at least 8 characters' })
    }
    if (!/[A-Z]/.test(passwordForm.newPassword) || !/[a-z]/.test(passwordForm.newPassword) || !/\d/.test(passwordForm.newPassword)) {
      return setToast({ type: 'error', message: 'Password must contain uppercase, lowercase, and number' })
    }

    setSubmitting(true)
    try {
      await changeManagerPassword(passwordForm)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setToast({ type: 'success', message: 'Password updated successfully' })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to update password' })
    } finally {
      setSubmitting(false)
    }
  }

  const logoutOthers = async () => {
    setSubmitting(true)
    try {
      await logoutManagerOtherDevices()
      setToast({ type: 'success', message: 'Logged out from other devices' })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to logout from other devices' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section-layout manager-profile-settings-page">
      <PageHeader
        title="Profile"
        description="Manage personal details, password, and account login activity."
        breadcrumb={['Manager Portal', 'Profile']}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel">
        <div className="workspace-nav">
          {tabs.map((tab) => (
            <button key={tab} type="button" className={`chip-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={loadAll} disabled={submitting}>Refresh Profile Data</Button>
        </div>
      </div>

      {loading ? <div className="panel"><LoadingSkeleton rows={8} /></div> : !profile ? <div className="panel"><EmptyState title="Profile unavailable" description="Unable to load manager profile." /></div> : null}

      {!loading && profile && activeTab === 'My Profile' ? (
        <div className="panel manager-profile-panel">
          <div className="panel-head"><h3>My Profile</h3></div>
          <div className="manager-profile-hero">
            {profile.profileImage ? (
              <img src={profile.profileImage} alt={profile.name || 'Manager'} className="manager-profile-avatar" />
            ) : (
              <div className="manager-profile-avatar-fallback">{String(profile.name || 'M').slice(0, 1).toUpperCase()}</div>
            )}
            <div className="manager-profile-hero-content">
              <h4>{profile.name || 'Manager'}</h4>
              <p>{profile.email || '-'}</p>
              <div className="actions-row">
                <span className="badge badge-info">{String(profile.role || 'manager').replace(/^./, (c) => c.toUpperCase())}</span>
                <span className={`badge ${String(profile.status || '').toLowerCase() === 'active' ? 'badge-active' : 'badge-neutral'}`}>{profile.status || '-'}</span>
              </div>
            </div>
          </div>
          <div className="manager-profile-grid">
            {profileHighlights.length === 0 ? (
              <div className="inline-action-card"><strong>Profile</strong><span>Manager details will appear here once available.</span></div>
            ) : (
              profileHighlights.map((item) => (
                <div key={item.label} className="inline-action-card"><strong>{item.label}</strong><span>{item.value}</span></div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {!loading && profile && activeTab === 'Edit Profile' ? (
        <div className="panel">
          <div className="panel-head"><h3>Edit Profile</h3></div>
          <div className="modal-form">
            <label className="form-input-wrap"><span>Name</span><input className="form-input" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Phone</span><input className="form-input" value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Designation</span><input className="form-input" value={editForm.designation || ''} onChange={(e) => setEditForm((p) => ({ ...p, designation: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Address</span><textarea className="form-input" rows={3} value={editForm.address || ''} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Profile Image URL</span><input className="form-input" value={editForm.profileImage} onChange={(e) => setEditForm((p) => ({ ...p, profileImage: e.target.value }))} /></label>
            <label className="form-input-wrap">
              <span>Profile Image (Choose from system)</span>
              <input
                className="form-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setProfileImageFile(file)
                  if (file) {
                    const previewUrl = URL.createObjectURL(file)
                    setProfileImagePreview(previewUrl)
                  }
                }}
              />
            </label>
            {profileImagePreview ? <img src={profileImagePreview} alt="Profile preview" className="manager-profile-avatar" /> : null}
            <div className="actions-row">
              <Button onClick={saveProfile} disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
              <Button variant="ghost" onClick={() => setActiveTab('My Profile')} disabled={submitting}>Cancel</Button>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && profile && activeTab === 'Change Password' ? (
        <div className="panel">
          <div className="panel-head"><h3>Change Password</h3></div>
          <div className="modal-form">
            <label className="form-input-wrap"><span>Current Password</span><input type="password" className="form-input" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>New Password</span><input type="password" className="form-input" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Confirm Password</span><input type="password" className="form-input" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))} /></label>
            <div className="actions-row">
              <Button onClick={updatePassword} disabled={submitting}>{submitting ? 'Updating...' : 'Update Password'}</Button>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && profile && activeTab === 'Login Activity' ? (
        <div className="panel">
          <div className="panel-head"><h3>Login Activity</h3></div>
          {activity.length === 0 ? <EmptyState title="No login activity" description="Recent login events will appear here." /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Message</th>
                    <th>IP Address</th>
                    <th>User Agent</th>
                    <th>Time</th>
                    <th>Actions</th>
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
                      <td>
                        <div className="table-actions">
                          <button className="text-btn" onClick={() => setToast({ type: 'success', message: `${row.ipAddress || 'Unknown IP'} at ${row.createdAt ? String(row.createdAt).slice(0, 19).replace('T', ' ') : '-'}` })}>View Login Details</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="actions-row" style={{ marginTop: 12 }}>
            <Button variant="danger" onClick={logoutOthers} disabled={submitting}>{submitting ? 'Processing...' : 'Logout from Other Devices'}</Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default ManagerProfileSettingsPage

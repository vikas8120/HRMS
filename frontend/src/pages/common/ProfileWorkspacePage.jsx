import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getCurrentUser, getToken, saveToken } from '../../utils/auth'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'

const roleConfig = {
  platform_admin: {
    label: 'Super Admin',
    fallbackName: 'Super Admin',
    roleTitle: 'Platform Admin',
    portalLabel: 'Super Admin Portal',
    companyLabel: 'Platform',
    departmentLabel: 'Platform Operations',
    employeeId: 'SA-001',
    companyId: 'PLAT-001',
    status: 'Active',
    designation: 'Platform Owner',
    permissions: 'View all data · Manage users · Configure settings · View billing · All module access · Delete records',
    assignedTeam: 'All Teams',
    profileImage: '',
    activitySummary: { leadsCreated: 28, dealsClosed: 0, tasksCompleted: 0, pendingFollowUps: 15 }
  },
  admin: {
    label: 'Company Admin',
    fallbackName: 'Company Admin',
    roleTitle: 'Admin',
    portalLabel: 'Company Admin Portal',
    companyLabel: 'Company',
    departmentLabel: 'Sales',
    employeeId: 'ADM-001',
    companyId: 'CMP-001',
    status: 'Active',
    designation: 'Admin',
    permissions: 'Full company control · HR access · Employee management · Reports · Settings',
    assignedTeam: 'All Teams',
    profileImage: '',
    activitySummary: { leadsCreated: 28, dealsClosed: 0, tasksCompleted: 0, pendingFollowUps: 15 }
  },
  hr: {
    label: 'HR User',
    fallbackName: 'HR User',
    roleTitle: 'HR',
    portalLabel: 'HR Portal',
    companyLabel: 'HR',
    departmentLabel: 'HR Operations',
    employeeId: 'HR-001',
    companyId: 'CMP-001',
    status: 'Active',
    designation: 'HR Manager',
    permissions: 'Recruitment · Attendance · Leaves · Policies · Employee support',
    assignedTeam: 'HR Team',
    profileImage: '',
    activitySummary: { leadsCreated: 12, dealsClosed: 0, tasksCompleted: 14, pendingFollowUps: 6 }
  },
  manager: {
    label: 'Manager',
    fallbackName: 'Manager User',
    roleTitle: 'Manager',
    portalLabel: 'Manager Portal',
    companyLabel: 'Manager',
    departmentLabel: 'Team Operations',
    employeeId: 'MGR-001',
    companyId: 'CMP-001',
    status: 'Active',
    designation: 'Team Manager',
    permissions: 'Team planning · Task review · Approval flow · Reports',
    assignedTeam: 'Core Team',
    profileImage: '',
    activitySummary: { leadsCreated: 10, dealsClosed: 4, tasksCompleted: 36, pendingFollowUps: 8 }
  },
  employee: {
    label: 'Employee',
    fallbackName: 'Employee',
    roleTitle: 'Employee',
    portalLabel: 'Employee Portal',
    companyLabel: 'Employee',
    departmentLabel: 'Engineering',
    employeeId: 'EMP-001',
    companyId: 'CMP-001',
    status: 'Active',
    designation: 'Developer',
    permissions: 'Self-service profile · Attendance · Leave requests · Payslips',
    assignedTeam: 'Individual Contributor',
    profileImage: '',
    activitySummary: { leadsCreated: 0, dealsClosed: 0, tasksCompleted: 18, pendingFollowUps: 3 },
    bankDetails: {
      bankName: 'HDFC Bank',
      accountHolderName: '',
      accountNumber: 'XXXXXX4321',
      ifscCode: 'HDFC0001234'
    },
    emergencyContact: {
      name: 'Priya Sharma',
      relation: 'Spouse',
      phone: '+91-9876543299'
    }
  }
}

const storageKeyForRole = (roleKey) => `profile-workspace:${roleKey}`

const normalizeRoleKey = (role) => {
  const value = String(role || '').trim().toLowerCase()
  if (value === 'superadmin' || value === 'platform_admin') return 'platform_admin'
  if (value === 'company_admin' || value === 'admin') return 'admin'
  if (value === 'hr') return 'hr'
  if (value === 'manager') return 'manager'
  return 'employee'
}

const getRoleConfig = (roleKey) => roleConfig[roleKey] || roleConfig.employee

const safeParse = (value) => {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch (_error) {
    return null
  }
}

const mergeDeep = (base, patch) => {
  if (!patch) return { ...base }
  const output = { ...base, ...patch }
  if (base.activitySummary || patch.activitySummary) {
    output.activitySummary = { ...(base.activitySummary || {}), ...(patch.activitySummary || {}) }
  }
  if (base.bankDetails || patch.bankDetails) {
    output.bankDetails = { ...(base.bankDetails || {}), ...(patch.bankDetails || {}) }
  }
  if (base.emergencyContact || patch.emergencyContact) {
    output.emergencyContact = { ...(base.emergencyContact || {}), ...(patch.emergencyContact || {}) }
  }
  return output
}

const buildDefaultProfile = (roleKey, user = {}) => {
  const config = getRoleConfig(roleKey)
  const displayName = String(user.name || '').trim() || config.fallbackName
  const email = String(user.email || '').trim() || `${roleKey.replace(/_/g, '.') }@demo.com`
  const baseProfile = {
    id: user.id || `${roleKey}-profile`,
    name: displayName,
    email,
    phone: user.phone || '+91-98765-00001',
    designation: user.designation || config.designation,
    department: user.department || config.departmentLabel,
    address: user.address || 'Bengaluru, Karnataka',
    role: user.role || roleKey,
    status: user.status || config.status,
    profileImage: user.profileImage || config.profileImage || '',
    employeeId: user.employeeId || config.employeeId,
    companyId: user.companyId || config.companyId,
    lastLogin: user.lastLogin || '2026-06-02 09:30',
    assignedTeam: user.assignedTeam || config.assignedTeam,
    permissions: user.permissions || config.permissions,
    teamName: user.teamName || config.assignedTeam,
    password: user.password || 'demo123',
    activitySummary: { ...(config.activitySummary || {}) },
    bankDetails: {
      bankName: config.bankDetails?.bankName || 'HDFC Bank',
      accountHolderName: user.name || displayName,
      accountNumber: config.bankDetails?.accountNumber || 'XXXXXX4321',
      ifscCode: config.bankDetails?.ifscCode || 'HDFC0001234'
    },
    emergencyContact: {
      name: config.emergencyContact?.name || 'Priya Sharma',
      relation: config.emergencyContact?.relation || 'Spouse',
      phone: config.emergencyContact?.phone || '+91-9876543299'
    },
    personalInformation: {
      gender: user.gender || 'Not specified',
      joiningDate: user.joiningDate || '2025-04-15'
    }
  }

  if (roleKey === 'employee') {
    baseProfile.phone = user.phone || '+91-98765-00001'
    baseProfile.designation = user.designation || 'Developer'
    baseProfile.department = user.department || 'Engineering'
    baseProfile.address = user.address || 'Bengaluru, Karnataka'
    baseProfile.role = user.role || 'employee'
  }

  return baseProfile
}

const readProfileFromStorage = (roleKey, user) => {
  const config = getRoleConfig(roleKey)
  const stored = safeParse(localStorage.getItem(storageKeyForRole(roleKey)))
  const baseProfile = buildDefaultProfile(roleKey, { ...config, ...user })
  return mergeDeep(baseProfile, stored)
}

const editFieldsForRole = (roleKey) => {
  const fields = [
    { key: 'name', label: 'Full Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'designation', label: 'Designation', type: 'text' },
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'address', label: 'Address', type: 'textarea', fullWidth: true },
    { key: 'profileImage', label: 'Profile Image URL', type: 'text', fullWidth: true }
  ]

  if (roleKey === 'employee') {
    fields.push(
      { key: 'employeeId', label: 'Employee ID', type: 'text' },
      { key: 'companyId', label: 'Company ID', type: 'text' },
      { key: 'bankDetails.bankName', label: 'Bank Name', type: 'text' },
      { key: 'bankDetails.accountHolderName', label: 'Account Holder Name', type: 'text' },
      { key: 'bankDetails.accountNumber', label: 'Account Number', type: 'text' },
      { key: 'bankDetails.ifscCode', label: 'IFSC', type: 'text' },
      { key: 'emergencyContact.name', label: 'Emergency Name', type: 'text' },
      { key: 'emergencyContact.relation', label: 'Emergency Relation', type: 'text' },
      { key: 'emergencyContact.phone', label: 'Emergency Phone', type: 'text' }
    )
  }

  return fields
}

const getValueByPath = (object, path) =>
  path.split('.').reduce((value, part) => (value && typeof value === 'object' ? value[part] : undefined), object)

const setValueByPath = (object, path, value) => {
  const parts = path.split('.')
  const next = { ...object }
  let cursor = next
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = value
      return
    }
    cursor[part] = { ...(cursor[part] || {}) }
    cursor = cursor[part]
  })
  return next
}

function ProfileWorkspacePage({
  title = 'My Profile Page',
  description = 'View and update your profile details and change your password from the same screen.',
  breadcrumb = ['Profile'],
  roleKey: providedRoleKey
}) {
  const { user } = useAuth()
  const resolvedUser = user || getCurrentUser() || {}
  const roleKey = normalizeRoleKey(providedRoleKey || resolvedUser?.role)
  const roleSettings = getRoleConfig(roleKey)
  const storageKey = useMemo(() => storageKeyForRole(roleKey), [roleKey])

  const [activeTab, setActiveTab] = useState('My Profile')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editForm, setEditForm] = useState({})
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const tabs = useMemo(() => ['My Profile', 'Edit Profile', 'Change Password'], [])
  const editFields = useMemo(() => editFieldsForRole(roleKey), [roleKey])

  const clearAlerts = () => {
    setError('')
    setSuccess('')
  }

  const syncAuthUser = (nextProfile) => {
    const nextUser = {
      ...resolvedUser,
      id: nextProfile.id || resolvedUser.id,
      name: nextProfile.name,
      email: nextProfile.email,
      role: nextProfile.role || resolvedUser.role,
      phone: nextProfile.phone,
      designation: nextProfile.designation,
      department: nextProfile.department,
      address: nextProfile.address,
      employeeId: nextProfile.employeeId,
      companyId: nextProfile.companyId,
      profileImage: nextProfile.profileImage,
      status: nextProfile.status
    }

    saveToken(getToken(), nextUser)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hrms:auth-updated', { detail: { user: nextUser } }))
    }
  }

  const applyProfile = (nextProfile) => {
    setProfile(nextProfile)
    setEditForm({
      name: nextProfile.name || '',
      email: nextProfile.email || '',
      phone: nextProfile.phone || '',
      designation: nextProfile.designation || '',
      department: nextProfile.department || '',
      address: nextProfile.address || '',
      profileImage: nextProfile.profileImage || '',
      employeeId: nextProfile.employeeId || '',
      companyId: nextProfile.companyId || '',
      bankDetails: {
        bankName: nextProfile.bankDetails?.bankName || '',
        accountHolderName: nextProfile.bankDetails?.accountHolderName || '',
        accountNumber: nextProfile.bankDetails?.accountNumber || '',
        ifscCode: nextProfile.bankDetails?.ifscCode || ''
      },
      emergencyContact: {
        name: nextProfile.emergencyContact?.name || '',
        relation: nextProfile.emergencyContact?.relation || '',
        phone: nextProfile.emergencyContact?.phone || ''
      }
    })
  }

  useEffect(() => {
    const nextProfile = readProfileFromStorage(roleKey, resolvedUser)
    applyProfile(nextProfile)
    setLoading(false)
    clearAlerts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleKey, resolvedUser.id, resolvedUser.email, resolvedUser.name, storageKey])

  const persistProfile = (nextProfile) => {
    localStorage.setItem(storageKey, JSON.stringify(nextProfile))
    syncAuthUser(nextProfile)
    setProfile(nextProfile)
  }

  const saveProfile = async () => {
    if (!String(editForm.name || '').trim()) {
      setError('Name is required')
      return
    }

    setSubmitting(true)
    clearAlerts()
    try {
      const nextProfile = {
        ...profile,
        name: String(editForm.name || '').trim(),
        email: String(editForm.email || '').trim(),
        phone: String(editForm.phone || '').trim(),
        designation: String(editForm.designation || '').trim(),
        department: String(editForm.department || '').trim(),
        address: String(editForm.address || '').trim(),
        profileImage: String(editForm.profileImage || '').trim(),
        employeeId: String(editForm.employeeId || '').trim(),
        companyId: String(editForm.companyId || '').trim(),
        bankDetails: {
          ...(profile?.bankDetails || {}),
          ...(editForm.bankDetails || {})
        },
        emergencyContact: {
          ...(profile?.emergencyContact || {}),
          ...(editForm.emergencyContact || {})
        }
      }

      persistProfile(nextProfile)
      setSuccess('Profile updated successfully')
      setActiveTab('My Profile')
    } catch (_err) {
      setError('Failed to update profile')
    } finally {
      setSubmitting(false)
    }
  }

  const updatePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('All password fields are required')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password and confirm password do not match')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    if (!/[A-Z]/.test(passwordForm.newPassword) || !/[a-z]/.test(passwordForm.newPassword) || !/\d/.test(passwordForm.newPassword)) {
      setError('Password must include uppercase, lowercase, and number')
      return
    }
    if (String(profile?.password || '').trim() && passwordForm.currentPassword !== profile.password) {
      setError('Current password is incorrect')
      return
    }

    setSubmitting(true)
    clearAlerts()
    try {
      const nextProfile = { ...profile, password: passwordForm.newPassword }
      persistProfile(nextProfile)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setSuccess('Password updated successfully')
    } catch (_err) {
      setError('Failed to update password')
    } finally {
      setSubmitting(false)
    }
  }

  const avatarLetter = String(profile?.name || roleSettings.label || 'U').slice(0, 1).toUpperCase()
  const activitySummary = profile?.activitySummary || roleSettings.activitySummary
  const profileCardFields = [
    { label: 'Name', value: profile?.name || '-' },
    { label: 'Email', value: profile?.email || '-' },
    { label: 'Phone', value: profile?.phone || '-' },
    { label: 'Designation', value: profile?.designation || '-' },
    { label: 'Department', value: profile?.department || '-' },
    { label: 'Address', value: profile?.address || '-' },
    { label: 'Role', value: String(profile?.role || roleKey).replace(/_/g, ' ') },
    { label: 'Company ID', value: profile?.companyId || '-' },
    { label: 'Employee ID', value: profile?.employeeId || '-' },
    { label: 'Assigned Team', value: profile?.assignedTeam || '-' },
    { label: 'Permissions', value: profile?.permissions || '-' },
    { label: 'Last Login', value: profile?.lastLogin || '-' }
  ]

  if (loading) {
    return (
      <section className="section-layout profile-workspace">
        <PageHeader title={title} description={description} breadcrumb={breadcrumb} />
        <div className="panel"><LoadingSkeleton rows={8} /></div>
      </section>
    )
  }

  if (!profile) {
    return (
      <section className="section-layout profile-workspace">
        <PageHeader title={title} description={description} breadcrumb={breadcrumb} />
        <div className="panel"><EmptyState title="Profile unavailable" description="Unable to load your profile." /></div>
      </section>
    )
  }

  return (
    <section className="section-layout profile-workspace">
      <PageHeader title={title} description={description} breadcrumb={breadcrumb} />

      <div className="panel">
        <div className="workspace-nav">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`chip-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab); clearAlerts() }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={() => applyProfile(readProfileFromStorage(roleKey, resolvedUser))} disabled={submitting}>Refresh</Button>
        </div>
      </div>

      {error ? <div className="panel error-banner">{error}</div> : null}
      {success ? <div className="panel success-banner">{success}</div> : null}

      {!loading && activeTab === 'My Profile' ? (
        <div className="panel manager-profile-panel">
          <div className="panel-head">
            <h3>My Profile</h3>
            <div className="actions-row">
              <Button onClick={() => setActiveTab('Edit Profile')}>Edit Profile</Button>
              <Button variant="ghost" onClick={() => setActiveTab('Change Password')}>Change Password</Button>
            </div>
          </div>

          <div className="manager-profile-hero">
            {profile.profileImage ? (
              <img src={profile.profileImage} alt={profile.name || roleSettings.label} className="manager-profile-avatar" />
            ) : (
              <div className="manager-profile-avatar-fallback">{avatarLetter}</div>
            )}
            <div className="manager-profile-hero-content">
              <h4>{profile.name || roleSettings.label}</h4>
              <p>{profile.email || '-'}</p>
              <div className="actions-row">
                <span className="badge badge-info">{roleSettings.roleTitle}</span>
                <span className={`badge ${String(profile.status || '').toLowerCase() === 'active' ? 'badge-active' : 'badge-neutral'}`}>{profile.status || 'Active'}</span>
              </div>
            </div>
          </div>

          <div className="manager-profile-grid">
            {profileCardFields.map((item) => (
              <div key={item.label} className="inline-action-card">
                <strong>{item.label}</strong>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!loading && activeTab === 'Edit Profile' ? (
        <div className="panel modal-form">
          <div className="panel-head">
            <h3>Edit Profile</h3>
            <div className="actions-row">
              <Button variant="ghost" onClick={() => setActiveTab('My Profile')} disabled={submitting}>Cancel</Button>
              <Button onClick={saveProfile} disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </div>
          <p className="helper-text">Edit profile fields are enabled only in this tab.</p>

          <div className="form-grid">
            {editFields.filter((item) => !item.fullWidth && item.type !== 'textarea').map((field) => (
              <label key={field.key} className="form-input-wrap">
                <span>{field.label}</span>
                <input
                  className="form-input"
                  type={field.type}
                  value={String(getValueByPath(editForm, field.key) || '')}
                  onChange={(event) => setEditForm((prev) => setValueByPath(prev, field.key, event.target.value))}
                />
              </label>
            ))}
          </div>

          {editFields.filter((item) => item.type === 'textarea' || item.fullWidth).map((field) => (
            <label key={field.key} className="form-input-wrap">
              <span>{field.label}</span>
              {field.type === 'textarea' ? (
                <textarea
                  className="form-input"
                  rows={3}
                  value={String(getValueByPath(editForm, field.key) || '')}
                  onChange={(event) => setEditForm((prev) => setValueByPath(prev, field.key, event.target.value))}
                />
              ) : (
                <input
                  className="form-input"
                  type={field.type}
                  value={String(getValueByPath(editForm, field.key) || '')}
                  onChange={(event) => setEditForm((prev) => setValueByPath(prev, field.key, event.target.value))}
                />
              )}
            </label>
          ))}
        </div>
      ) : null}

      {!loading && activeTab === 'Change Password' ? (
        <div className="panel modal-form">
          <div className="panel-head">
            <h3>Change Password</h3>
          </div>
          <p className="helper-text">Your password is updated locally in the frontend profile workspace.</p>
          <label className="form-input-wrap">
            <span>Current Password</span>
            <input
              type="password"
              className="form-input"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
            />
          </label>
          <label className="form-input-wrap">
            <span>New Password</span>
            <input
              type="password"
              className="form-input"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
            />
          </label>
          <label className="form-input-wrap">
            <span>Confirm Password</span>
            <input
              type="password"
              className="form-input"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
            />
          </label>
          <div className="actions-row">
            <Button onClick={updatePassword} disabled={submitting}>{submitting ? 'Updating...' : 'Update Password'}</Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default ProfileWorkspacePage

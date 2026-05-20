import { useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import {
  changeEmployeePassword,
  getEmployeeProfile,
  updateEmployeeProfile
} from '../../api/employeeProfileApi'

const tabs = ['My Profile', 'Edit Profile', 'Change Password']

function EmployeeProfilePage() {
  const [activeTab, setActiveTab] = useState('My Profile')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [personal, setPersonal] = useState({ name: '', gender: '' })
  const [contact, setContact] = useState({ email: '', phone: '', address: '' })
  const [bank, setBank] = useState({ accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '' })
  const [emergency, setEmergency] = useState({ name: '', relation: '', phone: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const clearAlerts = () => {
    setError('')
    setSuccess('')
  }

  const applyProfileState = (payload) => {
    const data = payload?.data || null
    setProfile(data)
    setPersonal({
      name: data?.personalInformation?.name || '',
      gender: data?.personalInformation?.gender || ''
    })
    setContact({
      email: data?.contactInformation?.email || '',
      phone: data?.contactInformation?.phone || '',
      address: data?.contactInformation?.address || ''
    })
    setBank({
      accountHolderName: data?.bankDetails?.accountHolderName || '',
      accountNumber: data?.bankDetails?.accountNumber || '',
      ifscCode: data?.bankDetails?.ifscCode || '',
      bankName: data?.bankDetails?.bankName || ''
    })
    setEmergency({
      name: data?.emergencyContact?.name || '',
      relation: data?.emergencyContact?.relation || '',
      phone: data?.emergencyContact?.phone || ''
    })
  }

  const loadProfile = async () => {
    setLoading(true)
    clearAlerts()
    try {
      const payload = await getEmployeeProfile()
      applyProfileState(payload)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProfile() }, [])

  const saveProfileSection = async (sectionPayload) => {
    if (sectionPayload?.personalInformation && !String(sectionPayload.personalInformation.name || '').trim()) {
      setError('Name is required')
      return
    }
    setSubmitting(true)
    clearAlerts()
    try {
      const payload = await updateEmployeeProfile(sectionPayload)
      applyProfileState(payload)
      setSuccess(payload?.message || 'Profile updated successfully')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile')
    } finally {
      setSubmitting(false)
    }
  }

  const onChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return setError('All password fields are required')
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setError('New password and confirm password do not match')
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      return setError('New password must be different from current password')
    }
    setSubmitting(true)
    clearAlerts()
    try {
      const payload = await changeEmployeePassword(passwordForm)
      setSuccess(payload?.message || 'Password updated successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="My Profile"
        description="View and update your personal, contact, bank, and emergency information."
        breadcrumb={['Employee Portal', 'Profile']}
      />

      <div className="panel">
        <div className="workspace-nav">
          {tabs.map((tab) => (
            <button key={tab} type="button" className={`chip-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => { setActiveTab(tab); clearAlerts() }}>{tab}</button>
          ))}
        </div>
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={loadProfile} disabled={submitting}>Refresh</Button>
        </div>
      </div>

      {error ? <div className="panel error-banner">{error}</div> : null}
      {success ? <div className="panel success-banner">{success}</div> : null}

      {loading ? <div className="panel"><LoadingSkeleton rows={8} /></div> : null}
      {!loading && !profile ? <div className="panel"><EmptyState title="Profile unavailable" description="Unable to load your profile." /></div> : null}

      {!loading && profile && activeTab === 'My Profile' ? (
        <div className="panel manager-profile-panel">
          <div className="panel-head"><h3>My Profile</h3></div>
          <div className="manager-profile-hero">
            <div className="manager-profile-avatar-fallback">{String(profile?.personalInformation?.name || 'E').slice(0, 1).toUpperCase()}</div>
            <div className="manager-profile-hero-content">
              <h4>{profile?.personalInformation?.name || 'Employee'}</h4>
              <p>{profile?.contactInformation?.email || '-'}</p>
              <div className="actions-row">
                <span className="badge badge-info">{String(profile.role || 'employee').replace(/^./, (c) => c.toUpperCase())}</span>
                <span className={`badge ${String(profile.status || '').toLowerCase() === 'active' ? 'badge-active' : 'badge-neutral'}`}>{profile.status || '-'}</span>
              </div>
            </div>
          </div>

          <div className="manager-profile-grid">
            <div className="inline-action-card"><strong>Phone</strong><span>{profile?.contactInformation?.phone || '-'}</span></div>
            <div className="inline-action-card"><strong>Address</strong><span>{profile?.contactInformation?.address || '-'}</span></div>
            <div className="inline-action-card"><strong>Gender</strong><span>{profile?.personalInformation?.gender || '-'}</span></div>
            <div className="inline-action-card"><strong>Employee ID</strong><span>{profile?.employeeId || '-'}</span></div>
            <div className="inline-action-card"><strong>Designation</strong><span>{profile?.jobInformation?.designation || '-'}</span></div>
            <div className="inline-action-card"><strong>Department ID</strong><span>{profile?.jobInformation?.departmentId || '-'}</span></div>
            <div className="inline-action-card"><strong>Manager ID</strong><span>{profile?.jobInformation?.managerId || '-'}</span></div>
            <div className="inline-action-card"><strong>Joining Date</strong><span>{profile?.jobInformation?.joiningDate ? String(profile.jobInformation.joiningDate).slice(0, 10) : '-'}</span></div>
            <div className="inline-action-card"><strong>Bank Name</strong><span>{profile?.bankDetails?.bankName || '-'}</span></div>
            <div className="inline-action-card"><strong>Account Holder</strong><span>{profile?.bankDetails?.accountHolderName || '-'}</span></div>
            <div className="inline-action-card"><strong>Account Number</strong><span>{profile?.bankDetails?.accountNumber || '-'}</span></div>
            <div className="inline-action-card"><strong>IFSC</strong><span>{profile?.bankDetails?.ifscCode || '-'}</span></div>
            <div className="inline-action-card"><strong>Emergency Name</strong><span>{profile?.emergencyContact?.name || '-'}</span></div>
            <div className="inline-action-card"><strong>Emergency Relation</strong><span>{profile?.emergencyContact?.relation || '-'}</span></div>
            <div className="inline-action-card"><strong>Emergency Phone</strong><span>{profile?.emergencyContact?.phone || '-'}</span></div>
          </div>

          <div className="actions-row">
            <Button onClick={() => setActiveTab('Edit Profile')}>Edit Profile</Button>
          </div>
        </div>
      ) : null}

      {!loading && profile && activeTab === 'Edit Profile' ? (
        <div className="panel modal-form">
          <div className="panel-head"><h3>Edit Profile</h3></div>

          <h4>Personal Information</h4>
          <div className="form-grid">
            <label className="form-input-wrap"><span>Name</span><input className="form-input" value={personal.name} onChange={(e) => setPersonal((p) => ({ ...p, name: e.target.value }))} /></label>
            <label className="form-input-wrap">
              <span>Gender</span>
              <select className="form-input" value={personal.gender} onChange={(e) => setPersonal((p) => ({ ...p, gender: e.target.value }))}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
          <div className="actions-row">
            <Button onClick={() => saveProfileSection({ personalInformation: personal })} disabled={submitting}>{submitting ? 'Saving...' : 'Save Personal Info'}</Button>
          </div>

          <h4>Contact Information</h4>
          <div className="form-grid">
            <label className="form-input-wrap"><span>Email</span><input className="form-input" value={contact.email} disabled /></label>
            <label className="form-input-wrap"><span>Phone</span><input className="form-input" value={contact.phone} onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))} /></label>
          </div>
          <label className="form-input-wrap"><span>Address</span><textarea className="form-input" rows={3} value={contact.address} onChange={(e) => setContact((p) => ({ ...p, address: e.target.value }))} /></label>
          <div className="actions-row">
            <Button onClick={() => saveProfileSection({ contactInformation: contact })} disabled={submitting}>{submitting ? 'Saving...' : 'Save Contact Info'}</Button>
          </div>

          <h4>Bank Details</h4>
          <div className="form-grid">
            <label className="form-input-wrap"><span>Account Holder Name</span><input className="form-input" value={bank.accountHolderName} onChange={(e) => setBank((p) => ({ ...p, accountHolderName: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Account Number</span><input className="form-input" value={bank.accountNumber} onChange={(e) => setBank((p) => ({ ...p, accountNumber: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>IFSC Code</span><input className="form-input" value={bank.ifscCode} onChange={(e) => setBank((p) => ({ ...p, ifscCode: e.target.value.toUpperCase() }))} /></label>
            <label className="form-input-wrap"><span>Bank Name</span><input className="form-input" value={bank.bankName} onChange={(e) => setBank((p) => ({ ...p, bankName: e.target.value }))} /></label>
          </div>
          <div className="actions-row">
            <Button onClick={() => saveProfileSection({ bankDetails: bank })} disabled={submitting}>{submitting ? 'Saving...' : 'Save Bank Details'}</Button>
          </div>

          <h4>Emergency Contact</h4>
          <div className="form-grid">
            <label className="form-input-wrap"><span>Name</span><input className="form-input" value={emergency.name} onChange={(e) => setEmergency((p) => ({ ...p, name: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Relation</span><input className="form-input" value={emergency.relation} onChange={(e) => setEmergency((p) => ({ ...p, relation: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Phone</span><input className="form-input" value={emergency.phone} onChange={(e) => setEmergency((p) => ({ ...p, phone: e.target.value }))} /></label>
          </div>
          <div className="actions-row">
            <Button onClick={() => saveProfileSection({ emergencyContact: emergency })} disabled={submitting}>{submitting ? 'Saving...' : 'Save Emergency Contact'}</Button>
            <Button variant="ghost" onClick={() => setActiveTab('My Profile')} disabled={submitting}>Back to My Profile</Button>
          </div>
        </div>
      ) : null}

      {!loading && profile && activeTab === 'Change Password' ? (
        <div className="panel modal-form">
          <div className="panel-head"><h3>Change Password</h3></div>
          <label className="form-input-wrap"><span>Current Password</span><input type="password" className="form-input" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))} /></label>
          <label className="form-input-wrap"><span>New Password</span><input type="password" className="form-input" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} /></label>
          <label className="form-input-wrap"><span>Confirm Password</span><input type="password" className="form-input" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))} /></label>
          <div className="actions-row"><Button onClick={onChangePassword} disabled={submitting}>{submitting ? 'Updating...' : 'Update Password'}</Button></div>
        </div>
      ) : null}
    </section>
  )
}

export default EmployeeProfilePage

import { useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import { getEmployeeProfile } from '../../api/employeeProfileApi'

function EmployeeProfilePage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const clearAlerts = () => {
    setError('')
    setSuccess('')
  }

  const applyProfileState = (payload) => {
    const data = payload?.data || null
    setProfile(data)
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

  return (
    <section className="section-layout">
      <PageHeader
        title="My Profile"
        description="View your personal, contact, bank, and emergency information. Contact HR for profile updates."
        breadcrumb={['Employee Portal', 'Profile']}
      />

      {error ? <div className="panel error-banner">{error}</div> : null}
      {success ? <div className="panel success-banner">{success}</div> : null}

      {loading ? <div className="panel"><LoadingSkeleton rows={8} /></div> : null}
      {!loading && !profile ? <div className="panel"><EmptyState title="Profile unavailable" description="Unable to load your profile." /></div> : null}

      {!loading && profile ? (
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

        </div>
      ) : null}

    </section>
  )
}

export default EmployeeProfilePage

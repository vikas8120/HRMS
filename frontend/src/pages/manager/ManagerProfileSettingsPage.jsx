import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import { getManagerProfile } from '../../api/managerProfileApi'

const tabs = ['My Profile']

function ManagerProfileSettingsPage() {
  const [activeTab, setActiveTab] = useState('My Profile')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [toast, setToast] = useState(null)

  const profileDetails = useMemo(() => {
    if (!profile) return null
    const pick = (...values) => values.find((value) => String(value || '').trim())
    const joiningDateRaw = pick(profile.joiningDate, profile.jobDetails?.joiningDate, profile.jobInformation?.joiningDate)

    return {
      phone: pick(profile.phone, profile.contact?.phone, profile.personalInfo?.phone, profile.contactInformation?.phone) || '-',
      address: pick(profile.address, profile.contact?.address, profile.personalInfo?.address, profile.contactInformation?.address) || '-',
      gender: pick(profile.gender, profile.personalInfo?.gender, profile.personalInformation?.gender) || '-',
      employeeId: pick(profile.employeeId, profile.managerId, profile.userId, profile.id) || '-',
      designation: pick(profile.designation, profile.jobDetails?.designation, profile.jobInformation?.designation) || '-',
      departmentId: pick(profile.departmentId, profile.departmentName, profile.department, profile.jobDetails?.departmentId, profile.jobInformation?.departmentId) || '-',
      managerId: pick(profile.reportingManagerId, profile.reportingManager, profile.reportingTo, profile.jobDetails?.reportingTo, profile.jobInformation?.managerId) || '-',
      joiningDate: joiningDateRaw ? String(joiningDateRaw).slice(0, 10) : '-',
      bankName: pick(profile.bankDetails?.bankName, profile.bankName) || '-',
      accountHolder: pick(profile.bankDetails?.accountHolderName, profile.accountHolderName) || '-',
      accountNumber: pick(profile.bankDetails?.accountNumber, profile.accountNumber) || '-',
      ifsc: pick(profile.bankDetails?.ifscCode, profile.ifscCode) || '-',
      emergencyName: pick(profile.emergencyContact?.name, profile.emergencyName) || '-',
      emergencyRelation: pick(profile.emergencyContact?.relation, profile.emergencyRelation) || '-',
      emergencyPhone: pick(profile.emergencyContact?.phone, profile.emergencyPhone) || '-'
    }
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
  }

  const loadAll = async () => {
    setLoading(true)
    const results = await Promise.allSettled([loadProfile()])
    const failed = results.find((x) => x.status === 'rejected')
    if (failed) {
      setToast({ type: 'error', message: failed.reason?.response?.data?.message || 'Failed to load profile data' })
    }
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

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
          <Button variant="ghost" onClick={loadAll}>Refresh Profile Data</Button>
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
            <div className="inline-action-card"><strong>Phone</strong><span>{profileDetails?.phone || '-'}</span></div>
            <div className="inline-action-card"><strong>Address</strong><span>{profileDetails?.address || '-'}</span></div>
            <div className="inline-action-card"><strong>Gender</strong><span>{profileDetails?.gender || '-'}</span></div>
            <div className="inline-action-card"><strong>Employee ID</strong><span>{profileDetails?.employeeId || '-'}</span></div>
            <div className="inline-action-card"><strong>Designation</strong><span>{profileDetails?.designation || '-'}</span></div>
            <div className="inline-action-card"><strong>Department ID</strong><span>{profileDetails?.departmentId || '-'}</span></div>
            <div className="inline-action-card"><strong>Manager ID</strong><span>{profileDetails?.managerId || '-'}</span></div>
            <div className="inline-action-card"><strong>Joining Date</strong><span>{profileDetails?.joiningDate || '-'}</span></div>
            <div className="inline-action-card"><strong>Bank Name</strong><span>{profileDetails?.bankName || '-'}</span></div>
            <div className="inline-action-card"><strong>Account Holder</strong><span>{profileDetails?.accountHolder || '-'}</span></div>
            <div className="inline-action-card"><strong>Account Number</strong><span>{profileDetails?.accountNumber || '-'}</span></div>
            <div className="inline-action-card"><strong>IFSC</strong><span>{profileDetails?.ifsc || '-'}</span></div>
            <div className="inline-action-card"><strong>Emergency Name</strong><span>{profileDetails?.emergencyName || '-'}</span></div>
            <div className="inline-action-card"><strong>Emergency Relation</strong><span>{profileDetails?.emergencyRelation || '-'}</span></div>
            <div className="inline-action-card"><strong>Emergency Phone</strong><span>{profileDetails?.emergencyPhone || '-'}</span></div>
          </div>
        </div>
      ) : null}

    </section>
  )
}

export default ManagerProfileSettingsPage

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

    </section>
  )
}

export default ManagerProfileSettingsPage

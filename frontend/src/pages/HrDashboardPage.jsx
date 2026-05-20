import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import EmptyState from '../components/ui/EmptyState'
import { getHrDashboard } from '../api/hrPortalApi'

function HrDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getHrDashboard()
      setData(res?.data || res || null)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load HR dashboard')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const stats = useMemo(() => ([
    { label: 'Total Employees', value: data?.totalEmployees ?? 0 },
    { label: 'Present Today', value: data?.presentToday ?? 0 },
    { label: 'Absent Today', value: data?.absentToday ?? 0 },
    { label: 'Pending Leaves', value: data?.pendingLeaves ?? 0 },
    { label: 'Total Departments', value: data?.totalDepartments ?? 0 },
    { label: 'Monthly Payroll', value: data?.monthlyPayroll ?? 0 }
  ]), [data])

  return (
    <section className="section-layout">
      <PageHeader
        title="HR Dashboard"
        description="Live HR KPI workspace with attendance, leaves, payroll, and activity tracking."
        breadcrumb={['HR Portal', 'Dashboard']}
        primaryActionLabel="Refresh"
        onPrimaryAction={load}
      />

      {loading ? <LoadingSkeleton rows={6} /> : null}
      {!loading && error ? <div className="panel"><EmptyState title="Unable to load dashboard" description={error} /></div> : null}

      {!loading && !error ? (
        <>
          <div className="stats-grid">
            {stats.map((item) => (
              <article key={item.label} className="stat-card">
                <p className="stat-title">{item.label}</p>
                <h2 className="stat-value">{item.value}</h2>
              </article>
            ))}
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Alerts</h3></div>
            {!data?.alerts?.length ? <EmptyState title="No alerts" description="All critical HR checks look good." /> : (
              <div className="insights-list">
                {data.alerts.map((alert) => (
                  <div key={alert.id} className={`insight-tile ${alert.severity || 'info'}`}>
                    <strong>{alert.title}</strong>
                    <p>{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Recent Activities</h3></div>
            {!data?.recentActivities?.length ? <EmptyState title="No activity logs" /> : (
              <div className="timeline">
                {data.recentActivities.slice(0, 8).map((item) => (
                  <div key={item.id} className="timeline-item">
                    <span className="timeline-dot" />
                    <div>
                      <strong>{item.action}</strong>
                      <p>{item.message || '-'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  )
}

export default HrDashboardPage


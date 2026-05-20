import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart
} from 'recharts'
import {
  Building2,
  CalendarCheck2,
  CalendarClock,
  RefreshCw,
  UserCog,
  UserRound,
  Users,
  Wallet
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import EmptyState from '../components/ui/EmptyState'
import { getCompanyAdminDashboard } from '../api/dashboardApi'

const formatCurrency = (value) => Number(value || 0).toLocaleString('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

function CompanyAdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState(null)

  const loadDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await getCompanyAdminDashboard()
      const payload = response?.data || response
      setDashboard(payload || null)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const cards = useMemo(() => {
    const data = dashboard

    return [
      { title: 'Total Employees', value: String(data?.totalEmployees ?? 0), trend: 'Company workforce', icon: UserRound, trendTone: 'success' },
      { title: 'Total HR', value: String(data?.totalHR ?? 0), trend: 'HR operations team', icon: Users, trendTone: 'info' },
      { title: 'Total Managers', value: String(data?.totalManagers ?? 0), trend: 'Team leadership count', icon: UserCog, trendTone: 'info' },
      { title: 'Departments', value: String(data?.totalDepartments ?? 0), trend: 'Organizational units', icon: Building2, trendTone: 'info' },
      { title: 'Today Attendance', value: `${data?.todayAttendance?.present ?? data?.presentToday ?? 0}/${data?.todayAttendance?.total ?? data?.totalEmployees ?? 0}`, trend: `${data?.todayAttendance?.absent ?? data?.absentToday ?? 0} absent`, icon: CalendarCheck2, trendTone: 'success' },
      { title: 'Pending Leaves', value: String(data?.pendingLeaves ?? 0), trend: `${data?.approvedLeaves ?? 0} approved`, icon: CalendarClock, trendTone: 'warning' },
      { title: 'Payroll Summary', value: formatCurrency(data?.monthlyPayroll ?? 0), trend: `${data?.rejectedLeaves ?? 0} rejected leaves`, icon: Wallet, trendTone: 'warning' }
    ]
  }, [dashboard])

  const attendanceChartData = dashboard?.attendanceChartData || []
  const payrollChartData = dashboard?.payrollChartData || []
  const departmentWiseEmployees = dashboard?.departmentWiseEmployees || []

  const recentEmployees = (dashboard?.recentEmployees || []).map((item, index) => ({
    id: item._id || `emp-${index}`,
    name: item.name || '-',
    email: item.email || '-',
    status: item.status || 'active',
    joined: item.joiningDate ? String(item.joiningDate).slice(0, 10) : (item.createdAt ? String(item.createdAt).slice(0, 10) : '-')
  }))

  const recentLeaveRequests = (dashboard?.recentLeaveRequests || []).map((item, index) => ({
    id: item.id || `leave-${index}`,
    employee: item.employeeName || '-',
    type: item.type || '-',
    status: item.status || 'pending',
    period: `${item.fromDate ? String(item.fromDate).slice(0, 10) : '-'} to ${item.toDate ? String(item.toDate).slice(0, 10) : '-'}`
  }))

  const recentActivities = (dashboard?.recentActivities || []).map((item, index) => ({
    id: item.id || `activity-${index}`,
    action: item.action || '-',
    message: item.message || '-',
    module: item.module || '-',
    createdAt: item.createdAt ? String(item.createdAt).slice(0, 19).replace('T', ' ') : '-'
  }))

  const profile = dashboard?.companyProfileSummary || null
  const alerts = dashboard?.alerts || []

  const companySummaryRows = profile ? [
    { id: 'cname', field: 'Company', value: profile.companyName || '-' },
    { id: 'ccode', field: 'Code', value: profile.companyCode || '-' },
    { id: 'cplan', field: 'Plan', value: profile.plan || '-' },
    { id: 'cstatus', field: 'Status', value: profile.status || '-' },
    { id: 'ctimezone', field: 'Timezone', value: profile.timezone || '-' },
    { id: 'ccurrency', field: 'Currency', value: profile.currency || '-' },
    { id: 'clocation', field: 'Location', value: profile.location || '-' },
    { id: 'climit', field: 'Employee Limit', value: String(profile.employeeLimit ?? '-') }
  ] : []

  const alertRows = alerts.map((item, index) => ({
    id: item.id || `alert-${index}`,
    severity: item.severity || 'info',
    title: item.title || 'Notification',
    message: item.message || '-'
  }))

  const employeeColumns = [
    { key: 'name', label: 'Employee' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
    { key: 'joined', label: 'Joined' }
  ]

  const leaveColumns = [
    { key: 'employee', label: 'Employee' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
    { key: 'period', label: 'Period', sortable: false }
  ]

  const activityColumns = [
    { key: 'action', label: 'Action' },
    { key: 'message', label: 'Message', sortable: false },
    { key: 'module', label: 'Module' },
    { key: 'createdAt', label: 'Created At' }
  ]

  const companySummaryColumns = [
    { key: 'field', label: 'Field' },
    { key: 'value', label: 'Value', sortable: false }
  ]

  const alertsColumns = [
    { key: 'severity', label: 'Severity' },
    { key: 'title', label: 'Alert' },
    { key: 'message', label: 'Message', sortable: false }
  ]

  const noDashboardData = !loading
    && !error
    && !!dashboard
    && Number(dashboard.totalEmployees ?? 0) === 0
    && Number(dashboard.totalHR ?? 0) === 0
    && Number(dashboard.totalManagers ?? 0) === 0
    && Number(dashboard.totalDepartments ?? 0) === 0
    && Number(dashboard.presentToday ?? 0) === 0
    && Number(dashboard.pendingLeaves ?? 0) === 0
    && Number(dashboard.monthlyPayroll ?? 0) === 0
    && (dashboard.recentEmployees || []).length === 0
    && (dashboard.recentLeaveRequests || []).length === 0
    && (dashboard.recentActivities || []).length === 0

  return (
    <section className="section-layout dashboard-premium">
      <PageHeader
        title="Company Dashboard"
        description="Live operational insights for employees, leaves, attendance, payroll, and departments."
        breadcrumb={['Company Admin', 'Dashboard']}
        primaryActionLabel=""
      />

      <div className="panel dashboard-header-actions">
        <div className="header-tagline">
          <h3>Operational Overview</h3>
          <p>Real-time company-level data from your HRMS backend.</p>
        </div>
        <div className="actions-row">
          <Button variant="ghost" onClick={loadDashboard}><RefreshCw size={14} /> Refresh</Button>
        </div>
      </div>

      {error ? (
        <div className="panel dashboard-error-card">
          <div>
            <h4>Unable to load dashboard</h4>
            <p>{error}</p>
          </div>
          <Button variant="ghost" onClick={loadDashboard}>Retry</Button>
        </div>
      ) : null}

      {loading ? <LoadingSkeleton rows={8} /> : (
        <div className="stats-grid premium-stats-grid">
          {cards.map((item) => <StatCard key={item.title} {...item} />)}
        </div>
      )}

      {noDashboardData ? (
        <div className="panel">
          <EmptyState title="No dashboard data" description="No records found for this company yet." />
        </div>
      ) : null}

      <div className="dashboard-main-grid">
        <article className="panel revenue-chart-card">
          <div className="panel-head"><h3>Attendance Overview</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : attendanceChartData.length === 0 ? (
            <EmptyState title="No attendance data" description="Attendance entries will appear here once records are marked." />
          ) : (
            <div style={{ height: 270 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={220}>
                <AreaChart data={attendanceChartData}>
                  <defs>
                    <linearGradient id="attPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.65} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--panel-tint)', border: '1px solid var(--line)', borderRadius: 10 }} />
                  <Area type="monotone" dataKey="present" stroke="#10b981" fill="url(#attPresent)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="absent" stroke="#ef4444" fillOpacity={0} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="panel lead-sources-card">
          <div className="panel-head"><h3>Payroll Overview</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : payrollChartData.length === 0 ? (
            <EmptyState title="No payroll data" description="Payroll trends appear after payroll generation." />
          ) : (
            <div style={{ height: 270 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={220}>
                <BarChart data={payrollChartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--panel-tint)', border: '1px solid var(--line)', borderRadius: 10 }} formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </div>

      <article className="panel">
        <div className="panel-head"><h3>Department-wise Employees</h3></div>
        {loading ? <LoadingSkeleton rows={4} /> : departmentWiseEmployees.length === 0 ? (
          <EmptyState title="No department data" description="Department headcount distribution will appear here." />
        ) : (
          <div style={{ height: 290 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={240}>
              <PieChart>
                <Pie data={departmentWiseEmployees} dataKey="totalEmployees" nameKey="department" cx="50%" cy="50%" outerRadius={100}>
                  {departmentWiseEmployees.map((item, index) => {
                    const colors = ['#8b5cf6', '#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899']
                    return <Cell key={`dept-${item.department}-${index}`} fill={colors[index % colors.length]} />
                  })}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--panel-tint)', border: '1px solid var(--line)', borderRadius: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>

      <div className="dashboard-main-grid">
        <article className="panel">
          <div className="panel-head"><h3>Recent Employees</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : (
            <DataTable
              columns={employeeColumns}
              rows={recentEmployees}
              showActions={false}
              emptyTitle="No employees yet"
              emptyDescription="Newly added employees will appear here."
            />
          )}
        </article>

        <article className="panel">
          <div className="panel-head"><h3>Recent Leave Requests</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : (
            <DataTable
              columns={leaveColumns}
              rows={recentLeaveRequests}
              showActions={false}
              emptyTitle="No leave requests"
              emptyDescription="Recent leave requests will appear here."
            />
          )}
        </article>
      </div>

      <article className="panel recent-activities-card">
        <div className="panel-head"><h3>Recent Activities</h3></div>
        {loading ? <LoadingSkeleton rows={5} /> : (
          <DataTable
            columns={activityColumns}
            rows={recentActivities}
            showActions={false}
            emptyTitle="No recent activities"
            emptyDescription="Activity logs will appear after operational events."
          />
        )}
      </article>

      <div className="dashboard-main-grid">
        <article className="panel">
          <div className="panel-head"><h3>Company Profile Summary</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : (
            <DataTable
              columns={companySummaryColumns}
              rows={companySummaryRows}
              showActions={false}
              emptyTitle="No company profile data"
              emptyDescription="Company profile details will appear once configured."
            />
          )}
        </article>

        <article className="panel">
          <div className="panel-head"><h3>Alerts/Notifications</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : (
            <DataTable
              columns={alertsColumns}
              rows={alertRows}
              showActions={false}
              emptyTitle="No alerts"
              emptyDescription="All key operational checks are currently clear."
            />
          )}
        </article>
      </div>
    </section>
  )
}

export default CompanyAdminDashboardPage

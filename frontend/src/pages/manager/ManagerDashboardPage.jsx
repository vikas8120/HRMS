import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  ListChecks,
  TrendingUp,
  UserCheck,
  UserMinus,
  Users,
  RefreshCw,
  UserRound,
  CalendarCheck2,
  CalendarClock,
  ArrowRight
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Button from '../../components/ui/Button'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import DataTable from '../../components/ui/DataTable'
import EmptyState from '../../components/ui/EmptyState'
import { getManagerDashboard } from '../../api/managerDashboardApi'

const toDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toISOString().slice(0, 10)
}

function ManagerDashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState(null)

  const loadDashboard = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getManagerDashboard()
      setDashboard(response?.data || null)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load manager dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const cards = useMemo(() => {
    const values = dashboard?.cards || {}
    return [
      { title: 'Total Team Members', value: String(values.totalTeamMembers ?? 0), trend: 'Assigned to you', icon: Users, trendTone: 'info' },
      { title: 'Present Today', value: String(values.presentToday ?? 0), trend: 'Attendance status', icon: UserCheck, trendTone: 'success' },
      { title: 'Absent Today', value: String(values.absentToday ?? 0), trend: 'Needs follow-up', icon: UserMinus, trendTone: 'warning' },
      { title: 'Pending Leave Requests', value: String(values.pendingLeaveRequests ?? 0), trend: 'Awaiting action', icon: CalendarClock, trendTone: 'warning' },
      { title: 'Active Tasks', value: String(values.activeTasks ?? 0), trend: 'Open tasks', icon: ListChecks, trendTone: 'info' },
      { title: 'Completed Tasks', value: String(values.completedTasks ?? 0), trend: 'Delivered tasks', icon: CheckCircle2, trendTone: 'success' },
      { title: 'Overdue Tasks', value: String(values.overdueTasks ?? 0), trend: 'Past due date', icon: Clock3, trendTone: 'danger' },
      { title: 'Average Team Performance', value: String(values.averageTeamPerformance ?? 0), trend: 'Review score', icon: TrendingUp, trendTone: 'info' }
    ]
  }, [dashboard])

  const leaveRows = (dashboard?.pendingLeaveRequestsPreview || []).map((item) => ({
    id: item.id,
    employee: item.employeeName || '-',
    type: item.leaveType || '-',
    period: `${toDate(item.startDate)} to ${toDate(item.endDate)}`,
    status: item.status || 'pending'
  }))

  const attendanceRows = (dashboard?.todayAttendancePreview || []).map((item) => ({
    id: item.id,
    employee: item.employeeName || '-',
    status: item.status || 'absent',
    checkIn: item.checkIn || '-',
    checkOut: item.checkOut || '-'
  }))

  const performanceRows = (dashboard?.teamPerformanceSummary || []).map((item) => ({
    id: String(item.employeeId || item.employeeName),
    employee: item.employeeName || '-',
    averageScore: String(item.averageScore ?? 0),
    reviews: String(item.reviews ?? 0)
  }))

  const activityRows = (dashboard?.recentActivities || []).map((item) => ({
    id: item.id,
    module: item.module || '-',
    action: item.action || '-',
    message: item.message || '-',
    createdAt: item.createdAt ? String(item.createdAt).slice(0, 19).replace('T', ' ') : '-'
  }))

  const taskStatusChart = dashboard?.taskStatusChart || []

  const quickActions = [
    { label: 'View Team', onClick: () => navigate('/manager/team') },
    { label: 'View Attendance', onClick: () => navigate('/manager/attendance') },
    { label: 'View Pending Leaves', onClick: () => navigate('/manager/leaves') },
    { label: 'View Tasks', onClick: () => navigate('/manager/tasks') },
    { label: 'Assign Task', onClick: () => navigate('/manager/tasks?create=true') },
    { label: 'Add Review', onClick: () => navigate('/manager/performance') }
  ]

  const reveal = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] }
  }

  return (
    <section className="section-layout dashboard-premium">
      <PageHeader
        title="Manager Dashboard"
        description="Real-time team analytics, pending actions, and execution status for your assigned employees."
        breadcrumb={['Manager Portal', 'Dashboard']}
      />

      <motion.div className="panel dashboard-header-actions" {...reveal}>
        <div className="header-tagline">
          <h3>Team Command Center</h3>
          <p>All metrics are scoped to employees assigned to you.</p>
        </div>
        <div className="actions-row">
          <Button variant="ghost" onClick={loadDashboard}><RefreshCw size={14} /> Refresh</Button>
        </div>
      </motion.div>

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
        <motion.div className="stats-grid premium-stats-grid" {...reveal} transition={{ ...reveal.transition, delay: 0.05 }}>
          {cards.map((item) => <StatCard key={item.title} {...item} />)}
        </motion.div>
      )}

      <motion.div className="dashboard-main-grid" {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
        <article className="panel dashboard-float-card">
          <div className="panel-head"><h3>Task Status Chart</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : taskStatusChart.length === 0 ? (
            <EmptyState title="No task data" description="Task status visualization appears when tasks are available." />
          ) : (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={220} minHeight={220}>
                <BarChart data={taskStatusChart}>
                  <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                  <XAxis dataKey="status" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--panel-tint)', border: '1px solid var(--line)', borderRadius: 10 }} />
                  <Bar dataKey="count" fill="#6c63ff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="panel dashboard-float-card">
          <div className="panel-head"><h3>Quick Actions</h3></div>
          <div className="dashboard-mini-grid">
            {quickActions.map((item) => (
              <Button key={item.label} variant="ghost" onClick={item.onClick}>{item.label} <ArrowRight size={14} /></Button>
            ))}
          </div>
        </article>
      </motion.div>

      <motion.div className="dashboard-main-grid" {...reveal} transition={{ ...reveal.transition, delay: 0.14 }}>
        <article className="panel dashboard-float-card">
          <div className="panel-head"><h3>Pending Leave Requests Preview</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : (
            <DataTable
              columns={[
                { key: 'employee', label: 'Employee' },
                { key: 'type', label: 'Leave Type' },
                { key: 'period', label: 'Period', sortable: false },
                { key: 'status', label: 'Status' }
              ]}
              rows={leaveRows}
              showActions={false}
              emptyTitle="No pending leave requests"
              emptyDescription="Leave approvals pending in your team will appear here."
            />
          )}
        </article>

        <article className="panel dashboard-float-card">
          <div className="panel-head"><h3>Today Attendance Preview</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : (
            <DataTable
              columns={[
                { key: 'employee', label: 'Employee' },
                { key: 'status', label: 'Status' },
                { key: 'checkIn', label: 'Check-In' },
                { key: 'checkOut', label: 'Check-Out' }
              ]}
              rows={attendanceRows}
              showActions={false}
              emptyTitle="No attendance data"
              emptyDescription="Team attendance for today appears here."
            />
          )}
        </article>
      </motion.div>

      <motion.div className="dashboard-main-grid" {...reveal} transition={{ ...reveal.transition, delay: 0.18 }}>
        <article className="panel dashboard-float-card">
          <div className="panel-head"><h3>Team Performance Summary</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : (
            <DataTable
              columns={[
                { key: 'employee', label: 'Employee' },
                { key: 'averageScore', label: 'Avg Score' },
                { key: 'reviews', label: 'Reviews' }
              ]}
              rows={performanceRows}
              showActions={false}
              emptyTitle="No performance records"
              emptyDescription="Team review summaries appear here after reviews are logged."
            />
          )}
        </article>

        <article className="panel recent-activities-card dashboard-float-card">
          <div className="panel-head"><h3>Recent Activities</h3></div>
          {loading ? <LoadingSkeleton rows={4} /> : (
            <DataTable
              columns={[
                { key: 'module', label: 'Module' },
                { key: 'action', label: 'Action' },
                { key: 'message', label: 'Message', sortable: false },
                { key: 'createdAt', label: 'Created At' }
              ]}
              rows={activityRows}
              showActions={false}
              emptyTitle="No recent activities"
              emptyDescription="Recent manager/team actions will appear here."
            />
          )}
        </article>
      </motion.div>
    </section>
  )
}

export default ManagerDashboardPage

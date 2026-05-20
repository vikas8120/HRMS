import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarCheck2,
  CalendarClock,
  ClipboardList,
  Download,
  FileText,
  Star,
  UserRound
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import DataTable from '../../components/ui/DataTable'
import StatCard from '../../components/ui/StatCard'
import { getManagerTeamMemberDetails } from '../../api/managerTeamApi'

const tabs = ['Overview', 'Attendance', 'Leaves', 'Tasks', 'Performance', 'Documents']

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toISOString().slice(0, 10)
}

function ManagerTeamMemberProfilePage() {
  const navigate = useNavigate()
  const { employeeId } = useParams()
  const [activeTab, setActiveTab] = useState('Overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState(null)

  const loadDetails = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getManagerTeamMemberDetails(employeeId)
      setPayload(response?.data || null)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load employee details')
      setPayload(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetails()
  }, [employeeId])

  const employee = payload?.employee || null
  const canViewDocuments = Boolean(payload?.permissions?.canViewDocuments)

  const overviewCards = useMemo(() => {
    const attendance = payload?.attendanceSummary || {}
    const leaves = payload?.leaveSummary || {}
    const tasks = payload?.taskSummary || {}
    const perf = payload?.performanceSummary || {}
    return [
      { title: 'Attendance Records', value: String(attendance.totalRecords ?? 0), trend: `Present ${attendance.presentCount ?? 0}`, icon: CalendarCheck2, trendTone: 'success' },
      { title: 'Pending Leaves', value: String(leaves.pending ?? 0), trend: `Approved ${leaves.approved ?? 0}`, icon: CalendarClock, trendTone: 'warning' },
      { title: 'Active Tasks', value: String(tasks.active ?? 0), trend: `Completed ${tasks.completed ?? 0}`, icon: ClipboardList, trendTone: 'info' },
      { title: 'Average Score', value: String(perf.averageScore ?? 0), trend: `${perf.totalReviews ?? 0} reviews`, icon: Star, trendTone: 'info' }
    ]
  }, [payload])

  const attendanceRows = (payload?.attendanceHistory || []).map((item) => ({
    id: item.id,
    date: formatDate(item.date),
    status: item.status || 'absent',
    checkIn: item.checkIn || '-',
    checkOut: item.checkOut || '-'
  }))

  const leaveRows = (payload?.leaveHistory || []).map((item) => ({
    id: item.id,
    leaveType: item.leaveType || '-',
    status: item.status || 'pending',
    period: `${formatDate(item.startDate)} to ${formatDate(item.endDate)}`,
    reason: item.reason || '-'
  }))

  const taskRows = (payload?.tasks || []).map((item) => ({
    id: item.id,
    title: item.title || '-',
    status: item.status || 'active',
    priority: item.priority || 'medium',
    dueDate: formatDate(item.dueDate)
  }))

  const performanceRows = (payload?.performance || []).map((item) => ({
    id: item.id,
    cycle: item.cycle || '-',
    finalScore: String(item.finalScore ?? 0),
    status: item.status || 'draft',
    reviewDate: formatDate(item.reviewDate)
  }))

  const documentRows = (payload?.documents || []).map((item) => ({
    id: item.id,
    title: item.title || '-',
    category: item.category || 'other',
    status: item.status || 'active',
    verified: item.verified ? 'Yes' : 'No',
    expiryDate: formatDate(item.expiryDate)
  }))

  const downloadProfile = () => {
    if (!payload) return
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `employee-profile-${employee?.employeeId || employeeId}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const renderTabContent = () => {
    if (!payload || !employee) return null

    if (activeTab === 'Overview') {
      return (
        <>
          <div className="stats-grid premium-stats-grid">
            {overviewCards.map((item) => <StatCard key={item.title} {...item} />)}
          </div>

          <div className="dashboard-main-grid">
            <article className="panel">
              <div className="panel-head"><h3>Personal Details</h3></div>
              <div className="modal-form">
                <div className="inline-action-card"><strong>Name:</strong> <span>{payload.personalDetails?.name || '-'}</span></div>
                <div className="inline-action-card"><strong>Email:</strong> <span>{payload.personalDetails?.email || '-'}</span></div>
                <div className="inline-action-card"><strong>Phone:</strong> <span>{payload.personalDetails?.phone || '-'}</span></div>
                <div className="inline-action-card"><strong>Status:</strong> <span>{payload.personalDetails?.status || '-'}</span></div>
              </div>
            </article>

            <article className="panel">
              <div className="panel-head"><h3>Job Details</h3></div>
              <div className="modal-form">
                <div className="inline-action-card"><strong>Employee ID:</strong> <span>{payload.jobDetails?.employeeId || '-'}</span></div>
                <div className="inline-action-card"><strong>Department:</strong> <span>{payload.jobDetails?.department || '-'}</span></div>
                <div className="inline-action-card"><strong>Designation:</strong> <span>{payload.jobDetails?.designation || '-'}</span></div>
                <div className="inline-action-card"><strong>Joining Date:</strong> <span>{formatDate(payload.jobDetails?.joiningDate)}</span></div>
              </div>
            </article>
          </div>
        </>
      )
    }

    if (activeTab === 'Attendance') {
      return (
        <article className="panel">
          <div className="panel-head"><h3>Attendance Summary & History</h3></div>
          <DataTable
            columns={[
              { key: 'date', label: 'Date' },
              { key: 'status', label: 'Status' },
              { key: 'checkIn', label: 'Check-In' },
              { key: 'checkOut', label: 'Check-Out' }
            ]}
            rows={attendanceRows}
            showActions={false}
            emptyTitle="No attendance history"
            emptyDescription="Attendance records will appear here."
          />
        </article>
      )
    }

    if (activeTab === 'Leaves') {
      return (
        <article className="panel">
          <div className="panel-head"><h3>Leave Summary & History</h3></div>
          <DataTable
            columns={[
              { key: 'leaveType', label: 'Type' },
              { key: 'status', label: 'Status' },
              { key: 'period', label: 'Period', sortable: false },
              { key: 'reason', label: 'Reason', sortable: false }
            ]}
            rows={leaveRows}
            showActions={false}
            emptyTitle="No leave history"
            emptyDescription="Leave records will appear here."
          />
        </article>
      )
    }

    if (activeTab === 'Tasks') {
      return (
        <article className="panel">
          <div className="panel-head"><h3>Task Summary</h3></div>
          <DataTable
            columns={[
              { key: 'title', label: 'Task' },
              { key: 'status', label: 'Status' },
              { key: 'priority', label: 'Priority' },
              { key: 'dueDate', label: 'Due Date' }
            ]}
            rows={taskRows}
            showActions={false}
            emptyTitle="No tasks"
            emptyDescription="Tasks assigned to this employee will appear here."
          />
        </article>
      )
    }

    if (activeTab === 'Performance') {
      return (
        <article className="panel">
          <div className="panel-head"><h3>Performance History</h3></div>
          <DataTable
            columns={[
              { key: 'cycle', label: 'Cycle' },
              { key: 'finalScore', label: 'Final Score' },
              { key: 'status', label: 'Status' },
              { key: 'reviewDate', label: 'Review Date' }
            ]}
            rows={performanceRows}
            showActions={false}
            emptyTitle="No performance records"
            emptyDescription="Performance reviews will appear here."
          />
        </article>
      )
    }

    if (!canViewDocuments) {
      return <EmptyState title="Documents Access Restricted" description="You do not have permission to view employee documents." />
    }

    return (
      <article className="panel">
        <div className="panel-head"><h3>Documents Preview</h3></div>
        <DataTable
          columns={[
            { key: 'title', label: 'Title' },
            { key: 'category', label: 'Category' },
            { key: 'status', label: 'Status' },
            { key: 'verified', label: 'Verified' },
            { key: 'expiryDate', label: 'Expiry Date' }
          ]}
          rows={documentRows}
          showActions={false}
          emptyTitle="No documents"
          emptyDescription="Employee documents will appear here when available."
        />
      </article>
    )
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Employee Details"
        description="Comprehensive employee view for manager-level supervision."
        breadcrumb={['Manager Portal', 'My Team', 'Employee Details']}
      />

      <div className="panel">
        <div className="actions-row">
          <Button variant="ghost" onClick={() => navigate('/manager/team')}><ArrowLeft size={14} /> Back</Button>
          <Button variant="ghost" onClick={() => navigate(`/manager/tasks?create=true&employeeId=${employeeId}`)}>Assign Task</Button>
          <Button variant="ghost" onClick={() => navigate(`/manager/performance?employeeId=${employeeId}`)}>Add Performance Review</Button>
          <Button variant="ghost" onClick={() => navigate(`/manager/attendance?employeeId=${employeeId}`)}>View Full Attendance</Button>
          <Button variant="ghost" onClick={() => navigate(`/manager/leaves?employeeId=${employeeId}`)}>View Leave History</Button>
          <Button variant="ghost" onClick={() => navigate(`/manager/tasks?employeeId=${employeeId}`)}>View Tasks</Button>
          <Button variant="ghost" onClick={downloadProfile}><Download size={14} /> Download Profile</Button>
        </div>
      </div>

      {loading ? <LoadingSkeleton rows={9} /> : error ? <EmptyState title="Unable to load employee details" description={error} /> : !employee ? (
        <EmptyState title="Employee not found" description="This employee is not accessible in your manager scope." />
      ) : (
        <>
          <div className="panel">
            <div className="panel-head">
              <h3><UserRound size={16} /> {employee.name}</h3>
              <div className="badge badge-info">{employee.todayAttendanceStatus}</div>
            </div>
            <div className="workspace-nav">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`chip-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'Attendance' ? <CalendarCheck2 size={14} /> : null}
                  {tab === 'Leaves' ? <CalendarClock size={14} /> : null}
                  {tab === 'Tasks' ? <ClipboardList size={14} /> : null}
                  {tab === 'Performance' ? <Star size={14} /> : null}
                  {tab === 'Documents' ? <FileText size={14} /> : null}
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {renderTabContent()}
        </>
      )}
    </section>
  )
}

export default ManagerTeamMemberProfilePage

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import FilterDropdown from '../../components/ui/FilterDropdown'
import SearchBar from '../../components/ui/SearchBar'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import StatCard from '../../components/ui/StatCard'
import DataTable from '../../components/ui/DataTable'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import { getManagerTeam } from '../../api/managerTeamApi'
import {
  createManagerPerformanceReview,
  deleteManagerPerformanceReview,
  getManagerPerformanceByEmployee,
  getManagerPerformanceDashboard,
  getManagerPerformanceReviews,
  updateManagerPerformanceReview
} from '../../api/managerPerformanceApi'

const tabs = ['Performance Dashboard', 'Review History']
const periods = ['monthly', 'quarterly', 'yearly']

const initialForm = {
  employeeId: '',
  reviewPeriod: 'monthly',
  rating: 0,
  taskScore: 0,
  attendanceScore: 0,
  behaviourScore: 0,
  productivityScore: 0,
  strengths: '',
  improvements: '',
  managerFeedback: '',
  finalRemarks: ''
}

const formatDate = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toISOString().slice(0, 10)
}

function ManagerPerformanceReviewPage() {
  const [searchParams] = useSearchParams()
  const employeeIdFromQuery = searchParams.get('employeeId') || 'all'
  const createFromQuery = searchParams.get('create') === 'true'
  const [activeTab, setActiveTab] = useState('Performance Dashboard')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const [team, setTeam] = useState([])
  const [reviews, setReviews] = useState([])
  const [dashboard, setDashboard] = useState({ averageRating: 0, totalReviews: 0, topPerformers: [], lowPerformers: [], teamComparison: [], performanceTrend: [] })
  const [employeeProfileRows, setEmployeeProfileRows] = useState([])

  const [search, setSearch] = useState('')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [employeeFilter, setEmployeeFilter] = useState(employeeIdFromQuery)

  const [form, setForm] = useState(initialForm)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const loadTeam = async () => {
    try {
      const res = await getManagerTeam()
      setTeam(res?.data || [])
    } catch (_err) {
      setTeam([])
    }
  }

  const loadDashboard = async () => {
    const data = await getManagerPerformanceDashboard()
    setDashboard(data?.data || { averageRating: 0, totalReviews: 0, topPerformers: [], lowPerformers: [], teamComparison: [], performanceTrend: [] })
  }

  const loadReviews = async () => {
    const data = await getManagerPerformanceReviews({ search, reviewPeriod: periodFilter, employeeId: employeeFilter })
    setReviews(data?.data || [])
  }

  const loadEmployeeProfile = async () => {
    if (!employeeFilter || employeeFilter === 'all') {
      setEmployeeProfileRows([])
      return
    }
    const data = await getManagerPerformanceByEmployee(employeeFilter)
    setEmployeeProfileRows(data?.data || [])
  }

  const loadTabData = async () => {
    setLoading(true)
    setError('')
    try {
      if (activeTab === 'Performance Dashboard') await loadDashboard()
      if (activeTab === 'Review History') await loadReviews()
      if (activeTab === 'Performance Dashboard') await loadEmployeeProfile()
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load performance data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeam()
  }, [])

  useEffect(() => {
    if (employeeIdFromQuery && employeeIdFromQuery !== 'all') {
      setEmployeeFilter(employeeIdFromQuery)
      setForm((prev) => ({ ...prev, employeeId: employeeIdFromQuery }))
      setActiveTab(createFromQuery ? 'Add Review' : 'Performance Dashboard')
    }
  }, [employeeIdFromQuery, createFromQuery])

  useEffect(() => {
    loadTabData()
  }, [activeTab, search, periodFilter, employeeFilter])

  const employeeOptions = [{ value: 'all', label: 'All Employees' }, ...team.map((x) => ({ value: String(x.employeeId), label: x.name }))]

  const onSubmitReview = async (isDraft = false) => {
    if (!form.employeeId) return setToast({ type: 'error', message: 'Employee is required' })

    setSubmitting(true)
    try {
      await createManagerPerformanceReview({
        ...form,
        status: isDraft ? 'draft' : 'submitted',
        isDraft
      })
      setToast({ type: 'success', message: isDraft ? 'Review saved as draft' : 'Review submitted successfully' })
      setForm(initialForm)
      await loadDashboard()
      await loadReviews()
      setActiveTab('Review History')
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to save review' })
    } finally {
      setSubmitting(false)
    }
  }

  const onOpenEdit = (row) => {
    setSelected(row)
    setForm({
      employeeId: String(row.employeeId || ''),
      reviewPeriod: row.reviewPeriod || 'monthly',
      rating: row.rating ?? 0,
      taskScore: row.taskScore ?? 0,
      attendanceScore: row.attendanceScore ?? 0,
      behaviourScore: row.behaviourScore ?? 0,
      productivityScore: row.productivityScore ?? 0,
      strengths: row.strengths || '',
      improvements: row.improvements || '',
      managerFeedback: row.managerFeedback || '',
      finalRemarks: row.finalRemarks || ''
    })
    setEditOpen(true)
  }

  const onUpdateReview = async () => {
    if (!selected?.id) return
    setSubmitting(true)
    try {
      await updateManagerPerformanceReview(selected.id, form)
      setEditOpen(false)
      setToast({ type: 'success', message: 'Review updated successfully' })
      await loadReviews()
      await loadDashboard()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to update review' })
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteReview = async () => {
    if (!selected?.id) return
    setSubmitting(true)
    try {
      await deleteManagerPerformanceReview(selected.id)
      setDeleteOpen(false)
      setToast({ type: 'success', message: 'Review deleted successfully' })
      await loadReviews()
      await loadDashboard()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to delete review' })
    } finally {
      setSubmitting(false)
    }
  }

  const exportReviews = () => {
    const headers = ['Employee', 'Period', 'Rating', 'Task', 'Attendance', 'Behaviour', 'Productivity', 'Status', 'Review Date']
    const lines = reviews.map((row) => [
      row.employeeName,
      row.reviewPeriod,
      row.rating,
      row.taskScore,
      row.attendanceScore,
      row.behaviourScore,
      row.productivityScore,
      row.status,
      formatDate(row.reviewDate)
    ])

    const csv = [headers, ...lines].map((line) => line.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-reviews-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Performance Review"
        description="Manage employee performance reviews and analyze team performance outcomes."
        breadcrumb={['Manager Portal', 'Performance Review']}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel">
        <div className="workspace-nav">
          {tabs.map((tab) => <button key={tab} type="button" className={`chip-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}
        </div>

        <div className="filters-row admin-filters-grid" style={{ marginTop: 10 }}>
          <div className="search-wrap"><label>Search</label><SearchBar value={search} onChange={setSearch} placeholder="Search employee or feedback" /></div>
          <FilterDropdown label="Period" value={periodFilter} onChange={setPeriodFilter} options={[{ value: 'all', label: 'All Periods' }, ...periods.map((x) => ({ value: x, label: x }))]} />
          <FilterDropdown label="Employee" value={employeeFilter} onChange={setEmployeeFilter} options={employeeOptions} />
        </div>

        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button onClick={() => setActiveTab('Add Review')}>Add Review</Button>
          <Button variant="ghost" onClick={loadTabData}>Generate Report</Button>
          <Button variant="ghost" onClick={loadTabData}><RefreshCw size={14} /> Refresh</Button>
          <Button variant="ghost" onClick={exportReviews}><Download size={14} /> Download</Button>
        </div>
      </div>

      {loading ? <LoadingSkeleton rows={8} /> : error ? <EmptyState title="Unable to load performance data" description={error} /> : (
        <>
          {activeTab === 'Performance Dashboard' ? (
            <>
              <div className="stats-grid premium-stats-grid">
                <StatCard title="Average Rating" value={String(dashboard.averageRating || 0)} trend="Team average" />
                <StatCard title="Total Reviews" value={String(dashboard.totalReviews || 0)} trend="Reviews submitted" trendTone="info" />
                <StatCard title="Top Performers" value={String((dashboard.topPerformers || []).length)} trend="High rating employees" trendTone="success" />
                <StatCard title="Low Performers" value={String((dashboard.lowPerformers || []).length)} trend="Needs improvement" trendTone="warning" />
              </div>

              <div className="dashboard-main-grid">
                <article className="panel">
                  <div className="panel-head"><h3>Top Performers</h3></div>
                  <DataTable
                    columns={[{ key: 'employeeName', label: 'Employee' }, { key: 'averageRating', label: 'Average Rating' }, { key: 'reviews', label: 'Reviews' }]}
                    rows={dashboard.topPerformers || []}
                    showActions={false}
                    emptyTitle="No top performers"
                    emptyDescription="Performance data will populate after reviews."
                  />
                </article>
                <article className="panel">
                  <div className="panel-head"><h3>Low Performers</h3></div>
                  <DataTable
                    columns={[{ key: 'employeeName', label: 'Employee' }, { key: 'averageRating', label: 'Average Rating' }, { key: 'reviews', label: 'Reviews' }]}
                    rows={dashboard.lowPerformers || []}
                    showActions={false}
                    emptyTitle="No low performers"
                    emptyDescription="No low-performing records currently."
                  />
                </article>
              </div>

              <article className="panel">
                <div className="panel-head"><h3>Performance Trend</h3></div>
                <DataTable
                  columns={[{ key: 'employeeName', label: 'Employee' }, { key: 'period', label: 'Period' }, { key: 'rating', label: 'Rating' }, { key: 'date', label: 'Date' }]}
                  rows={(dashboard.performanceTrend || []).map((x, idx) => ({ id: `${x.employeeId}-${idx}`, employeeName: x.employeeName, period: x.period, rating: x.rating, date: formatDate(x.date) }))}
                  showActions={false}
                  emptyTitle="No trend data"
                  emptyDescription="Performance trends will appear after review cycles."
                />
              </article>
            </>
          ) : null}

          {activeTab === 'Add Review' ? (
            <article className="panel">
              <div className="panel-head"><h3>Add Review</h3></div>
              <ReviewForm form={form} setForm={setForm} team={team} />
              <div className="actions-row" style={{ marginTop: 10 }}>
                <Button variant="ghost" onClick={() => onSubmitReview(true)} disabled={submitting}>{submitting ? 'Saving...' : 'Save Draft'}</Button>
                <Button onClick={() => onSubmitReview(false)} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Review'}</Button>
              </div>
            </article>
          ) : null}

          {activeTab === 'Review History' ? (
            <article className="panel">
              <div className="panel-head"><h3>Review History</h3></div>
              <DataTable
                columns={[
                  { key: 'employeeName', label: 'Employee' },
                  { key: 'reviewPeriod', label: 'Period' },
                  { key: 'rating', label: 'Rating' },
                  { key: 'taskScore', label: 'Task' },
                  { key: 'attendanceScore', label: 'Attendance' },
                  { key: 'behaviourScore', label: 'Behaviour' },
                  { key: 'productivityScore', label: 'Productivity' },
                  { key: 'status', label: 'Status' },
                  { key: 'reviewDate', label: 'Review Date' }
                ]}
                rows={(reviews || []).map((x) => ({ ...x, reviewDate: formatDate(x.reviewDate) }))}
                onView={(row) => { setSelected(row); setEditOpen(true) }}
                onEdit={(row) => onOpenEdit(row)}
                onDelete={(row) => { setSelected(row); setDeleteOpen(true) }}
                showViewAction
                showEditAction
                showDeleteAction
                emptyTitle="No reviews"
                emptyDescription="Create reviews to build review history."
              />
            </article>
          ) : null}

          {activeTab === 'Employee Performance Profile' ? (
            <article className="panel">
              <div className="panel-head"><h3>Employee Performance Profile</h3></div>
              {employeeFilter === 'all' ? (
                <EmptyState title="Select an employee" description="Choose an employee filter to view profile performance history." />
              ) : (
                <DataTable
                  columns={[
                    { key: 'reviewPeriod', label: 'Period' },
                    { key: 'rating', label: 'Rating' },
                    { key: 'taskScore', label: 'Task' },
                    { key: 'attendanceScore', label: 'Attendance' },
                    { key: 'behaviourScore', label: 'Behaviour' },
                    { key: 'productivityScore', label: 'Productivity' },
                    { key: 'reviewDate', label: 'Review Date' }
                  ]}
                  rows={(employeeProfileRows || []).map((x) => ({ ...x, reviewDate: formatDate(x.reviewDate) }))}
                  showActions={false}
                  emptyTitle="No profile reviews"
                  emptyDescription="No reviews found for the selected employee."
                />
              )}
            </article>
          ) : null}

          {activeTab === 'Team Comparison' ? (
            <article className="panel">
              <div className="panel-head"><h3>Team Comparison</h3></div>
              <DataTable
                columns={[{ key: 'employeeName', label: 'Employee' }, { key: 'averageRating', label: 'Average Rating' }, { key: 'reviews', label: 'Reviews' }]}
                rows={dashboard.teamComparison || []}
                showActions={false}
                emptyTitle="No comparison data"
                emptyDescription="Team comparison appears after reviews are created."
              />
            </article>
          ) : null}
        </>
      )}

      <Modal open={editOpen} title="Edit Review" onClose={() => setEditOpen(false)}>
        <ReviewForm form={form} setForm={setForm} team={team} />
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button onClick={onUpdateReview} disabled={submitting}>{submitting ? 'Updating...' : 'Update Review'}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Review"
        message={`Delete review for ${selected?.employeeName || 'employee'}?`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={onDeleteReview}
      />
    </section>
  )
}

function ReviewForm({ form, setForm, team }) {
  return (
    <div className="modal-form">
      <FilterDropdown label="Employee" value={form.employeeId} onChange={(value) => setForm((p) => ({ ...p, employeeId: value }))} options={[{ value: '', label: 'Select employee' }, ...team.map((x) => ({ value: String(x.employeeId), label: x.name }))]} />
      <FilterDropdown label="Review period" value={form.reviewPeriod} onChange={(value) => setForm((p) => ({ ...p, reviewPeriod: value }))} options={periods.map((x) => ({ value: x, label: x }))} />
      <Field label="Rating" value={form.rating} onChange={(value) => setForm((p) => ({ ...p, rating: value }))} />
      <Field label="Task score" value={form.taskScore} onChange={(value) => setForm((p) => ({ ...p, taskScore: value }))} />
      <Field label="Attendance score" value={form.attendanceScore} onChange={(value) => setForm((p) => ({ ...p, attendanceScore: value }))} />
      <Field label="Behaviour score" value={form.behaviourScore} onChange={(value) => setForm((p) => ({ ...p, behaviourScore: value }))} />
      <Field label="Productivity score" value={form.productivityScore} onChange={(value) => setForm((p) => ({ ...p, productivityScore: value }))} />
      <Text label="Strengths" value={form.strengths} onChange={(value) => setForm((p) => ({ ...p, strengths: value }))} />
      <Text label="Improvements" value={form.improvements} onChange={(value) => setForm((p) => ({ ...p, improvements: value }))} />
      <Text label="Manager feedback" value={form.managerFeedback} onChange={(value) => setForm((p) => ({ ...p, managerFeedback: value }))} />
      <Text label="Final remarks" value={form.finalRemarks} onChange={(value) => setForm((p) => ({ ...p, finalRemarks: value }))} />
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <label className="form-input-wrap">
      <span>{label}</span>
      <input className="form-input" type="number" min="0" max="5" step="0.1" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

function Text({ label, value, onChange }) {
  return (
    <label className="form-input-wrap">
      <span>{label}</span>
      <textarea className="form-input" rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export default ManagerPerformanceReviewPage

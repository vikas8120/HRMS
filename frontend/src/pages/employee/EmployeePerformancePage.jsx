import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import {
  downloadEmployeePerformanceReport,
  getEmployeeAppraisalHistory,
  getEmployeePerformanceFeedback,
  getEmployeePerformanceGoalById,
  getEmployeePerformanceGoals,
  getEmployeePerformanceOverview,
  submitEmployeeSelfReview,
  updateEmployeeGoalProgress
} from '../../api/employeePerformanceApi'

const formatDate = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toISOString().slice(0, 10)
}

function EmployeePerformancePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [overview, setOverview] = useState(null)
  const [goals, setGoals] = useState([])
  const [feedback, setFeedback] = useState([])
  const [appraisals, setAppraisals] = useState([])

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState(null)

  const [progressOpen, setProgressOpen] = useState(false)
  const [progressGoal, setProgressGoal] = useState(null)
  const [progress, setProgress] = useState('')

  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewForm, setReviewForm] = useState({ cycle: 'monthly', goal: '', selfScore: '0', strengths: '', improvements: '', selfReview: '' })

  const [submitting, setSubmitting] = useState(false)

  const showMessage = (setter, message) => {
    setter(message)
    setTimeout(() => setter(''), 2500)
  }

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [overviewRes, goalsRes, feedbackRes, appraisalsRes] = await Promise.all([
        getEmployeePerformanceOverview(),
        getEmployeePerformanceGoals(),
        getEmployeePerformanceFeedback(),
        getEmployeeAppraisalHistory()
      ])

      setOverview(overviewRes?.data || null)
      setGoals(goalsRes?.data || [])
      setFeedback(feedbackRes?.data || [])
      setAppraisals(appraisalsRes?.data || [])
    } catch (err) {
      setOverview(null)
      setGoals([])
      setFeedback([])
      setAppraisals([])
      setError(err?.response?.data?.message || err?.message || 'Failed to load performance data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const goalsRows = useMemo(() => goals.map((goal) => ({
    ...goal,
    cycle: String(goal.cycle || '').toUpperCase(),
    reviewDate: formatDate(goal.reviewDate),
    progressLabel: `${Number(goal.progress || 0)}%`
  })), [goals])

  const openGoalDetails = async (row) => {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setSelectedGoal(null)
    try {
      const response = await getEmployeePerformanceGoalById(row.id)
      setSelectedGoal(response?.data || null)
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to load goal details')
    } finally {
      setDetailsLoading(false)
    }
  }

  const openProgressModal = (row) => {
    setProgressGoal(row)
    setProgress(String(Number(row.progress || 0)))
    setProgressOpen(true)
  }

  const saveProgress = async () => {
    if (!progressGoal?.id) return
    const numeric = Number(progress)
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) {
      showMessage(setError, 'Progress must be between 0 and 100')
      return
    }

    setSubmitting(true)
    try {
      const response = await updateEmployeeGoalProgress(progressGoal.id, { progress: numeric })
      showMessage(setSuccess, response?.message || '')
      setProgressOpen(false)
      await loadData()
      if (selectedGoal?.id === progressGoal.id) {
        const detail = await getEmployeePerformanceGoalById(progressGoal.id)
        setSelectedGoal(detail?.data || null)
      }
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to update progress')
    } finally {
      setSubmitting(false)
    }
  }

  const submitSelfReview = async () => {
    if (!reviewForm.goal.trim()) return showMessage(setError, 'Goal is required')
    if (!reviewForm.selfReview.trim()) return showMessage(setError, 'Self review is required')

    setSubmitting(true)
    try {
      const payload = {
        cycle: reviewForm.cycle,
        goal: reviewForm.goal.trim(),
        selfScore: Number(reviewForm.selfScore || 0),
        strengths: reviewForm.strengths,
        improvements: reviewForm.improvements,
        selfReview: reviewForm.selfReview.trim()
      }
      const response = await submitEmployeeSelfReview(payload)
      showMessage(setSuccess, response?.message || '')
      setReviewOpen(false)
      setReviewForm({ cycle: 'monthly', goal: '', selfScore: '0', strengths: '', improvements: '', selfReview: '' })
      await loadData()
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to submit self review')
    } finally {
      setSubmitting(false)
    }
  }

  const onDownloadReport = async () => {
    setSubmitting(true)
    try {
      await downloadEmployeePerformanceReport()
      showMessage(setSuccess, 'Performance report downloaded successfully')
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to download performance report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Employee Performance"
        description="View your goals, feedback, appraisals, and submit self-reviews."
        breadcrumb={['Employee Portal', 'Performance']}
      />

      {success ? <div className="panel" style={{ borderColor: 'rgba(34,197,94,0.35)' }}>{success}</div> : null}
      {error ? <div className="panel error-banner">{error}</div> : null}

      <div className="panel">
        <div className="actions-row">
          <Button onClick={() => setReviewOpen(true)}>Submit Self Review</Button>
          <Button variant="ghost" onClick={onDownloadReport} disabled={submitting}>Download Performance Report</Button>
          <Button variant="ghost" onClick={loadData}>Refresh</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Overview</h3></div>
        {loading ? <LoadingSkeleton rows={4} /> : !overview ? <EmptyState title="No performance overview" description="Performance data is not available yet." /> : (
          <div className="form-grid">
            <div className="inline-action-card"><strong>Total Goals:</strong> <span>{overview?.summary?.totalGoals || 0}</span></div>
            <div className="inline-action-card"><strong>Completed Goals:</strong> <span>{overview?.summary?.completedGoals || 0}</span></div>
            <div className="inline-action-card"><strong>Pending Goals:</strong> <span>{overview?.summary?.pendingGoals || 0}</span></div>
            <div className="inline-action-card"><strong>Average Score:</strong> <span>{overview?.summary?.averageScore || 0}</span></div>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Assigned Goals / KRAs</h3></div>
        {loading ? <LoadingSkeleton rows={6} /> : goalsRows.length === 0 ? <EmptyState title="No goals assigned" description="Your assigned goals will appear here." /> : (
          <DataTable
            columns={[
              { key: 'goal', label: 'Goal/KRA' },
              { key: 'cycle', label: 'Cycle' },
              { key: 'status', label: 'Status' },
              { key: 'progressLabel', label: 'Progress' },
              { key: 'finalScore', label: 'Final Score' },
              { key: 'reviewDate', label: 'Review Date' }
            ]}
            rows={goalsRows}
            showViewAction
            showEditAction
            showDeleteAction={false}
            editLabel="Update Progress"
            onView={openGoalDetails}
            onEdit={openProgressModal}
          />
        )}
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Manager Feedback</h3></div>
        {loading ? <LoadingSkeleton rows={4} /> : feedback.length === 0 ? <EmptyState title="No feedback yet" description="Manager feedback will appear here after reviews." /> : (
          <DataTable
            columns={[
              { key: 'cycle', label: 'Cycle' },
              { key: 'managerFeedback', label: 'Feedback' },
              { key: 'status', label: 'Status' },
              { key: 'reviewDate', label: 'Review Date' }
            ]}
            rows={feedback.map((item) => ({ ...item, cycle: String(item.cycle || '').toUpperCase(), reviewDate: formatDate(item.reviewDate) }))}
            showViewAction={false}
            showEditAction={false}
            showDeleteAction={false}
          />
        )}
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Appraisal History</h3></div>
        {loading ? <LoadingSkeleton rows={4} /> : appraisals.length === 0 ? <EmptyState title="No appraisals" description="No appraisal history found." /> : (
          <DataTable
            columns={[
              { key: 'cycle', label: 'Cycle' },
              { key: 'selfScore', label: 'Self Score' },
              { key: 'managerScore', label: 'Manager Score' },
              { key: 'finalScore', label: 'Final Score' },
              { key: 'status', label: 'Status' },
              { key: 'reviewDate', label: 'Review Date' }
            ]}
            rows={appraisals.map((item) => ({ ...item, cycle: String(item.cycle || '').toUpperCase(), reviewDate: formatDate(item.reviewDate) }))}
            showViewAction={false}
            showEditAction={false}
            showDeleteAction={false}
          />
        )}
      </div>

      <Modal open={detailsOpen} title="Goal Details" onClose={() => setDetailsOpen(false)}>
        {detailsLoading ? <LoadingSkeleton rows={5} /> : !selectedGoal ? <EmptyState title="No details" description="Unable to load selected goal." /> : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Goal/KRA:</strong> <span>{selectedGoal.goal || '-'}</span></div>
            <div className="inline-action-card"><strong>Cycle:</strong> <span>{String(selectedGoal.cycle || '').toUpperCase()}</span></div>
            <div className="inline-action-card"><strong>Status:</strong> <span>{selectedGoal.status || '-'}</span></div>
            <div className="inline-action-card"><strong>Progress:</strong> <span>{selectedGoal.progress || 0}%</span></div>
            <div className="inline-action-card"><strong>Feedback:</strong> <span>{selectedGoal.feedback || '-'}</span></div>
            <div className="inline-action-card"><strong>Strengths:</strong> <span>{selectedGoal.strengths || '-'}</span></div>
            <div className="inline-action-card"><strong>Improvements:</strong> <span>{selectedGoal.improvements || '-'}</span></div>
          </div>
        )}
      </Modal>

      <Modal open={progressOpen} title="Update Goal Progress" onClose={() => setProgressOpen(false)}>
        <div className="modal-form">
          <label className="form-input-wrap">
            <span>Progress (%)</span>
            <input className="form-input" type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(e.target.value)} />
          </label>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setProgressOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={saveProgress} disabled={submitting}>{submitting ? 'Saving...' : 'Save Progress'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={reviewOpen} title="Submit Self Review" onClose={() => setReviewOpen(false)}>
        <div className="modal-form">
          <label className="form-input-wrap">
            <span>Cycle</span>
            <select className="form-input" value={reviewForm.cycle} onChange={(e) => setReviewForm((prev) => ({ ...prev, cycle: e.target.value }))}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>
          <label className="form-input-wrap">
            <span>Goal/KRA</span>
            <input className="form-input" value={reviewForm.goal} onChange={(e) => setReviewForm((prev) => ({ ...prev, goal: e.target.value }))} />
          </label>
          <label className="form-input-wrap">
            <span>Self Score (0-5)</span>
            <input className="form-input" type="number" min={0} max={5} step="0.1" value={reviewForm.selfScore} onChange={(e) => setReviewForm((prev) => ({ ...prev, selfScore: e.target.value }))} />
          </label>
          <label className="form-input-wrap">
            <span>Strengths</span>
            <textarea className="form-input" rows={3} value={reviewForm.strengths} onChange={(e) => setReviewForm((prev) => ({ ...prev, strengths: e.target.value }))} />
          </label>
          <label className="form-input-wrap">
            <span>Areas for Improvement</span>
            <textarea className="form-input" rows={3} value={reviewForm.improvements} onChange={(e) => setReviewForm((prev) => ({ ...prev, improvements: e.target.value }))} />
          </label>
          <label className="form-input-wrap">
            <span>Self Review</span>
            <textarea className="form-input" rows={4} value={reviewForm.selfReview} onChange={(e) => setReviewForm((prev) => ({ ...prev, selfReview: e.target.value }))} />
          </label>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setReviewOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={submitSelfReview} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Review'}</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default EmployeePerformancePage

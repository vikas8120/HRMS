import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import {
  addEmployeeTaskComment,
  getEmployeeTaskById,
  getEmployeeTasks,
  updateEmployeeTaskStatus
} from '../../api/employeeTaskApi'

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' }
]

const priorityOptions = [
  { value: 'all', label: 'All Priority' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
]

const formatDate = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toISOString().slice(0, 10)
}

function EmployeeTasksPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const [dueDate, setDueDate] = useState('')

  const [tasks, setTasks] = useState([])

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [selected, setSelected] = useState(null)

  const [commentOpen, setCommentOpen] = useState(false)
  const [commentTask, setCommentTask] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [commentFile, setCommentFile] = useState(null)

  const [submitting, setSubmitting] = useState(false)

  const showMessage = (setter, message) => {
    setter(message)
    setTimeout(() => setter(''), 2600)
  }

  const loadTasks = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        status,
        priority
      }
      if (dueDate) params.dueDate = dueDate
      const response = await getEmployeeTasks(params)
      setTasks(response?.data || [])
    } catch (err) {
      setTasks([])
      setError(err?.response?.data?.message || err?.message || 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [status, priority, dueDate])

  const rows = useMemo(() => tasks.map((task) => ({
    ...task,
    dueDate: formatDate(task.dueDate),
    startDate: formatDate(task.startDate),
    overdue: task.overdue ? 'Yes' : 'No'
  })), [tasks])

  const refreshTaskDetails = async (taskId) => {
    const response = await getEmployeeTaskById(taskId)
    return response?.data || null
  }

  const onViewTask = async (row) => {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setSelected(null)
    try {
      const detail = await refreshTaskDetails(row.id)
      setSelected(detail)
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to load task details')
    } finally {
      setDetailsLoading(false)
    }
  }

  const onChangeStatus = async (row, nextStatus) => {
    setSubmitting(true)
    try {
      const response = await updateEmployeeTaskStatus(row.id, nextStatus)
      showMessage(setSuccess, response?.message || '')
      await loadTasks()
      if (selected?.id === row.id) {
        const detail = await refreshTaskDetails(row.id)
        setSelected(detail)
      }
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to update task status')
    } finally {
      setSubmitting(false)
    }
  }

  const onStartTask = async (row) => onChangeStatus(row, 'in-progress')

  const openCommentModal = (row) => {
    setCommentTask(row)
    setCommentText('')
    setCommentFile(null)
    setCommentOpen(true)
  }

  const submitComment = async () => {
    if (!commentTask?.id) return
    if (!commentText.trim()) {
      showMessage(setError, 'comment is required')
      return
    }

    setSubmitting(true)
    try {
      let payload
      if (commentFile) {
        payload = new FormData()
        payload.append('comment', commentText.trim())
        payload.append('file', commentFile)
      } else {
        payload = { comment: commentText.trim() }
      }

      const response = await addEmployeeTaskComment(commentTask.id, payload)
      showMessage(setSuccess, response?.message || '')
      setCommentOpen(false)
      await loadTasks()
      if (selected?.id === commentTask.id) {
        const detail = await refreshTaskDetails(commentTask.id)
        setSelected(detail)
      }
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to add task comment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Employee Tasks"
        description="Track your assigned work, update progress, and post task updates with attachments."
        breadcrumb={['Employee Portal', 'Tasks']}
      />

      {success ? <div className="panel" style={{ borderColor: 'rgba(34,197,94,0.35)' }}>{success}</div> : null}
      {error ? <div className="panel error-banner">{error}</div> : null}

      <div className="panel">
        <div className="filters-row">
          <FilterDropdown label="Status" value={status} onChange={setStatus} options={statusOptions} />
          <FilterDropdown label="Priority" value={priority} onChange={setPriority} options={priorityOptions} />
          <label className="form-input-wrap">
            <span>Due Date</span>
            <input className="form-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
          <div className="actions-row" style={{ alignSelf: 'end' }}>
            <Button variant="ghost" onClick={loadTasks}>Refresh</Button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Assigned Tasks</h3></div>
        {loading ? <LoadingSkeleton rows={6} /> : rows.length === 0 ? <EmptyState title="No tasks assigned" description="No tasks match your current filters." /> : (
          <DataTable
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'priority', label: 'Priority' },
              { key: 'status', label: 'Status' },
              { key: 'startDate', label: 'Start Date' },
              { key: 'dueDate', label: 'Due Date' },
              { key: 'overdue', label: 'Overdue' }
            ]}
            rows={rows}
            showViewAction
            showEditAction
            showDeleteAction={false}
            editLabel="Start"
            onView={onViewTask}
            onEdit={onStartTask}
          />
        )}
      </div>

      <Modal open={detailsOpen} title="Task Details" onClose={() => setDetailsOpen(false)}>
        {detailsLoading ? <LoadingSkeleton rows={5} /> : !selected ? <EmptyState title="No details" description="Task details could not be loaded." /> : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Title:</strong> <span>{selected.title || '-'}</span></div>
            <div className="inline-action-card"><strong>Description:</strong> <span>{selected.description || '-'}</span></div>
            <div className="inline-action-card"><strong>Priority:</strong> <span>{selected.priority || '-'}</span></div>
            <div className="inline-action-card"><strong>Status:</strong> <span>{selected.status || '-'}</span></div>
            <div className="inline-action-card"><strong>Start Date:</strong> <span>{formatDate(selected.startDate)}</span></div>
            <div className="inline-action-card"><strong>Due Date:</strong> <span>{formatDate(selected.dueDate)}</span></div>
            <div className="inline-action-card"><strong>Attachments:</strong> <span>{(selected.attachments || []).length}</span></div>
            <div className="inline-action-card"><strong>Comments:</strong> <span>{(selected.comments || []).length}</span></div>

            <div className="actions-row">
              <Button onClick={() => onChangeStatus(selected, 'pending')} disabled={submitting || selected.status === 'pending'}>Set Pending</Button>
              <Button onClick={() => onChangeStatus(selected, 'in-progress')} disabled={submitting || selected.status === 'in-progress'}>Set In Progress</Button>
              <Button onClick={() => onChangeStatus(selected, 'completed')} disabled={submitting || selected.status === 'completed'}>Set Completed</Button>
              <Button variant="ghost" onClick={() => openCommentModal(selected)} disabled={submitting}>Add Comment/Update</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={commentOpen} title="Add Task Update" onClose={() => setCommentOpen(false)}>
        <div className="modal-form">
          <label className="form-input-wrap">
            <span>Comment/Update</span>
            <textarea className="form-input" rows={4} value={commentText} onChange={(e) => setCommentText(e.target.value)} />
          </label>
          <label className="form-input-wrap">
            <span>Attachment (Optional)</span>
            <input className="form-input" type="file" onChange={(e) => setCommentFile(e.target.files?.[0] || null)} />
          </label>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setCommentOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={submitComment} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Update'}</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default EmployeeTasksPage

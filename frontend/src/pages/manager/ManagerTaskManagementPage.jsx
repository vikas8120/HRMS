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
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import {
  addManagerTaskComment,
  createManagerTask,
  deleteManagerTask,
  getManagerTasks,
  reassignManagerTask,
  updateManagerTask,
  updateManagerTaskStatus
} from '../../api/managerTaskApi'
import { getManagerTeam } from '../../api/managerTeamApi'

const tabs = ['Task Dashboard', 'All Tasks', 'Pending Tasks', 'In Progress Tasks', 'Completed Tasks', 'Overdue Tasks']

const tabStatusMap = {
  'All Tasks': 'all',
  'Pending Tasks': 'pending',
  'In Progress Tasks': 'in-progress',
  'Completed Tasks': 'completed',
  'Overdue Tasks': 'overdue'
}

const priorityOptions = ['low', 'medium', 'high', 'urgent']
const statusOptions = ['pending', 'in-progress', 'completed', 'overdue', 'cancelled']

const initialForm = {
  title: '',
  description: '',
  assignedEmployeeId: '',
  priority: 'medium',
  status: 'pending',
  startDate: '',
  deadline: '',
  attachments: [{ name: '', url: '' }]
}

const formatDate = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toISOString().slice(0, 10)
}

function ManagerTaskManagementPage() {
  const [searchParams] = useSearchParams()
  const employeeIdFromQuery = searchParams.get('employeeId') || 'all'
  const createFromQuery = searchParams.get('create') === 'true'
  const [activeTab, setActiveTab] = useState('Task Dashboard')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0, cancelled: 0, drafts: 0 })
  const [team, setTeam] = useState([])

  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('all')
  const [status, setStatus] = useState('all')
  const [employeeId, setEmployeeId] = useState(employeeIdFromQuery)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [commentOpen, setCommentOpen] = useState(false)
  const [reassignOpen, setReassignOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [commentText, setCommentText] = useState('')
  const [reassignEmployeeId, setReassignEmployeeId] = useState('')

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2400)
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

  const loadTasks = async (next = {}) => {
    setLoading(true)
    setError('')
    try {
      const tabStatus = tabStatusMap[activeTab] || 'all'
      const effectiveStatus = next.status ?? (status === 'all' ? tabStatus : status)
      const payload = await getManagerTasks({
        search: next.search ?? search,
        priority: next.priority ?? priority,
        status: effectiveStatus,
        employeeId: next.employeeId ?? employeeId
      })
      setTasks(payload?.data || [])
      setStats(payload?.stats || { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0, cancelled: 0, drafts: 0 })
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load tasks')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeam()
  }, [])

  useEffect(() => {
    if (employeeIdFromQuery && employeeIdFromQuery !== 'all') {
      setEmployeeId(employeeIdFromQuery)
      if (createFromQuery) {
        setForm((prev) => ({ ...prev, assignedEmployeeId: employeeIdFromQuery }))
        setCreateOpen(true)
      } else {
        setActiveTab('All Tasks')
      }
    }
  }, [employeeIdFromQuery, createFromQuery])

  useEffect(() => {
    loadTasks()
  }, [activeTab, search, priority, status, employeeId])

  const employeeOptions = [{ value: 'all', label: 'All Employees' }, ...team.map((x) => ({ value: String(x.employeeId), label: x.name }))]

  const filtered = useMemo(() => {
    if (activeTab === 'Task Dashboard') return tasks
    if (activeTab === 'All Tasks') return tasks
    const mapStatus = tabStatusMap[activeTab]
    if (!mapStatus) return tasks
    return tasks.filter((x) => x.status === mapStatus)
  }, [tasks, activeTab])

  const openCreate = () => {
    setForm(initialForm)
    setCreateOpen(true)
  }

  const openEdit = (row) => {
    setSelected(row)
    setForm({
      title: row.title || '',
      description: row.description || '',
      assignedEmployeeId: String(row.assignedEmployeeId || ''),
      priority: row.priority || 'medium',
      status: row.status || 'pending',
      startDate: row.startDate ? String(row.startDate).slice(0, 10) : '',
      deadline: row.deadline ? String(row.deadline).slice(0, 10) : '',
      attachments: Array.isArray(row.attachments) && row.attachments.length ? row.attachments : [{ name: '', url: '' }]
    })
    setEditOpen(true)
  }

  const handleCreate = async (isDraft = false) => {
    if (!form.title.trim()) return setToast({ type: 'error', message: 'Title is required' })
    if (!form.assignedEmployeeId) return setToast({ type: 'error', message: 'Assigned employee is required' })

    setSubmitting(true)
    try {
      await createManagerTask({
        ...form,
        isDraft,
        attachments: (form.attachments || []).filter((x) => x.name || x.url)
      })
      setCreateOpen(false)
      setToast({ type: 'success', message: isDraft ? 'Task saved as draft' : 'Task created successfully' })
      await loadTasks()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to create task' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selected?.id) return
    setSubmitting(true)
    try {
      await updateManagerTask(selected.id, {
        ...form,
        attachments: (form.attachments || []).filter((x) => x.name || x.url)
      })
      setEditOpen(false)
      setToast({ type: 'success', message: 'Task updated successfully' })
      await loadTasks()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to update task' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selected?.id) return
    setSubmitting(true)
    try {
      await deleteManagerTask(selected.id)
      setDeleteOpen(false)
      setToast({ type: 'success', message: 'Task deleted successfully' })
      await loadTasks()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to delete task' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkCompleted = async (row) => {
    try {
      await updateManagerTaskStatus(row.id, 'completed')
      setToast({ type: 'success', message: 'Task marked completed' })
      await loadTasks()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to update status' })
    }
  }

  const handleChangeStatus = async (row, nextStatus) => {
    try {
      await updateManagerTaskStatus(row.id, nextStatus)
      setToast({ type: 'success', message: 'Task status updated' })
      await loadTasks()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to update status' })
    }
  }

  const handleComment = async () => {
    if (!selected?.id || !commentText.trim()) return
    setSubmitting(true)
    try {
      await addManagerTaskComment(selected.id, commentText.trim())
      setCommentOpen(false)
      setCommentText('')
      setToast({ type: 'success', message: 'Comment added' })
      await loadTasks()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to add comment' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReassign = async () => {
    if (!selected?.id || !reassignEmployeeId) return
    setSubmitting(true)
    try {
      await reassignManagerTask(selected.id, reassignEmployeeId)
      setReassignOpen(false)
      setToast({ type: 'success', message: 'Task reassigned' })
      await loadTasks()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to reassign task' })
    } finally {
      setSubmitting(false)
    }
  }

  const exportCsv = () => {
    const headers = ['Title', 'Assigned employee', 'Priority', 'Status', 'Start date', 'Deadline']
    const lines = filtered.map((row) => [row.title, row.assignedEmployeeName, row.priority, row.status, formatDate(row.startDate), formatDate(row.deadline)])
    const csv = [headers, ...lines].map((line) => line.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `manager-tasks-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    const lines = filtered.map((row, idx) => `${idx + 1}. ${row.title} | ${row.assignedEmployeeName} | ${row.status} | ${formatDate(row.deadline)}`)
    const text = ['Manager Task Report', `Generated: ${new Date().toISOString()}`, '', ...lines].join('\n')
    const blob = new Blob([text], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `manager-tasks-${new Date().toISOString().slice(0, 10)}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Task Management"
        description="Create, assign, and track team tasks across full execution lifecycle."
        breadcrumb={['Manager Portal', 'Task Management']}
      />

      <div className="actions-row" style={{ justifyContent: 'flex-end', marginTop: -8 }}>
        <Button onClick={openCreate}>Add Task</Button>
      </div>

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel">
        <div className="workspace-nav">
          {tabs.map((tab) => (
            <button key={tab} type="button" className={`chip-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>

        <div className="filters-row admin-filters-grid" style={{ marginTop: 10 }}>
          <div className="search-wrap"><label>Search</label><SearchBar value={search} onChange={setSearch} placeholder="Search title, description, assignee" /></div>
          <FilterDropdown label="Priority" value={priority} onChange={setPriority} options={[{ value: 'all', label: 'All Priority' }, ...priorityOptions.map((x) => ({ value: x, label: x }))]} />
          <FilterDropdown label="Status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'Tab Status' }, ...statusOptions.map((x) => ({ value: x, label: x }))]} />
          <FilterDropdown label="Employee" value={employeeId} onChange={setEmployeeId} options={employeeOptions} />
        </div>

        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={loadTasks}>Filter</Button>
          <Button variant="ghost" onClick={() => { setSearch(''); setPriority('all'); setStatus('all'); setEmployeeId('all'); loadTasks({ search: '', priority: 'all', status: 'all', employeeId: 'all' }) }}>Reset</Button>
          <Button variant="ghost" onClick={loadTasks}><RefreshCw size={14} /> Refresh</Button>
          <Button variant="ghost" onClick={exportPdf}><Download size={14} /> Download PDF</Button>
          <Button variant="ghost" onClick={exportCsv}><Download size={14} /> Download Excel</Button>
        </div>
      </div>

      <div className="stats-grid premium-stats-grid">
        <StatCard title="Total Tasks" value={String(stats.total || 0)} trend="All task records" />
        <StatCard title="Pending" value={String(stats.pending || 0)} trend="Awaiting execution" trendTone="warning" />
        <StatCard title="In Progress" value={String(stats.inProgress || 0)} trend="Active execution" trendTone="info" />
        <StatCard title="Completed" value={String(stats.completed || 0)} trend="Delivered" trendTone="success" />
        <StatCard title="Overdue" value={String(stats.overdue || 0)} trend="Requires follow-up" trendTone="danger" />
      </div>

      <div className="panel">
        <div className="panel-head"><h3>{activeTab}</h3></div>
        {loading ? <LoadingSkeleton rows={8} /> : error ? <EmptyState title="Unable to load tasks" description={error} /> : filtered.length === 0 ? (
          <EmptyState title="No tasks found" description="Create or adjust filters to see task records." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Assigned employee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Start date</th>
                  <th>Deadline</th>
                  <th>Attachments</th>
                  <th>Comments</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{row.assignedEmployeeName}</td>
                    <td>{row.priority}</td>
                    <td><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                    <td>{formatDate(row.startDate)}</td>
                    <td>{formatDate(row.deadline)}</td>
                    <td>{Array.isArray(row.attachments) ? row.attachments.length : 0}</td>
                    <td>{Array.isArray(row.comments) ? row.comments.length : 0}</td>
                    <td>
                      <div className="table-actions">
                        <button className="text-btn" onClick={() => { setSelected(row); setViewOpen(true) }}>View</button>
                        <button className="text-btn" onClick={() => openEdit(row)}>Edit</button>
                        <button className="text-btn danger" onClick={() => { setSelected(row); setDeleteOpen(true) }}>Delete</button>
                        {row.status !== 'completed' ? <button className="text-btn" onClick={() => handleMarkCompleted(row)}>Mark Completed</button> : null}
                        <button className="text-btn" onClick={() => { setSelected(row); setReassignEmployeeId(String(row.assignedEmployeeId || '')); setReassignOpen(true) }}>Reassign Task</button>
                        <button className="text-btn" onClick={() => { setSelected(row); setCommentText(''); setCommentOpen(true) }}>Add Comment</button>
                        <select className="form-input" value={row.status} onChange={(e) => handleChangeStatus(row, e.target.value)} style={{ minWidth: 130 }}>
                          {statusOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TaskFormModal
        open={createOpen}
        title="Create Task"
        form={form}
        setForm={setForm}
        team={team}
        submitting={submitting}
        onClose={() => setCreateOpen(false)}
        onSave={() => handleCreate(false)}
        onDraft={() => handleCreate(true)}
      />

      <TaskFormModal
        open={editOpen}
        title="Edit Task"
        form={form}
        setForm={setForm}
        team={team}
        submitting={submitting}
        onClose={() => setEditOpen(false)}
        onSave={handleUpdate}
        hideDraft
      />

      <Modal open={viewOpen} title="Task Details" onClose={() => setViewOpen(false)}>
        {!selected ? <EmptyState title="No task selected" description="Select a task to view details." /> : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Title:</strong> <span>{selected.title}</span></div>
            <div className="inline-action-card"><strong>Description:</strong> <span>{selected.description || '-'}</span></div>
            <div className="inline-action-card"><strong>Assigned Employee:</strong> <span>{selected.assignedEmployeeName}</span></div>
            <div className="inline-action-card"><strong>Priority:</strong> <span>{selected.priority}</span></div>
            <div className="inline-action-card"><strong>Status:</strong> <span>{selected.status}</span></div>
            <div className="inline-action-card"><strong>Start Date:</strong> <span>{formatDate(selected.startDate)}</span></div>
            <div className="inline-action-card"><strong>Deadline:</strong> <span>{formatDate(selected.deadline)}</span></div>
            <div className="inline-action-card"><strong>Attachments:</strong> <span>{(selected.attachments || []).map((a) => a.name || a.url).join(', ') || '-'}</span></div>
            <div className="inline-action-card"><strong>Comments:</strong> <span>{(selected.comments || []).map((c) => c.comment).join(' | ') || '-'}</span></div>
          </div>
        )}
      </Modal>

      <Modal open={commentOpen} title="Add Comment" onClose={() => setCommentOpen(false)}>
        <div className="modal-form">
          <label className="form-input-wrap"><span>Comment</span><textarea className="form-input" rows={4} value={commentText} onChange={(e) => setCommentText(e.target.value)} /></label>
          <Button onClick={handleComment} disabled={submitting}>{submitting ? 'Saving...' : 'Add Comment'}</Button>
        </div>
      </Modal>

      <Modal open={reassignOpen} title="Reassign Task" onClose={() => setReassignOpen(false)}>
        <div className="modal-form">
          <FilterDropdown label="Assign To" value={reassignEmployeeId} onChange={setReassignEmployeeId} options={team.map((x) => ({ value: String(x.employeeId), label: x.name }))} />
          <Button onClick={handleReassign} disabled={submitting}>{submitting ? 'Reassigning...' : 'Reassign Task'}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Task"
        message={`Delete task \"${selected?.title || ''}\"?`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </section>
  )
}

function TaskFormModal({ open, title, form, setForm, team, submitting, onClose, onSave, onDraft, hideDraft = false }) {
  const setAttachment = (index, key, value) => {
    setForm((prev) => {
      const next = [...(prev.attachments || [])]
      next[index] = { ...(next[index] || {}), [key]: value }
      return { ...prev, attachments: next }
    })
  }

  const addAttachment = () => setForm((prev) => ({ ...prev, attachments: [...(prev.attachments || []), { name: '', url: '' }] }))

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="modal-form">
        <label className="form-input-wrap"><span>Title</span><input className="form-input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></label>
        <label className="form-input-wrap"><span>Description</span><textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></label>
        <FilterDropdown label="Assigned Employee" value={form.assignedEmployeeId} onChange={(value) => setForm((p) => ({ ...p, assignedEmployeeId: value }))} options={[{ value: '', label: 'Select employee' }, ...team.map((x) => ({ value: String(x.employeeId), label: x.name }))]} />
        <FilterDropdown label="Priority" value={form.priority} onChange={(value) => setForm((p) => ({ ...p, priority: value }))} options={priorityOptions.map((x) => ({ value: x, label: x }))} />
        <FilterDropdown label="Status" value={form.status} onChange={(value) => setForm((p) => ({ ...p, status: value }))} options={statusOptions.map((x) => ({ value: x, label: x }))} />
        <label className="form-input-wrap"><span>Start Date</span><input className="form-input" type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} /></label>
        <label className="form-input-wrap"><span>Deadline</span><input className="form-input" type="date" value={form.deadline} onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))} /></label>

        <div className="panel" style={{ padding: 10 }}>
          <div className="panel-head"><h3>Attachments</h3><Button variant="ghost" onClick={addAttachment}>Upload Attachment</Button></div>
          {(form.attachments || []).map((att, idx) => (
            <div key={`att-${idx}`} className="filters-row" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 8 }}>
              <input className="form-input" placeholder="Attachment name" value={att.name || ''} onChange={(e) => setAttachment(idx, 'name', e.target.value)} />
              <input className="form-input" placeholder="Attachment URL" value={att.url || ''} onChange={(e) => setAttachment(idx, 'url', e.target.value)} />
            </div>
          ))}
        </div>

        <div className="actions-row">
          {!hideDraft ? <Button variant="ghost" onClick={onDraft} disabled={submitting}>{submitting ? 'Saving...' : 'Save as Draft'}</Button> : null}
          <Button onClick={onSave} disabled={submitting}>{submitting ? 'Saving...' : 'Save Task'}</Button>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
        </div>
      </div>
    </Modal>
  )
}

export default ManagerTaskManagementPage

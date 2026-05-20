import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import DataTable from '../../components/ui/DataTable'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import {
  addManagerRequestComment,
  closeManagerRequest,
  createManagerRequest,
  deleteManagerRequest,
  getManagerRequestById,
  getManagerRequests,
  updateManagerRequest,
  uploadManagerRequestDocument
} from '../../api/managerRequestsApi'

const tabs = ['Raise Request', 'My Requests', 'Request Details', 'Request Status Tracking']
const requestTypes = [
  'new-employee-requirement',
  'salary-issue',
  'employee-complaint',
  'resource-request',
  'policy-issue',
  'technical-issue',
  'attendance-correction-request',
  'other'
]
const statuses = ['draft', 'pending', 'in-review', 'approved', 'rejected', 'resolved', 'closed']

const initialForm = {
  requestType: 'other',
  subject: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  raisedTo: 'hr_admin'
}

const formatDate = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

function ManagerRequestsEscalationPage() {
  const [activeTab, setActiveTab] = useState('My Requests')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)

  const [form, setForm] = useState(initialForm)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const [viewOpen, setViewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [commentOpen, setCommentOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)

  const [commentText, setCommentText] = useState('')
  const [uploadDoc, setUploadDoc] = useState({ name: '', url: '', file: null })

  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const loadRequests = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getManagerRequests({ search, status: statusFilter, requestType: typeFilter })
      const nextRows = data?.data || []
      setRows(nextRows)
      if (selected?.id) {
        const matched = nextRows.find((x) => x.id === selected.id)
        if (matched) setSelected(matched)
      }
    } catch (err) {
      setRows([])
      setError(err?.response?.data?.message || err?.message || 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows
    const needle = search.trim().toLowerCase()
    return rows.filter((row) => (`${row.subject} ${row.description} ${row.requestType}`).toLowerCase().includes(needle))
  }, [rows, search])

  const openView = async (row, openModal = true) => {
    if (openModal) setViewOpen(true)
    setSelected(null)
    try {
      const data = await getManagerRequestById(row.id)
      setSelected(data?.data || null)
    } catch (_err) {
      setSelected(null)
    }
  }

  const ensureSelectedDetails = async (row) => {
    if (!row?.id) return
    try {
      const data = await getManagerRequestById(row.id)
      setSelected(data?.data || null)
    } catch (_err) {
      setSelected(row)
    }
  }

  const handleSubmit = async (isDraft = false) => {
    if (!form.subject.trim()) return setToast({ type: 'error', message: 'Subject is required' })
    setSubmitting(true)
    try {
      await createManagerRequest({ ...form, isDraft, status: isDraft ? 'draft' : 'pending' })
      setForm(initialForm)
      setActiveTab('My Requests')
      setToast({ type: 'success', message: isDraft ? 'Request saved as draft' : 'Request submitted successfully' })
      await loadRequests()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to submit request' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selected?.id) return
    if (selected?.status === 'closed') return setToast({ type: 'error', message: 'Closed request cannot be edited' })
    setSubmitting(true)
    try {
      await updateManagerRequest(selected.id, form)
      setEditOpen(false)
      setToast({ type: 'success', message: 'Request updated successfully' })
      await loadRequests()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to update request' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selected?.id) return
    if (selected?.status === 'closed') return setToast({ type: 'error', message: 'Closed request cannot be cancelled' })
    setSubmitting(true)
    try {
      await deleteManagerRequest(selected.id)
      setDeleteOpen(false)
      setToast({ type: 'success', message: 'Request cancelled successfully' })
      await loadRequests()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to cancel request' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleComment = async () => {
    if (!selected?.id || !commentText.trim()) return
    setSubmitting(true)
    try {
      await addManagerRequestComment(selected.id, commentText.trim())
      setCommentOpen(false)
      setCommentText('')
      setToast({ type: 'success', message: 'Comment added' })
      await loadRequests()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to add comment' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpload = async () => {
    if (!selected?.id || (!uploadDoc.name && !uploadDoc.url && !uploadDoc.file)) {
      setToast({ type: 'error', message: 'Please provide document name/url or select a file' })
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      if (uploadDoc.name) formData.append('name', uploadDoc.name)
      if (uploadDoc.url) formData.append('url', uploadDoc.url)
      if (uploadDoc.file) formData.append('file', uploadDoc.file)
      await uploadManagerRequestDocument(selected.id, formData)
      setUploadOpen(false)
      setUploadDoc({ name: '', url: '', file: null })
      setToast({ type: 'success', message: 'Document uploaded' })
      await loadRequests()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to upload document' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseRequest = async () => {
    if (!selected?.id) return
    if (selected?.status === 'closed') return setToast({ type: 'error', message: 'Request is already closed' })
    setSubmitting(true)
    try {
      await closeManagerRequest(selected.id)
      setCloseOpen(false)
      setToast({ type: 'success', message: 'Request closed successfully' })
      await loadRequests()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to close request' })
    } finally {
      setSubmitting(false)
    }
  }

  const statusTrackingRows = filteredRows.map((row) => ({
    id: row.id,
    subject: row.subject,
    requestType: row.requestType,
    status: row.status,
    updatedAt: formatDate(row.updatedAt)
  }))

  useEffect(() => {
    if (activeTab !== 'Request Details') return
    if (selected?.id) return
    if (!filteredRows.length) return
    ensureSelectedDetails(filteredRows[0])
  }, [activeTab, filteredRows, selected])

  return (
    <section className="section-layout">
      <PageHeader
        title="Requests / Escalation"
        description="Raise, track, and manage operational requests to HR/Admin."
        breadcrumb={['Manager Portal', 'Requests / Escalation']}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel">
        <div className="workspace-nav">
          {tabs.map((tab) => <button key={tab} type="button" className={`chip-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}
        </div>

        <div className="filters-row admin-filters-grid" style={{ marginTop: 10 }}>
          <div className="search-wrap"><label>Search</label><SearchBar value={search} onChange={setSearch} placeholder="Search subject, description, type" /></div>
          <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={[{ value: 'all', label: 'All' }, ...statuses.map((x) => ({ value: x, label: x }))]} />
          <FilterDropdown label="Request Type" value={typeFilter} onChange={setTypeFilter} options={[{ value: 'all', label: 'All' }, ...requestTypes.map((x) => ({ value: x, label: x }))]} />
        </div>

        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={loadRequests}>Apply Filters</Button>
          <Button variant="ghost" onClick={loadRequests}><RefreshCw size={14} /> Refresh</Button>
          {activeTab !== 'Raise Request' ? <Button onClick={() => setActiveTab('Raise Request')}>Raise Request</Button> : null}
        </div>
      </div>

      {activeTab === 'Raise Request' ? (
        <article className="panel">
          <div className="panel-head"><h3>Raise Request</h3></div>
          <RequestForm form={form} setForm={setForm} showStatus={false} />
          <div className="actions-row" style={{ marginTop: 10 }}>
            <Button variant="ghost" onClick={() => handleSubmit(true)} disabled={submitting}>{submitting ? 'Saving...' : 'Save Draft'}</Button>
            <Button onClick={() => handleSubmit(false)} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</Button>
          </div>
        </article>
      ) : null}

      {activeTab === 'My Requests' ? (
        <article className="panel">
          <div className="panel-head"><h3>My Requests</h3></div>
          {loading ? <LoadingSkeleton rows={7} /> : error ? <EmptyState title="Unable to load requests" description={error} /> : (
            <DataTable
              columns={[
                { key: 'subject', label: 'Subject' },
                { key: 'requestType', label: 'Request Type' },
                { key: 'priority', label: 'Priority' },
                { key: 'status', label: 'Status' },
                { key: 'createdAt', label: 'Created At' }
              ]}
              rows={filteredRows.map((x) => ({ ...x, createdAt: formatDate(x.createdAt) }))}
              onView={async (row) => {
                await openView(row, false)
                setActiveTab('Request Details')
              }}
              onEdit={(row) => {
                if (row.status === 'closed') {
                  setToast({ type: 'error', message: 'Closed request cannot be edited' })
                  return
                }
                setSelected(row)
                setForm({
                  requestType: row.requestType || 'other',
                  subject: row.subject || '',
                  description: row.description || '',
                  status: row.status || 'pending',
                  priority: row.priority || 'medium',
                  raisedTo: row.raisedTo || 'hr_admin'
                })
                setEditOpen(true)
              }}
              onDelete={(row) => {
                if (row.status === 'closed') {
                  setToast({ type: 'error', message: 'Closed request cannot be cancelled' })
                  return
                }
                setSelected(row)
                setDeleteOpen(true)
              }}
              showViewAction
              showEditAction
              showDeleteAction
              emptyTitle="No requests"
              emptyDescription="Raise your first request to get started."
            />
          )}
        </article>
      ) : null}

      {activeTab === 'Request Details' ? (
        <article className="panel">
          <div className="panel-head"><h3>Request Details</h3></div>
          {!selected ? <EmptyState title="No request selected" description="Open a request from My Requests to view details." /> : (
            <div className="modal-form">
              <div className="inline-action-card"><strong>Subject:</strong> <span>{selected.subject || '-'}</span></div>
              <div className="inline-action-card"><strong>Type:</strong> <span>{selected.requestType || '-'}</span></div>
              <div className="inline-action-card"><strong>Status:</strong> <span>{selected.status || '-'}</span></div>
              <div className="inline-action-card"><strong>Priority:</strong> <span>{selected.priority || '-'}</span></div>
              <div className="inline-action-card"><strong>Updated:</strong> <span>{formatDate(selected.updatedAt)}</span></div>
              <div className="inline-action-card"><strong>Description:</strong> <span>{selected.description || '-'}</span></div>
              <div className="actions-row">
                <Button variant="ghost" onClick={() => setCommentOpen(true)}>Add Comment</Button>
                <Button variant="ghost" onClick={() => setUploadOpen(true)}>Upload Document</Button>
                <Button variant="ghost" onClick={() => setViewOpen(true)}>Open Full Details</Button>
                <Button onClick={() => setCloseOpen(true)} disabled={selected.status === 'closed'}>{selected.status === 'closed' ? 'Already Closed' : 'Close Request'}</Button>
              </div>
            </div>
          )}
        </article>
      ) : null}

      {activeTab === 'Request Status Tracking' ? (
        <article className="panel">
          <div className="panel-head"><h3>Request Status Tracking</h3></div>
          {loading ? <LoadingSkeleton rows={5} /> : (
            <DataTable
              columns={[
                { key: 'subject', label: 'Subject' },
                { key: 'requestType', label: 'Type' },
                { key: 'status', label: 'Status' },
                { key: 'updatedAt', label: 'Last Updated' }
              ]}
              rows={statusTrackingRows}
              onView={(row) => openView(row)}
              showViewAction
              showEditAction={false}
              showDeleteAction={false}
              emptyTitle="No tracked requests"
              emptyDescription="Request lifecycle status will appear here."
            />
          )}
        </article>
      ) : null}

      <Modal open={viewOpen} title="Request Details" onClose={() => setViewOpen(false)}>
        {!selected ? <LoadingSkeleton rows={5} /> : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Subject:</strong> <span>{selected.subject || '-'}</span></div>
            <div className="inline-action-card"><strong>Type:</strong> <span>{selected.requestType || '-'}</span></div>
            <div className="inline-action-card"><strong>Status:</strong> <span>{selected.status || '-'}</span></div>
            <div className="inline-action-card"><strong>Priority:</strong> <span>{selected.priority || '-'}</span></div>
            <div className="inline-action-card"><strong>Description:</strong> <span>{selected.description || '-'}</span></div>
            <div className="inline-action-card"><strong>Raised To:</strong> <span>{selected.raisedTo || '-'}</span></div>
            <div className="inline-action-card"><strong>Comments:</strong> <span>{(selected.comments || []).map((x) => x.comment).join(' | ') || '-'}</span></div>
            <div className="inline-action-card"><strong>Documents:</strong> <span>{(selected.documents || []).map((x) => x.name || x.url).join(' | ') || '-'}</span></div>
            <div className="inline-action-card"><strong>Timeline:</strong> <span>{(selected.timeline || []).map((x) => `${x.action}:${x.status}`).join(' | ') || '-'}</span></div>
          </div>
        )}
      </Modal>

      <Modal open={editOpen} title="Edit Request" onClose={() => setEditOpen(false)}>
        <RequestForm form={form} setForm={setForm} />
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button onClick={handleEdit} disabled={submitting}>{submitting ? 'Saving...' : 'Edit'}</Button>
        </div>
      </Modal>

      <Modal open={commentOpen} title="Add Comment" onClose={() => setCommentOpen(false)}>
        <div className="modal-form">
          <label className="form-input-wrap"><span>Comment</span><textarea className="form-input" rows={4} value={commentText} onChange={(e) => setCommentText(e.target.value)} /></label>
          <Button onClick={handleComment} disabled={submitting}>{submitting ? 'Saving...' : 'Add Comment'}</Button>
        </div>
      </Modal>

      <Modal open={uploadOpen} title="Upload Document" onClose={() => setUploadOpen(false)}>
        <div className="modal-form">
          <label className="form-input-wrap"><span>Document Name</span><input className="form-input" value={uploadDoc.name} onChange={(e) => setUploadDoc((p) => ({ ...p, name: e.target.value }))} /></label>
          <label className="form-input-wrap"><span>Document URL</span><input className="form-input" value={uploadDoc.url} onChange={(e) => setUploadDoc((p) => ({ ...p, url: e.target.value }))} /></label>
          <label className="form-input-wrap"><span>Select File</span><input className="form-input" type="file" onChange={(e) => setUploadDoc((p) => ({ ...p, file: e.target.files?.[0] || null }))} /></label>
          <Button onClick={handleUpload} disabled={submitting}>{submitting ? 'Uploading...' : 'Upload Document'}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Cancel Request"
        message={`Cancel request \"${selected?.subject || ''}\"?`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={closeOpen}
        title="Close Request"
        message={`Close request \"${selected?.subject || ''}\"?`}
        onCancel={() => setCloseOpen(false)}
        onConfirm={handleCloseRequest}
      />
    </section>
  )
}

function RequestForm({ form, setForm, showStatus = true }) {
  return (
    <div className="modal-form">
      <FilterDropdown label="Request type" value={form.requestType} onChange={(value) => setForm((p) => ({ ...p, requestType: value }))} options={requestTypes.map((x) => ({ value: x, label: x }))} />
      <label className="form-input-wrap"><span>Subject</span><input className="form-input" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} /></label>
      <label className="form-input-wrap"><span>Description</span><textarea className="form-input" rows={4} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></label>
      <FilterDropdown label="Priority" value={form.priority} onChange={(value) => setForm((p) => ({ ...p, priority: value }))} options={[{ value: 'low', label: 'low' }, { value: 'medium', label: 'medium' }, { value: 'high', label: 'high' }, { value: 'urgent', label: 'urgent' }]} />
      {showStatus ? <FilterDropdown label="Status" value={form.status} onChange={(value) => setForm((p) => ({ ...p, status: value }))} options={statuses.map((x) => ({ value: x, label: x }))} /> : null}
      <FilterDropdown label="Raised to" value={form.raisedTo} onChange={(value) => setForm((p) => ({ ...p, raisedTo: value }))} options={[{ value: 'hr_admin', label: 'HR/Admin' }, { value: 'hr', label: 'HR' }, { value: 'admin', label: 'Admin' }]} />
    </div>
  )
}

export default ManagerRequestsEscalationPage

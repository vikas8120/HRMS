import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import FilterDropdown from '../../components/ui/FilterDropdown'
import {
  deleteEmployeeDocument,
  downloadEmployeeDocument,
  getEmployeeDocumentById,
  getEmployeeDocuments,
  updateEmployeeDocument,
  uploadEmployeeDocument
} from '../../api/employeeDocumentApi'

const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'id-proof', label: 'ID Proof' },
  { value: 'address-proof', label: 'Address Proof' },
  { value: 'education', label: 'Education' },
  { value: 'experience', label: 'Experience' },
  { value: 'tax', label: 'Tax' },
  { value: 'bank', label: 'Bank' },
  { value: 'other', label: 'Other' }
]

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'pending', label: 'Pending' }
]

const defaultForm = {
  title: '',
  category: 'other',
  documentNumber: '',
  notes: '',
  issueDate: '',
  expiryDate: '',
  status: 'active',
  file: null
}

const resolveFileHref = (fileUrl) => {
  const url = String(fileUrl || '').trim()
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const apiRoot = import.meta.env.VITE_API_URL || 'http://localhost:5001'
  const origin = apiRoot.replace(/\/$/, '')
  return `${origin}${url}`
}

const isImageFile = (fileUrl) => /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(String(fileUrl || ''))

function EmployeeDocumentsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')

  const [docs, setDocs] = useState([])
  const [required, setRequired] = useState({ requiredCategories: [], missingCategories: [], uploadedCount: 0, missingCount: 0 })

  const [formOpen, setFormOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const showMessage = (setter, message) => {
    setter(message)
    setTimeout(() => setter(''), 2600)
  }

  const loadDocuments = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getEmployeeDocuments({ category, status })
      setDocs(response?.data?.items || [])
      setRequired(response?.data?.required || { requiredCategories: [], missingCategories: [], uploadedCount: 0, missingCount: 0 })
    } catch (err) {
      setDocs([])
      setRequired({ requiredCategories: [], missingCategories: [], uploadedCount: 0, missingCount: 0 })
      setError(err?.response?.data?.message || err?.message || 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [category, status])

  const resetForm = () => {
    setForm(defaultForm)
    setEditingId('')
  }

  const openUpload = () => {
    resetForm()
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(String(row.id))
    setForm({
      title: row.title || '',
      category: row.category || 'other',
      documentNumber: row.documentNumber || '',
      notes: row.notes || '',
      issueDate: row.issueDate ? String(row.issueDate).slice(0, 10) : '',
      expiryDate: row.expiryDate ? String(row.expiryDate).slice(0, 10) : '',
      status: row.status || 'active',
      file: null
    })
    setFormOpen(true)
  }

  const submitForm = async () => {
    if (!form.title.trim()) {
      showMessage(setError, 'title is required')
      return
    }
    if (!editingId && !form.file) {
      showMessage(setError, 'File is required')
      return
    }

    const formData = new FormData()
    formData.append('title', form.title)
    formData.append('category', form.category)
    formData.append('documentNumber', form.documentNumber)
    formData.append('notes', form.notes)
    formData.append('issueDate', form.issueDate)
    formData.append('expiryDate', form.expiryDate)
    formData.append('status', form.status)
    if (form.file) formData.append('file', form.file)

    setSubmitting(true)
    try {
      const response = editingId
        ? await updateEmployeeDocument(editingId, formData)
        : await uploadEmployeeDocument(formData)
      showMessage(setSuccess, response?.message || '')
      setFormOpen(false)
      resetForm()
      await loadDocuments()
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to submit document')
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (row) => {
    setSubmitting(true)
    try {
      const response = await deleteEmployeeDocument(row.id)
      showMessage(setSuccess, response?.message || '')
      await loadDocuments()
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to delete document')
    } finally {
      setSubmitting(false)
    }
  }

  const onView = async (row) => {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setSelected(null)
    try {
      const response = await getEmployeeDocumentById(row.id)
      setSelected(response?.data || null)
    } catch (err) {
      showMessage(setError, err?.response?.data?.message || 'Failed to fetch document details')
    } finally {
      setDetailsLoading(false)
    }
  }

  const rows = useMemo(() => docs.map((item) => ({
    ...item,
    issueDate: item.issueDate ? String(item.issueDate).slice(0, 10) : '-',
    expiryDate: item.expiryDate ? String(item.expiryDate).slice(0, 10) : '-',
    createdAt: item.createdAt ? String(item.createdAt).slice(0, 10) : '-'
  })), [docs])

  return (
    <section className="section-layout">
      <PageHeader
        title="Employee Documents"
        description="Upload, manage, and track your own documents and required document gaps."
        breadcrumb={['Employee Portal', 'Documents']}
        primaryActionLabel="Upload Document"
        onPrimaryAction={openUpload}
      />

      {success ? <div className="panel" style={{ borderColor: 'rgba(34,197,94,0.35)' }}>{success}</div> : null}
      {error ? <div className="panel error-banner">{error}</div> : null}

      <div className="panel">
        <div className="filters-row">
          <FilterDropdown label="Category" value={category} onChange={setCategory} options={categoryOptions} />
          <FilterDropdown label="Status" value={status} onChange={setStatus} options={statusOptions} />
          <div className="actions-row" style={{ alignSelf: 'end' }}>
            <Button variant="ghost" onClick={loadDocuments}>Refresh</Button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Required/Missing Documents</h3></div>
        {loading ? <LoadingSkeleton rows={2} /> : (
          required.requiredCategories.length === 0
            ? <EmptyState title="No required document policy configured" description="Company required document categories are not configured yet." />
            : (
              <div className="dashboard-mini-grid">
                <div className="inline-action-card"><strong>Required Categories:</strong> <span>{required.requiredCategories.join(', ') || '-'}</span></div>
                <div className="inline-action-card"><strong>Missing Categories:</strong> <span>{required.missingCategories.join(', ') || 'None'}</span></div>
                <div className="inline-action-card"><strong>Uploaded Count:</strong> <span>{required.uploadedCount}</span></div>
              </div>
            )
        )}
      </div>

      <div className="panel">
        <div className="panel-head"><h3>My Documents</h3></div>
        {loading ? <LoadingSkeleton rows={6} /> : rows.length === 0 ? <EmptyState title="No documents uploaded" description="Upload your first document to get started." /> : (
          <DataTable
            columns={[
              { key: 'preview', label: 'Preview', sortable: false },
              { key: 'title', label: 'Title' },
              { key: 'category', label: 'Category' },
              { key: 'documentNumber', label: 'Document Number' },
              { key: 'status', label: 'Status' },
              { key: 'issueDate', label: 'Issue Date' },
              { key: 'expiryDate', label: 'Expiry Date' },
              { key: 'createdAt', label: 'Uploaded On' }
            ]}
            rows={rows.map((row) => ({
              ...row,
              preview: isImageFile(row.fileUrl)
                ? (
                  <img
                    src={resolveFileHref(row.fileUrl)}
                    alt={row.title || 'Document'}
                    style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }}
                  />
                  )
                : 'File'
            }))}
            showViewAction
            showEditAction
            showDeleteAction
            editLabel="Replace/Update"
            onView={onView}
            onEdit={(row) => openEdit(row)}
            onDelete={onDelete}
          />
        )}
      </div>

      <Modal open={formOpen} title={editingId ? 'Replace/Update Document' : 'Upload Document'} onClose={() => setFormOpen(false)}>
        <div className="modal-form">
          <label className="form-input-wrap"><span>Title</span><input className="form-input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></label>
          <FilterDropdown label="Category" value={form.category} onChange={(value) => setForm((p) => ({ ...p, category: value }))} options={categoryOptions.filter((x) => x.value !== 'all')} />
          <label className="form-input-wrap"><span>Document Number</span><input className="form-input" value={form.documentNumber} onChange={(e) => setForm((p) => ({ ...p, documentNumber: e.target.value }))} /></label>
          <FilterDropdown label="Status" value={form.status} onChange={(value) => setForm((p) => ({ ...p, status: value }))} options={statusOptions.filter((x) => x.value !== 'all')} />
          <label className="form-input-wrap"><span>Issue Date</span><input className="form-input" type="date" value={form.issueDate} onChange={(e) => setForm((p) => ({ ...p, issueDate: e.target.value }))} /></label>
          <label className="form-input-wrap"><span>Expiry Date</span><input className="form-input" type="date" value={form.expiryDate} onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))} /></label>
          <label className="form-input-wrap"><span>Notes</span><textarea className="form-input" rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></label>
          <label className="form-input-wrap"><span>File {editingId ? '(optional to replace existing)' : ''}</span><input className="form-input" type="file" onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} /></label>
          <div className="actions-row">
            <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={submitForm} disabled={submitting}>{submitting ? 'Submitting...' : (editingId ? 'Update Document' : 'Upload Document')}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={detailsOpen} title="Document Details" onClose={() => setDetailsOpen(false)}>
        {detailsLoading ? <LoadingSkeleton rows={4} /> : !selected ? <EmptyState title="No document details" description="Unable to load selected document." /> : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Title:</strong> <span>{selected.title || '-'}</span></div>
            <div className="inline-action-card"><strong>Category:</strong> <span>{selected.category || '-'}</span></div>
            <div className="inline-action-card"><strong>Document Number:</strong> <span>{selected.documentNumber || '-'}</span></div>
            <div className="inline-action-card"><strong>Status:</strong> <span>{selected.status || '-'}</span></div>
            <div className="inline-action-card"><strong>Issue Date:</strong> <span>{selected.issueDate ? String(selected.issueDate).slice(0, 10) : '-'}</span></div>
            <div className="inline-action-card"><strong>Expiry Date:</strong> <span>{selected.expiryDate ? String(selected.expiryDate).slice(0, 10) : '-'}</span></div>
            <div className="inline-action-card"><strong>Notes:</strong> <span>{selected.notes || '-'}</span></div>
            {isImageFile(selected.fileUrl) ? (
              <div className="inline-action-card" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <strong>Image Preview:</strong>
                <img
                  src={resolveFileHref(selected.fileUrl)}
                  alt={selected.title || 'Document'}
                  style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--line)' }}
                />
              </div>
            ) : null}
            <div className="actions-row">
              <Button onClick={() => downloadEmployeeDocument(selected)}>Download</Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

export default EmployeeDocumentsPage

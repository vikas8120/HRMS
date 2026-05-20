import { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Modal from '../../components/ui/Modal'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import { getManagerTeam } from '../../api/managerTeamApi'
import {
  createManagerDocumentRequest,
  deleteManagerDocument,
  getManagerDocumentById,
  getManagerMyDocuments,
  getManagerDocumentRequests,
  getManagerDocuments,
  uploadManagerMyDocument,
  uploadManagerDocument
} from '../../api/managerDocumentsApi'

const tabs = ['Team Documents', 'Upload Team Document', 'My Documents', 'Document Requests']

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

function ManagerDocumentsPage() {
  const [activeTab, setActiveTab] = useState('Team Documents')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [documents, setDocuments] = useState([])
  const [myDocuments, setMyDocuments] = useState([])
  const [requests, setRequests] = useState([])
  const [team, setTeam] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [toast, setToast] = useState(null)
  const [selected, setSelected] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)

  const [uploadForm, setUploadForm] = useState({
    title: '',
    employeeId: '',
    category: 'other',
    documentNumber: '',
    notes: '',
    issueDate: '',
    expiryDate: '',
    status: 'active',
    file: null
  })

  const [requestForm, setRequestForm] = useState({
    employeeId: '',
    title: '',
    description: '',
    requiredBy: ''
  })
  const [myUploadForm, setMyUploadForm] = useState({
    title: '',
    category: 'other',
    documentNumber: '',
    notes: '',
    issueDate: '',
    expiryDate: '',
    status: 'active',
    file: null
  })

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const loadTeam = async () => {
    try {
      const payload = await getManagerTeam()
      setTeam(payload?.data || [])
    } catch (_err) {
      setTeam([])
    }
  }

  const loadDocuments = async () => {
    const payload = await getManagerDocuments({ search, category, status })
    setDocuments(payload?.data || [])
  }

  const loadMyDocuments = async () => {
    const payload = await getManagerMyDocuments({ search, category, status })
    setMyDocuments(payload?.data || [])
  }

  const loadRequests = async () => {
    const payload = await getManagerDocumentRequests()
    setRequests(payload?.data || [])
  }

  const loadAll = async () => {
    setLoading(true)
    try {
      await Promise.all([loadDocuments(), loadMyDocuments(), loadRequests()])
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to load documents' })
      setDocuments([])
      setMyDocuments([])
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTeam() }, [])
  useEffect(() => { loadAll() }, [category, status])

  const filteredDocuments = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return documents
    return documents.filter((x) => `${x.title} ${x.employeeName} ${x.employeeEmail} ${x.category}`.toLowerCase().includes(needle))
  }, [documents, search])

  const filteredMyDocuments = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return myDocuments
    return myDocuments.filter((x) => `${x.title} ${x.category} ${x.documentNumber}`.toLowerCase().includes(needle))
  }, [myDocuments, search])

  const employeeOptions = [{ value: '', label: 'Select Employee' }, ...team.map((x) => ({ value: String(x.employeeId || x.id), label: `${x.name} (${x.email})` }))]

  const onView = async (row) => {
    try {
      const payload = await getManagerDocumentById(row.id)
      setSelected(payload?.data || row)
      setViewOpen(true)
    } catch (_err) {
      setSelected(row)
      setViewOpen(true)
    }
  }

  const onDownload = (row) => {
    if (!row.fileUrl) return setToast({ type: 'error', message: 'No file available for download' })
    window.open(row.fileUrl, '_blank', 'noopener,noreferrer')
  }

  const onDelete = async (row) => {
    if (!window.confirm(`Delete document "${row.title}"?`)) return
    setSubmitting(true)
    try {
      await deleteManagerDocument(row.id)
      setToast({ type: 'success', message: 'Document deleted' })
      await loadDocuments()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to delete document' })
    } finally {
      setSubmitting(false)
    }
  }

  const onUpload = async () => {
    if (!uploadForm.title.trim() || !uploadForm.employeeId || !uploadForm.file) {
      return setToast({ type: 'error', message: 'Title, employee, and file are required' })
    }
    const formData = new FormData()
    formData.append('title', uploadForm.title)
    formData.append('employeeId', uploadForm.employeeId)
    formData.append('category', uploadForm.category)
    formData.append('documentNumber', uploadForm.documentNumber)
    formData.append('notes', uploadForm.notes)
    formData.append('issueDate', uploadForm.issueDate)
    formData.append('expiryDate', uploadForm.expiryDate)
    formData.append('status', uploadForm.status)
    formData.append('file', uploadForm.file)

    setSubmitting(true)
    try {
      await uploadManagerDocument(formData)
      setToast({ type: 'success', message: 'Document uploaded' })
      setUploadForm({
        title: '',
        employeeId: '',
        category: 'other',
        documentNumber: '',
        notes: '',
        issueDate: '',
        expiryDate: '',
        status: 'active',
        file: null
      })
      await loadDocuments()
      setActiveTab('Team Documents')
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Upload failed' })
    } finally {
      setSubmitting(false)
    }
  }

  const onCreateRequest = async () => {
    if (!requestForm.employeeId || !requestForm.title.trim()) {
      return setToast({ type: 'error', message: 'Employee and title are required' })
    }
    setSubmitting(true)
    try {
      await createManagerDocumentRequest(requestForm)
      setToast({ type: 'success', message: 'Document request sent to employee' })
      setRequestForm({ employeeId: '', title: '', description: '', requiredBy: '' })
      await loadRequests()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to create request' })
    } finally {
      setSubmitting(false)
    }
  }

  const onUploadMyDocument = async () => {
    if (!myUploadForm.title.trim() || !myUploadForm.file) {
      return setToast({ type: 'error', message: 'Title and file are required' })
    }
    const formData = new FormData()
    formData.append('title', myUploadForm.title)
    formData.append('category', myUploadForm.category)
    formData.append('documentNumber', myUploadForm.documentNumber)
    formData.append('notes', myUploadForm.notes)
    formData.append('issueDate', myUploadForm.issueDate)
    formData.append('expiryDate', myUploadForm.expiryDate)
    formData.append('status', myUploadForm.status)
    formData.append('file', myUploadForm.file)

    setSubmitting(true)
    try {
      await uploadManagerMyDocument(formData)
      setToast({ type: 'success', message: 'My document uploaded successfully' })
      setMyUploadForm({
        title: '',
        category: 'other',
        documentNumber: '',
        notes: '',
        issueDate: '',
        expiryDate: '',
        status: 'active',
        file: null
      })
      await loadMyDocuments()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Upload failed' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Documents"
        description="Manage team documents, uploads, and employee document requests."
        breadcrumb={['Manager Portal', 'Documents']}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel">
        <div className="workspace-nav">
          {tabs.map((tab) => (
            <button key={tab} className={`chip-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>

        <div className="filters-row admin-filters-grid" style={{ marginTop: 10 }}>
          <div className="search-wrap"><label>Search</label><SearchBar value={search} onChange={setSearch} placeholder="Search by title, employee, category" /></div>
          <FilterDropdown label="Category" value={category} onChange={setCategory} options={categoryOptions} />
          <FilterDropdown
            label="Status"
            value={status}
            onChange={setStatus}
            options={[{ value: 'all', label: 'All Status' }, { value: 'active', label: 'Active' }, { value: 'expired', label: 'Expired' }, { value: 'pending', label: 'Pending' }]}
          />
        </div>

        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={loadAll}>Filter</Button>
          <Button variant="ghost" onClick={loadAll}><RefreshCw size={14} /> Refresh</Button>
        </div>
      </div>

      {activeTab === 'Upload Team Document' ? (
        <div className="panel">
          <div className="panel-head"><h3>Upload Team Document</h3></div>
          <div className="modal-form">
            <label className="form-input-wrap"><span>Title</span><input className="form-input" value={uploadForm.title} onChange={(e) => setUploadForm((p) => ({ ...p, title: e.target.value }))} /></label>
            <FilterDropdown label="Employee" value={uploadForm.employeeId} onChange={(value) => setUploadForm((p) => ({ ...p, employeeId: value }))} options={employeeOptions} />
            <FilterDropdown label="Category" value={uploadForm.category} onChange={(value) => setUploadForm((p) => ({ ...p, category: value }))} options={categoryOptions.filter((x) => x.value !== 'all')} />
            <label className="form-input-wrap"><span>Document Number</span><input className="form-input" value={uploadForm.documentNumber} onChange={(e) => setUploadForm((p) => ({ ...p, documentNumber: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Issue Date</span><input className="form-input" type="date" value={uploadForm.issueDate} onChange={(e) => setUploadForm((p) => ({ ...p, issueDate: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Expiry Date</span><input className="form-input" type="date" value={uploadForm.expiryDate} onChange={(e) => setUploadForm((p) => ({ ...p, expiryDate: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Notes</span><textarea className="form-input" rows={3} value={uploadForm.notes} onChange={(e) => setUploadForm((p) => ({ ...p, notes: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>File (Max 10MB: PDF/DOC/DOCX/PNG/JPG/WEBP)</span><input className="form-input" type="file" onChange={(e) => setUploadForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} /></label>
            <div className="actions-row">
              <Button onClick={onUpload} disabled={submitting}>{submitting ? 'Uploading...' : 'Upload'}</Button>
              <Button variant="ghost" onClick={() => setUploadForm({ title: '', employeeId: '', category: 'other', documentNumber: '', notes: '', issueDate: '', expiryDate: '', status: 'active', file: null })}>Cancel</Button>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'Document Requests' ? (
        <div className="panel">
          <div className="panel-head"><h3>Document Requests</h3></div>
          <div className="modal-form" style={{ marginBottom: 14 }}>
            <FilterDropdown label="Employee" value={requestForm.employeeId} onChange={(value) => setRequestForm((p) => ({ ...p, employeeId: value }))} options={employeeOptions} />
            <label className="form-input-wrap"><span>Request Title</span><input className="form-input" value={requestForm.title} onChange={(e) => setRequestForm((p) => ({ ...p, title: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Description</span><textarea className="form-input" rows={3} value={requestForm.description} onChange={(e) => setRequestForm((p) => ({ ...p, description: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Required By</span><input className="form-input" type="date" value={requestForm.requiredBy} onChange={(e) => setRequestForm((p) => ({ ...p, requiredBy: e.target.value }))} /></label>
            <div className="actions-row">
              <Button onClick={onCreateRequest} disabled={submitting}>{submitting ? 'Sending...' : 'Request Document'}</Button>
              <Button variant="ghost" onClick={loadRequests}>Track Request</Button>
            </div>
          </div>
          {loading ? <LoadingSkeleton rows={6} /> : requests.length === 0 ? <EmptyState title="No requests yet" description="Document requests will appear here." /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Required By</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((row) => (
                    <tr key={row.id}>
                      <td>{row.employeeName}</td>
                      <td>{row.title}</td>
                      <td>{row.description || '-'}</td>
                      <td>{row.requiredBy ? String(row.requiredBy).slice(0, 10) : '-'}</td>
                      <td><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                      <td>{row.createdAt ? String(row.createdAt).slice(0, 10) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === 'My Documents' ? (
        <div className="panel">
          <div className="panel-head"><h3>My Documents (Private: Only You, HR, Admin)</h3></div>
          <div className="modal-form" style={{ marginBottom: 14 }}>
            <label className="form-input-wrap"><span>Title</span><input className="form-input" value={myUploadForm.title} onChange={(e) => setMyUploadForm((p) => ({ ...p, title: e.target.value }))} /></label>
            <FilterDropdown label="Category" value={myUploadForm.category} onChange={(value) => setMyUploadForm((p) => ({ ...p, category: value }))} options={categoryOptions.filter((x) => x.value !== 'all')} />
            <label className="form-input-wrap"><span>Document Number</span><input className="form-input" value={myUploadForm.documentNumber} onChange={(e) => setMyUploadForm((p) => ({ ...p, documentNumber: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Issue Date</span><input className="form-input" type="date" value={myUploadForm.issueDate} onChange={(e) => setMyUploadForm((p) => ({ ...p, issueDate: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Expiry Date</span><input className="form-input" type="date" value={myUploadForm.expiryDate} onChange={(e) => setMyUploadForm((p) => ({ ...p, expiryDate: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Notes</span><textarea className="form-input" rows={3} value={myUploadForm.notes} onChange={(e) => setMyUploadForm((p) => ({ ...p, notes: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>File (Max 10MB: PDF/DOC/DOCX/PNG/JPG/WEBP)</span><input className="form-input" type="file" onChange={(e) => setMyUploadForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} /></label>
            <div className="actions-row">
              <Button onClick={onUploadMyDocument} disabled={submitting}>{submitting ? 'Uploading...' : 'Upload My Document'}</Button>
              <Button variant="ghost" onClick={loadMyDocuments}>Refresh My Documents</Button>
            </div>
          </div>
          {loading ? <LoadingSkeleton rows={6} /> : filteredMyDocuments.length === 0 ? <EmptyState title="No private documents" description="Upload your personal manager documents here." /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Uploaded</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMyDocuments.map((row) => (
                    <tr key={row.id}>
                      <td>{row.title}</td>
                      <td>{row.category}</td>
                      <td><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                      <td>{row.createdAt ? String(row.createdAt).slice(0, 10) : '-'}</td>
                      <td>
                        <div className="table-actions">
                          <button className="text-btn" onClick={() => onView(row)}>View</button>
                          <button className="text-btn" onClick={() => onDownload(row)}>Download</button>
                          <button className="text-btn danger" onClick={() => onDelete(row)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === 'Team Documents' ? (
        <div className="panel">
          <div className="panel-head"><h3>Team Documents</h3></div>
          {loading ? <LoadingSkeleton rows={8} /> : filteredDocuments.length === 0 ? <EmptyState title="No team documents" description="Uploaded team documents will appear here." /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Employee</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Uploaded</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((row) => (
                    <tr key={row.id}>
                      <td>{row.title}</td>
                      <td>{row.employeeName}</td>
                      <td>{row.category}</td>
                      <td><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                      <td>{row.createdAt ? String(row.createdAt).slice(0, 10) : '-'}</td>
                      <td>
                        <div className="table-actions">
                          <button className="text-btn" onClick={() => onView(row)}>View</button>
                          <button className="text-btn" onClick={() => onDownload(row)}>Download</button>
                          <button className="text-btn" onClick={() => onDownload(row)}>Preview</button>
                          <button className="text-btn danger" onClick={() => onDelete(row)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      <Modal open={viewOpen} title="Document Details" onClose={() => setViewOpen(false)}>
        {!selected ? <EmptyState title="No document selected" description="Select a document to view details." /> : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Title:</strong> <span>{selected.title}</span></div>
            <div className="inline-action-card"><strong>Employee:</strong> <span>{selected.employeeName}</span></div>
            <div className="inline-action-card"><strong>Category:</strong> <span>{selected.category}</span></div>
            <div className="inline-action-card"><strong>Document Number:</strong> <span>{selected.documentNumber || '-'}</span></div>
            <div className="inline-action-card"><strong>Issue Date:</strong> <span>{selected.issueDate ? String(selected.issueDate).slice(0, 10) : '-'}</span></div>
            <div className="inline-action-card"><strong>Expiry Date:</strong> <span>{selected.expiryDate ? String(selected.expiryDate).slice(0, 10) : '-'}</span></div>
            <div className="inline-action-card"><strong>Status:</strong> <span>{selected.status}</span></div>
            <div className="inline-action-card"><strong>Notes:</strong> <span>{selected.notes || '-'}</span></div>
            <div className="actions-row">
              <Button onClick={() => onDownload(selected)}>Download</Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

export default ManagerDocumentsPage

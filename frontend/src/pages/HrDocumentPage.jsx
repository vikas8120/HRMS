import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import SearchBar from '../components/ui/SearchBar'
import FilterDropdown from '../components/ui/FilterDropdown'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import FormInput from '../components/ui/FormInput'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import DataTable from '../components/ui/DataTable'
import {
  archiveDocument,
  createDocument,
  deleteDocument,
  listDocuments,
  uploadDocumentFile,
  updateDocument,
  verifyDocument
} from '../api/adminDocumentApi'

const resetForm = () => ({
  title: '',
  employeeId: '',
  category: 'other',
  documentNumber: '',
  fileUrl: '',
  notes: '',
  issueDate: '',
  expiryDate: '',
  status: 'active'
})

function HrDocumentPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [employeeId, setEmployeeId] = useState('all')
  const [toast, setToast] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(resetForm())
  const [selected, setSelected] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  const getPublicFileUrl = (value) => {
    if (!value) return ''
    if (String(value).startsWith('http://') || String(value).startsWith('https://')) return value
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
    const origin = apiBase.replace(/\/api\/?$/, '')
    return `${origin}${value.startsWith('/') ? value : `/${value}`}`
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await listDocuments({ search, category, status, employeeId, archived: 'false' })
      setItems(res?.items || [])
      setEmployees(res?.employees || [])
    } catch (error) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Failed to load documents' })
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(timer)
  }, [toast])

  const rows = useMemo(() => items.map((x) => ({
    id: x.id,
    title: x.title,
    employee: x.employeeName || '-',
    category: x.category,
    status: x.status,
    verified: x.verified ? 'active' : 'inactive',
    expiryDate: x.expiryDate ? String(x.expiryDate).slice(0, 10) : '-'
  })), [items])

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'employee', label: 'Employee' },
    { key: 'category', label: 'Category' },
    { key: 'status', label: 'Status' },
    { key: 'verified', label: 'Verified' },
    { key: 'expiryDate', label: 'Expiry Date' }
  ]

  const employeeOptions = [{ value: 'all', label: 'All Employees' }, ...employees.map((x) => ({ value: x.id, label: x.name }))]

  const openCreate = () => {
    setSelected(null)
    setForm(resetForm())
    setModalOpen(true)
  }

  const openEdit = (row) => {
    const found = items.find((x) => x.id === row.id)
    if (!found) return
    setSelected(found)
    setForm({
      title: found.title || '',
      employeeId: found.employeeId || '',
      category: found.category || 'other',
      documentNumber: found.documentNumber || '',
      fileUrl: found.fileUrl || '',
      notes: found.notes || '',
      issueDate: found.issueDate ? String(found.issueDate).slice(0, 10) : '',
      expiryDate: found.expiryDate ? String(found.expiryDate).slice(0, 10) : '',
      status: found.status || 'active'
    })
    setModalOpen(true)
  }

  const openView = (row) => {
    openEdit(row)
  }

  const save = async () => {
    if (!form.title.trim() || !form.employeeId) {
      setToast({ type: 'error', message: 'Title and employee are required' })
      return
    }

    try {
      const payload = {
        ...form,
        issueDate: form.issueDate || null,
        expiryDate: form.expiryDate || null
      }
      if (selected?.id) {
        await updateDocument(selected.id, payload)
      } else {
        await createDocument(payload)
      }
      setModalOpen(false)
      setToast({ type: 'success', message: selected ? 'Document updated' : 'Document created' })
      await load()
    } catch (error) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Save failed' })
    }
  }

  const onFilePicked = async (event) => {
    const file = event?.target?.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadDocumentFile(file)
      const nextUrl = res?.file?.fileUrl || ''
      setForm((p) => ({ ...p, fileUrl: nextUrl }))
      setToast({ type: 'success', message: 'File uploaded and linked' })
    } catch (error) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'File upload failed' })
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Document"
        description="Manage employee documents with verification, status tracking, and archival controls."
        breadcrumb={['HR Portal', 'Document']}
        primaryActionLabel="Add Document"
        onPrimaryAction={openCreate}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder="Search title, employee, url" />
          </div>
          <FilterDropdown
            label="Employee"
            value={employeeId}
            onChange={setEmployeeId}
            options={employeeOptions}
          />
          <FilterDropdown
            label="Category"
            value={category}
            onChange={setCategory}
            options={[
              { value: 'all', label: 'All' },
              { value: 'id-proof', label: 'ID Proof' },
              { value: 'address-proof', label: 'Address Proof' },
              { value: 'education', label: 'Education' },
              { value: 'experience', label: 'Experience' },
              { value: 'tax', label: 'Tax' },
              { value: 'bank', label: 'Bank' },
              { value: 'other', label: 'Other' }
            ]}
          />
          <FilterDropdown
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'expired', label: 'Expired' }
            ]}
          />
          <div className="actions-row"><Button variant="ghost" onClick={load}>Apply</Button></div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Employee Documents</h3></div>
        {loading ? <LoadingSkeleton rows={6} /> : rows.length === 0 ? <EmptyState title="No documents found" /> : (
          <DataTable
            columns={columns}
            rows={rows}
            onView={openView}
            onEdit={openEdit}
            onDelete={(row) => {
              const found = items.find((x) => x.id === row.id)
              if (!found) return
              setSelected(found)
              setConfirmOpen(true)
            }}
          />
        )}
      </div>

      <div className="panel">
        <h3>Quick Actions</h3>
        <div className="actions-row">
          {items.slice(0, 6).map((x) => (
            <div key={x.id} className="inline-action-card">
              <span>{x.title}</span>
              <div className="actions-row">
                <Button variant="ghost" onClick={async () => { await verifyDocument(x.id); setToast({ type: 'success', message: 'Document verified' }); load() }}>Verify</Button>
                <Button variant="ghost" onClick={async () => { await archiveDocument(x.id); setToast({ type: 'success', message: 'Document archived' }); load() }}>Archive</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={modalOpen} title={selected ? 'Edit Document' : 'Add Document'} onClose={() => setModalOpen(false)}>
        <div className="form-grid">
          <FormInput label="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          <FilterDropdown
            label="Employee"
            value={form.employeeId}
            onChange={(value) => setForm((p) => ({ ...p, employeeId: value }))}
            options={employees.map((x) => ({ value: x.id, label: x.name }))}
          />
          <FilterDropdown
            label="Category"
            value={form.category}
            onChange={(value) => setForm((p) => ({ ...p, category: value }))}
            options={[
              { value: 'id-proof', label: 'ID Proof' },
              { value: 'address-proof', label: 'Address Proof' },
              { value: 'education', label: 'Education' },
              { value: 'experience', label: 'Experience' },
              { value: 'tax', label: 'Tax' },
              { value: 'bank', label: 'Bank' },
              { value: 'other', label: 'Other' }
            ]}
          />
          <FormInput label="Document Number" value={form.documentNumber} onChange={(e) => setForm((p) => ({ ...p, documentNumber: e.target.value }))} />
          <FormInput label="File URL" value={form.fileUrl} onChange={(e) => setForm((p) => ({ ...p, fileUrl: e.target.value }))} />
          <div className="form-input">
            <label htmlFor="document-file-upload">Upload File</label>
            <input
              id="document-file-upload"
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
              onChange={onFilePicked}
            />
            {uploading ? <small>Uploading...</small> : null}
            {form.fileUrl ? (
              <small>
                <a href={getPublicFileUrl(form.fileUrl)} target="_blank" rel="noreferrer">Open uploaded file</a>
              </small>
            ) : null}
          </div>
          <FormInput label="Issue Date" type="date" value={form.issueDate} onChange={(e) => setForm((p) => ({ ...p, issueDate: e.target.value }))} />
          <FormInput label="Expiry Date" type="date" value={form.expiryDate} onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))} />
          <FilterDropdown
            label="Status"
            value={form.status}
            onChange={(value) => setForm((p) => ({ ...p, status: value }))}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'expired', label: 'Expired' }
            ]}
          />
          <FormInput label="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
        </div>

        <div className="actions-row">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Document"
        message={`Delete "${selected?.title || 'this document'}"?`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (!selected?.id) return
          await deleteDocument(selected.id)
          setConfirmOpen(false)
          setSelected(null)
          setToast({ type: 'success', message: 'Document deleted' })
          await load()
        }}
      />
    </section>
  )
}

export default HrDocumentPage

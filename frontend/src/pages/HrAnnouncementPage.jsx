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
  acknowledgeAnnouncement,
  archiveAnnouncement,
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement
} from '../api/adminAnnouncementApi'

const resetForm = () => ({
  title: '',
  message: '',
  audience: 'all',
  priority: 'normal',
  pinned: false,
  publishAt: '',
  status: 'published'
})

function HrAnnouncementPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [audience, setAudience] = useState('all')
  const [status, setStatus] = useState('all')
  const [toast, setToast] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(resetForm())
  const [selected, setSelected] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await listAnnouncements({ search, audience, status, archived: 'false' })
      setItems(res?.items || [])
    } catch (error) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Failed to load announcements' })
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  const rows = useMemo(() => items.map((x) => ({
    id: x.id,
    title: x.title,
    audience: x.audience,
    priority: x.priority,
    status: x.status,
    pinned: x.pinned ? 'active' : 'inactive',
    publishAt: x.publishAt ? new Date(x.publishAt).toLocaleString() : '-',
    acks: String(x.acknowledgements?.length || 0)
  })), [items])

  const cols = [
    { key: 'title', label: 'Title' },
    { key: 'audience', label: 'Audience' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
    { key: 'pinned', label: 'Pinned' },
    { key: 'publishAt', label: 'Publish At' },
    { key: 'acks', label: 'Acks' }
  ]

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
      message: found.message || '',
      audience: found.audience || 'all',
      priority: found.priority || 'normal',
      pinned: Boolean(found.pinned),
      publishAt: found.publishAt ? String(found.publishAt).slice(0, 16) : '',
      status: found.status || 'published'
    })
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      setToast({ type: 'error', message: 'Title and message are required' })
      return
    }
    try {
      const payload = { ...form, publishAt: form.publishAt || null }
      if (selected?.id) {
        await updateAnnouncement(selected.id, payload)
      } else {
        await createAnnouncement(payload)
      }
      setToast({ type: 'success', message: selected ? 'Announcement updated' : 'Announcement created' })
      setModalOpen(false)
      await load()
    } catch (error) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Save failed' })
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Announcement"
        description="Create and manage internal announcements with audience, priority, scheduling and acknowledgement tracking."
        breadcrumb={['HR Portal', 'Announcement']}
        primaryActionLabel="Create Announcement"
        onPrimaryAction={openCreate}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder="Search title/message" />
          </div>
          <FilterDropdown label="Audience" value={audience} onChange={setAudience} options={[{ value: 'all', label: 'All' }, { value: 'hr', label: 'HR' }, { value: 'manager', label: 'Manager' }, { value: 'employee', label: 'Employee' }]} />
          <FilterDropdown label="Status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All' }, { value: 'draft', label: 'Draft' }, { value: 'scheduled', label: 'Scheduled' }, { value: 'published', label: 'Published' }]} />
          <div className="actions-row"><Button variant="ghost" onClick={load}>Apply</Button></div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Announcements</h3></div>
        {loading ? <LoadingSkeleton rows={6} /> : rows.length === 0 ? <EmptyState title="No announcements found" /> : (
          <DataTable
            columns={cols}
            rows={rows}
            onView={(row) => {
              const found = items.find((x) => x.id === row.id)
              if (!found) return
              setSelected(found)
              setForm({
                title: found.title || '',
                message: found.message || '',
                audience: found.audience || 'all',
                priority: found.priority || 'normal',
                pinned: Boolean(found.pinned),
                publishAt: found.publishAt ? String(found.publishAt).slice(0, 16) : '',
                status: found.status || 'published'
              })
              setModalOpen(true)
            }}
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
                <Button variant="ghost" onClick={async () => { await acknowledgeAnnouncement(x.id); setToast({ type: 'success', message: 'Acknowledged' }); load() }}>Acknowledge</Button>
                <Button variant="ghost" onClick={async () => { await archiveAnnouncement(x.id); setToast({ type: 'success', message: 'Archived' }); load() }}>Archive</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={modalOpen} title={selected ? 'Edit Announcement' : 'Create Announcement'} onClose={() => setModalOpen(false)}>
        <div className="form-grid">
          <FormInput label="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          <FormInput label="Message" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} />
          <FilterDropdown label="Audience" value={form.audience} onChange={(v) => setForm((p) => ({ ...p, audience: v }))} options={[{ value: 'all', label: 'All' }, { value: 'hr', label: 'HR' }, { value: 'manager', label: 'Manager' }, { value: 'employee', label: 'Employee' }]} />
          <FilterDropdown label="Priority" value={form.priority} onChange={(v) => setForm((p) => ({ ...p, priority: v }))} options={[{ value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
          <FilterDropdown label="Status" value={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v }))} options={[{ value: 'draft', label: 'Draft' }, { value: 'scheduled', label: 'Scheduled' }, { value: 'published', label: 'Published' }]} />
          <FormInput label="Publish At" type="datetime-local" value={form.publishAt} onChange={(e) => setForm((p) => ({ ...p, publishAt: e.target.value }))} />
          <FilterDropdown label="Pinned" value={form.pinned ? 'yes' : 'no'} onChange={(v) => setForm((p) => ({ ...p, pinned: v === 'yes' }))} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
        </div>
        <div className="actions-row">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Announcement"
        message={`Delete "${selected?.title || 'this announcement'}"?`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (!selected?.id) return
          await deleteAnnouncement(selected.id)
          setConfirmOpen(false)
          setSelected(null)
          setToast({ type: 'success', message: 'Announcement deleted' })
          await load()
        }}
      />
    </section>
  )
}

export default HrAnnouncementPage

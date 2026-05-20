import { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Modal from '../../components/ui/Modal'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import {
  addManagerMeetingNotes,
  createManagerMeeting,
  deleteManagerMeeting,
  getManagerMeetingById,
  getManagerMeetings,
  updateManagerMeeting
} from '../../api/managerMeetingsApi'
import { getManagerTeam } from '../../api/managerTeamApi'

const tabs = ['Schedule Meeting', 'Upcoming Meetings', 'Meeting History', 'Meeting Notes']

const initialForm = {
  title: '',
  date: '',
  startTime: '',
  endTime: '',
  participants: [],
  agenda: '',
  location: '',
  meetingLink: '',
  sendInvite: true
}

const formatDate = (value) => {
  const d = new Date(value || '')
  if (Number.isNaN(d.getTime())) return '-'
  return d.toISOString().slice(0, 10)
}

function ManagerMeetingsPage() {
  const [activeTab, setActiveTab] = useState('Schedule Meeting')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [meetings, setMeetings] = useState([])
  const [team, setTeam] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [toast, setToast] = useState(null)
  const [selected, setSelected] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [notesText, setNotesText] = useState('')

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  const loadTeam = async () => {
    try {
      const data = await getManagerTeam()
      setTeam(data?.data || [])
    } catch (_err) {
      setTeam([])
    }
  }

  const loadMeetings = async () => {
    setLoading(true)
    try {
      const payload = await getManagerMeetings({ status: statusFilter, search })
      setMeetings(payload?.data || [])
    } catch (err) {
      setMeetings([])
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to load meetings' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTeam() }, [])
  useEffect(() => { loadMeetings() }, [statusFilter])

  const visibleRows = useMemo(() => {
    const now = Date.now()
    const searched = meetings.filter((m) => `${m.title} ${m.agenda} ${m.location}`.toLowerCase().includes(search.trim().toLowerCase()))
    if (activeTab === 'Upcoming Meetings') return searched.filter((m) => m.status === 'scheduled' && new Date(`${m.date}T${m.endTime}:00`).getTime() >= now)
    if (activeTab === 'Meeting History') return searched.filter((m) => m.status === 'completed' || new Date(`${m.date}T${m.endTime}:00`).getTime() < now || m.status === 'cancelled')
    if (activeTab === 'Meeting Notes') return searched.filter((m) => Array.isArray(m.notes) && m.notes.length)
    return searched
  }, [meetings, search, activeTab])

  const employeeOptions = team.map((x) => ({ value: String(x.employeeId || x.id), label: `${x.name} (${x.email})` }))

  const openCreate = () => {
    setIsEdit(false)
    setSelected(null)
    setForm(initialForm)
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setIsEdit(true)
    setSelected(row)
    setForm({
      title: row.title || '',
      date: row.date ? String(row.date).slice(0, 10) : '',
      startTime: row.startTime || '',
      endTime: row.endTime || '',
      participants: (row.participants || []).map((p) => String(p.employeeId)),
      agenda: row.agenda || '',
      location: row.location || '',
      meetingLink: row.meetingLink || '',
      sendInvite: true
    })
    setFormOpen(true)
  }

  const onSaveMeeting = async () => {
    if (!form.title.trim()) return setToast({ type: 'error', message: 'Title is required' })
    if (!form.date || !form.startTime || !form.endTime) return setToast({ type: 'error', message: 'Date and time are required' })
    if (form.endTime <= form.startTime) return setToast({ type: 'error', message: 'End time must be after start time' })
    if (!form.participants.length) return setToast({ type: 'error', message: 'Add at least one employee' })
    if (form.meetingLink && !/^https?:\/\//i.test(form.meetingLink.trim())) {
      return setToast({ type: 'error', message: 'Meeting link must start with http:// or https://' })
    }

    const payload = {
      title: form.title,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      participants: form.participants,
      agenda: form.agenda,
      location: form.location,
      meetingLink: form.meetingLink,
      sendInvite: Boolean(form.sendInvite)
    }

    setSubmitting(true)
    try {
      if (isEdit && selected?.id) {
        await updateManagerMeeting(selected.id, payload)
      } else {
        await createManagerMeeting(payload)
      }
      setFormOpen(false)
      setToast({ type: 'success', message: isEdit ? 'Meeting updated successfully' : form.sendInvite ? 'Meeting created and invite sent' : 'Meeting created successfully' })
      await loadMeetings()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to save meeting' })
    } finally {
      setSubmitting(false)
    }
  }

  const onCancelMeeting = async (row) => {
    if (!window.confirm(`Cancel meeting "${row.title}"?`)) return
    setSubmitting(true)
    try {
      await deleteManagerMeeting(row.id)
      setToast({ type: 'success', message: 'Meeting cancelled' })
      await loadMeetings()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to cancel meeting' })
    } finally {
      setSubmitting(false)
    }
  }

  const onView = async (row) => {
    try {
      const payload = await getManagerMeetingById(row.id)
      setSelected(payload?.data || row)
      setViewOpen(true)
    } catch (_err) {
      setSelected(row)
      setViewOpen(true)
    }
  }

  const onAddNotes = async () => {
    if (!selected?.id || !notesText.trim()) return
    setSubmitting(true)
    try {
      await addManagerMeetingNotes(selected.id, notesText.trim())
      setNotesOpen(false)
      setNotesText('')
      setToast({ type: 'success', message: 'Meeting notes added' })
      await loadMeetings()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to add notes' })
    } finally {
      setSubmitting(false)
    }
  }

  const onJoinMeeting = (row) => {
    if (!row.meetingLink) return setToast({ type: 'error', message: 'No meeting link found' })
    window.open(row.meetingLink, '_blank', 'noopener,noreferrer')
  }

  const onDownloadMinutes = (row) => {
    const lines = [
      `Meeting: ${row.title}`,
      `Date: ${formatDate(row.date)} ${row.startTime}-${row.endTime}`,
      `Participants: ${(row.participants || []).map((p) => p.name).join(', ') || '-'}`,
      `Agenda: ${row.agenda || '-'}`,
      '',
      'Notes:',
      ...((row.notes || []).map((n, i) => `${i + 1}. ${n.notes || ''}`))
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meeting-minutes-${row.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Meetings"
        description="Schedule and manage team meetings with notes and minutes."
        breadcrumb={['Manager Portal', 'Meetings']}
      />
      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel">
        <div className="workspace-nav">
          {tabs.map((tab) => (
            <button key={tab} className={`chip-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>
        <div className="filters-row admin-filters-grid" style={{ marginTop: 10 }}>
          <div className="search-wrap"><label>Search</label><SearchBar value={search} onChange={setSearch} placeholder="Search title, agenda, location" /></div>
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: 'all', label: 'All Status' }, { value: 'scheduled', label: 'Scheduled' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }]}
          />
        </div>
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button onClick={openCreate}>Create Meeting</Button>
          <Button variant="ghost" onClick={loadMeetings}><RefreshCw size={14} /> Refresh</Button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>{activeTab}</h3></div>
        {loading ? <LoadingSkeleton rows={8} /> : visibleRows.length === 0 ? (
          <EmptyState title="No meetings found" description="Meeting records will appear here once created." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Participants</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{formatDate(row.date)}</td>
                    <td>{row.startTime} - {row.endTime}</td>
                    <td>{(row.participants || []).map((p) => p.name).join(', ') || '-'}</td>
                    <td>{row.location || '-'}</td>
                    <td><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="text-btn" onClick={() => onView(row)}>View</button>
                        <button className="text-btn" onClick={() => openEdit(row)}>Edit</button>
                        <button className="text-btn danger" onClick={() => onCancelMeeting(row)}>Cancel Meeting</button>
                        <button className="text-btn" onClick={() => onJoinMeeting(row)}>Join Meeting</button>
                        <button className="text-btn" onClick={() => { setSelected(row); setNotesText(''); setNotesOpen(true) }}>Add Notes</button>
                        <button className="text-btn" onClick={() => onDownloadMinutes(row)}><Download size={12} /> Download Minutes</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={formOpen} title={isEdit ? 'Edit Meeting' : 'Schedule Meeting'} onClose={() => setFormOpen(false)}>
        <div className="modal-form">
          <label className="form-input-wrap"><span>Title</span><input className="form-input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></label>
          <label className="form-input-wrap"><span>Date</span><input className="form-input" type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} /></label>
          <div className="filters-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label className="form-input-wrap"><span>Start Time</span><input className="form-input" type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>End Time</span><input className="form-input" type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} /></label>
          </div>
          <label className="form-input-wrap">
            <span>Participants (Add Employees)</span>
            <select className="form-input" multiple value={form.participants} onChange={(e) => {
              const values = Array.from(e.target.selectedOptions).map((o) => o.value)
              setForm((p) => ({ ...p, participants: values }))
            }}>
              {employeeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <small style={{ color: 'var(--text-muted)', marginTop: 6 }}>Hold Ctrl (Windows) or Cmd (Mac) to select multiple employees.</small>
          </label>
          <label className="form-input-wrap"><span>Agenda</span><textarea className="form-input" rows={3} value={form.agenda} onChange={(e) => setForm((p) => ({ ...p, agenda: e.target.value }))} /></label>
          <label className="form-input-wrap"><span>Location</span><input className="form-input" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} /></label>
          <label className="form-input-wrap"><span>Meeting Link</span><input className="form-input" value={form.meetingLink} onChange={(e) => setForm((p) => ({ ...p, meetingLink: e.target.value }))} /></label>
          {!isEdit ? (
            <label className="checkbox-item">
              <input type="checkbox" checked={form.sendInvite} onChange={(e) => setForm((p) => ({ ...p, sendInvite: e.target.checked }))} />
              <span>Send invite to participants now</span>
            </label>
          ) : null}
          <div className="actions-row" style={{ position: 'sticky', bottom: 0, background: 'var(--panel-bg)', paddingTop: 8 }}>
            <Button onClick={onSaveMeeting} disabled={submitting}>{submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Meeting'}</Button>
            <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={submitting}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal open={viewOpen} title="Meeting Details" onClose={() => setViewOpen(false)}>
        {!selected ? <EmptyState title="No meeting selected" description="Select a meeting to view details." /> : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Title:</strong> <span>{selected.title}</span></div>
            <div className="inline-action-card"><strong>Date:</strong> <span>{formatDate(selected.date)}</span></div>
            <div className="inline-action-card"><strong>Time:</strong> <span>{selected.startTime} - {selected.endTime}</span></div>
            <div className="inline-action-card"><strong>Participants:</strong> <span>{(selected.participants || []).map((p) => p.name).join(', ') || '-'}</span></div>
            <div className="inline-action-card"><strong>Agenda:</strong> <span>{selected.agenda || '-'}</span></div>
            <div className="inline-action-card"><strong>Location:</strong> <span>{selected.location || '-'}</span></div>
            <div className="inline-action-card"><strong>Meeting Link:</strong> <span>{selected.meetingLink || '-'}</span></div>
            <div className="inline-action-card"><strong>Notes:</strong> <span>{(selected.notes || []).map((n) => n.notes).join(' | ') || '-'}</span></div>
          </div>
        )}
      </Modal>

      <Modal open={notesOpen} title="Add Meeting Notes" onClose={() => setNotesOpen(false)}>
        <div className="modal-form">
          <label className="form-input-wrap"><span>Notes</span><textarea className="form-input" rows={4} value={notesText} onChange={(e) => setNotesText(e.target.value)} /></label>
          <Button onClick={onAddNotes} disabled={submitting}>{submitting ? 'Saving...' : 'Add Notes'}</Button>
        </div>
      </Modal>
    </section>
  )
}

export default ManagerMeetingsPage

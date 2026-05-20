import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Modal from '../../components/ui/Modal'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import { getManagerTeam } from '../../api/managerTeamApi'
import {
  createManagerAnnouncement,
  createManagerMessage,
  deleteManagerAnnouncement,
  deleteManagerMessage,
  getManagerAnnouncements,
  getManagerMessages,
  getManagerMessageThreadById,
  replyManagerMessageThread,
  updateManagerAnnouncement
} from '../../api/managerCommunicationApi'

const tabs = ['Team Messages', 'Announcements', 'HR/Admin Messages']

function ManagerCommunicationPage() {
  const [searchParams] = useSearchParams()
  const employeeIdFromQuery = searchParams.get('employeeId') || ''
  const [activeTab, setActiveTab] = useState('Team Messages')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [threads, setThreads] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [team, setTeam] = useState([])
  const [contacts, setContacts] = useState([])
  const [search, setSearch] = useState('')
  const [unreadFilter, setUnreadFilter] = useState('all')
  const [toast, setToast] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const [composeOpen, setComposeOpen] = useState(false)
  const [threadOpen, setThreadOpen] = useState(false)
  const [announcementOpen, setAnnouncementOpen] = useState(false)
  const [selectedThread, setSelectedThread] = useState(null)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)

  const [messageForm, setMessageForm] = useState({
    threadType: 'team',
    participantIds: [],
    subject: '',
    message: '',
    attachmentUrl: '',
    attachmentName: ''
  })
  const [replyMessage, setReplyMessage] = useState('')
  const [replyAttachmentUrl, setReplyAttachmentUrl] = useState('')
  const [replyAttachmentName, setReplyAttachmentName] = useState('')

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    participantIds: [],
    attachmentName: '',
    attachmentUrl: ''
  })

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const loadTeam = async () => {
    try {
      const payload = await getManagerTeam()
      setTeam(payload?.data || [])
    } catch (_err) {
      setTeam([])
    }
  }

  const loadThreads = async (threadType = 'all') => {
    const payload = await getManagerMessages({ threadType })
    setThreads(payload?.data || [])
    setUnreadCount(Number(payload?.unreadCount || 0))
    setContacts(payload?.contacts || [])
  }

  const loadAnnouncements = async () => {
    const payload = await getManagerAnnouncements()
    setAnnouncements(payload?.data || [])
  }

  const loadAll = async () => {
    setLoading(true)
    const tasks = []
    if (activeTab === 'Announcements') {
      tasks.push(loadAnnouncements())
    } else {
      tasks.push(loadThreads(activeTab === 'HR/Admin Messages' ? 'hr-admin' : 'team'))
    }

    const results = await Promise.allSettled(tasks)
    const failed = results.find((x) => x.status === 'rejected')
    if (failed) {
      const firstError = failed.reason
      setToast({ type: 'error', message: firstError?.response?.data?.message || 'Failed to load communication data' })
    }
    setLoading(false)
  }

  useEffect(() => { loadTeam() }, [])
  useEffect(() => { loadAll() }, [activeTab])

  useEffect(() => {
    if (!employeeIdFromQuery) return
    setActiveTab('Team Messages')
    setMessageForm({
      threadType: 'team',
      participantIds: [employeeIdFromQuery],
      subject: '',
      message: '',
      attachmentUrl: '',
      attachmentName: ''
    })
    setComposeOpen(true)
  }, [employeeIdFromQuery])

  const filteredThreads = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const type = activeTab === 'HR/Admin Messages' ? 'hr-admin' : 'team'
    return threads
      .filter((t) => t.threadType === type)
      .filter((t) => unreadFilter === 'all' ? true : Number(t.unreadCount || 0) > 0)
      .filter((t) => !needle || `${t.subject} ${(t.messages || []).map((m) => m.message).join(' ')}`.toLowerCase().includes(needle))
  }, [threads, search, activeTab, unreadFilter])

  const filteredAnnouncements = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return announcements.filter((a) => !needle || `${a.title} ${a.message}`.toLowerCase().includes(needle))
  }, [announcements, search])

  const employeeOptions = team.map((x) => ({ value: String(x.employeeId || x.id), label: `${x.name} (${x.email})` }))
  const hrAdminOptions = contacts
    .filter((x) => ['hr', 'admin'].includes(String(x.role || '').toLowerCase()))
    .map((x) => ({ value: String(x.employeeId || x.id), label: `${x.name} (${x.role})` }))

  const openCompose = () => {
    setMessageForm({
      threadType: activeTab === 'HR/Admin Messages' ? 'hr-admin' : 'team',
      participantIds: [],
      subject: '',
      message: '',
      attachmentUrl: '',
      attachmentName: ''
    })
    setComposeOpen(true)
  }

  const sendMessage = async () => {
    if (!messageForm.participantIds.length || !messageForm.message.trim()) {
      return setToast({ type: 'error', message: 'Participants and message are required' })
    }
    if (messageForm.attachmentUrl && !/^https?:\/\//i.test(String(messageForm.attachmentUrl).trim())) {
      return setToast({ type: 'error', message: 'Attachment URL must start with http:// or https://' })
    }
    setSubmitting(true)
    try {
      await createManagerMessage(messageForm)
      setComposeOpen(false)
      setToast({ type: 'success', message: 'Message sent' })
      await loadThreads(activeTab === 'HR/Admin Messages' ? 'hr-admin' : 'team')
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to send message' })
    } finally {
      setSubmitting(false)
    }
  }

  const openThread = async (thread) => {
    setReplyMessage('')
    setReplyAttachmentName('')
    setReplyAttachmentUrl('')
    try {
      const payload = await getManagerMessageThreadById(thread.id)
      setSelectedThread(payload?.data || thread)
      setThreadOpen(true)
      await loadThreads(activeTab === 'HR/Admin Messages' ? 'hr-admin' : 'team')
    } catch (_err) {
      setSelectedThread(thread)
      setThreadOpen(true)
    }
  }

  const sendReply = async () => {
    if (!selectedThread?.id || !replyMessage.trim()) return
    if (replyAttachmentUrl && !/^https?:\/\//i.test(String(replyAttachmentUrl).trim())) {
      return setToast({ type: 'error', message: 'Attachment URL must start with http:// or https://' })
    }
    setSubmitting(true)
    try {
      const payload = await replyManagerMessageThread(selectedThread.id, {
        message: replyMessage,
        attachmentUrl: replyAttachmentUrl,
        attachmentName: replyAttachmentName
      })
      setSelectedThread(payload?.data || selectedThread)
      setReplyMessage('')
      setReplyAttachmentName('')
      setReplyAttachmentUrl('')
      setToast({ type: 'success', message: 'Reply sent' })
      await loadThreads(activeTab === 'HR/Admin Messages' ? 'hr-admin' : 'team')
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to send reply' })
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return
    try {
      await deleteManagerMessage(messageId)
      setToast({ type: 'success', message: 'Message deleted' })
      if (selectedThread?.id) {
        const payload = await getManagerMessageThreadById(selectedThread.id)
        setSelectedThread(payload?.data || null)
      }
      await loadThreads(activeTab === 'HR/Admin Messages' ? 'hr-admin' : 'team')
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to delete message' })
    }
  }

  const openAnnouncementEditor = (row = null) => {
    setSelectedAnnouncement(row)
    setAnnouncementForm({
      title: row?.title || '',
      message: row?.message || '',
      participantIds: (row?.participants || []).map((p) => String(p.employeeId || p.userId || p.id || '')),
      attachmentName: row?.attachments?.[0]?.name || '',
      attachmentUrl: row?.attachments?.[0]?.url || ''
    })
    setAnnouncementOpen(true)
  }

  const selectAllAnnouncementRecipients = () => {
    setAnnouncementForm((p) => ({
      ...p,
      participantIds: employeeOptions.map((opt) => opt.value)
    }))
  }

  const saveAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.message.trim() || !announcementForm.participantIds.length) {
      return setToast({ type: 'error', message: 'Title, message, and participants are required' })
    }
    if (announcementForm.attachmentUrl && !/^https?:\/\//i.test(String(announcementForm.attachmentUrl).trim())) {
      return setToast({ type: 'error', message: 'Attachment URL must start with http:// or https://' })
    }
    setSubmitting(true)
    try {
      const payload = {
        title: announcementForm.title,
        message: announcementForm.message,
        participantIds: announcementForm.participantIds,
        attachments: announcementForm.attachmentUrl ? [{ name: announcementForm.attachmentName || 'Attachment', url: announcementForm.attachmentUrl }] : []
      }
      if (selectedAnnouncement?.id) {
        await updateManagerAnnouncement(selectedAnnouncement.id, payload)
      } else {
        await createManagerAnnouncement(payload)
      }
      setAnnouncementOpen(false)
      setToast({ type: 'success', message: selectedAnnouncement?.id ? 'Announcement updated' : 'Announcement sent' })
      await loadAnnouncements()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to save announcement' })
    } finally {
      setSubmitting(false)
    }
  }

  const removeAnnouncement = async (row) => {
    if (!window.confirm(`Delete announcement "${row.title}"?`)) return
    try {
      await deleteManagerAnnouncement(row.id)
      setToast({ type: 'success', message: 'Announcement deleted' })
      await loadAnnouncements()
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to delete announcement' })
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Communication"
        description="Message your team, publish announcements, and connect with HR/Admin."
        breadcrumb={['Manager Portal', 'Communication']}
      />
      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel">
        <div className="workspace-nav">
          {tabs.map((tab) => (
            <button key={tab} className={`chip-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>
        <div className="filters-row admin-filters-grid" style={{ marginTop: 10 }}>
          <div className="search-wrap"><label>Search</label><SearchBar value={search} onChange={setSearch} placeholder="Search threads or announcements" /></div>
          <FilterDropdown
            label="Unread"
            value={unreadFilter}
            onChange={setUnreadFilter}
            options={[
              { value: 'all', label: `All Threads (Unread: ${unreadCount})` },
              { value: 'unread', label: 'Unread Only' }
            ]}
          />
        </div>
        <div className="actions-row" style={{ marginTop: 10 }}>
          {activeTab === 'Announcements' ? <Button onClick={() => openAnnouncementEditor(null)}>Create Announcement</Button> : <Button onClick={openCompose}>Send Message</Button>}
          <Button variant="ghost" onClick={loadAll}>Refresh</Button>
        </div>
      </div>

      {activeTab === 'Announcements' ? (
        <div className="panel">
          <div className="panel-head"><h3>Announcements</h3></div>
          {loading ? <LoadingSkeleton rows={8} /> : filteredAnnouncements.length === 0 ? <EmptyState title="No announcements" description="Team announcements will appear here." /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Message</th>
                    <th>Recipients</th>
                    <th>Attachment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnnouncements.map((row) => (
                    <tr key={row.id}>
                      <td>{row.title}</td>
                      <td>{row.message}</td>
                      <td>{(row.participants || []).map((p) => p.name).join(', ') || '-'}</td>
                      <td>{row.attachments?.[0]?.name || '-'}</td>
                      <td>
                        <div className="table-actions">
                          <button className="text-btn" onClick={() => openAnnouncementEditor(row)}>Edit Announcement</button>
                          <button className="text-btn danger" onClick={() => removeAnnouncement(row)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="panel">
          <div className="panel-head"><h3>{activeTab}</h3></div>
          {loading ? <LoadingSkeleton rows={8} /> : filteredThreads.length === 0 ? <EmptyState title="No threads" description="Message threads will appear here." /> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Participants</th>
                    <th>Last Message</th>
                    <th>Unread</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredThreads.map((row) => {
                    const last = row.messages?.[row.messages.length - 1]
                    return (
                      <tr key={row.id}>
                        <td>{row.subject || 'Direct Message'}</td>
                        <td>{(row.participants || []).filter((p) => p.role !== 'manager').map((p) => p.name).join(', ') || '-'}</td>
                        <td>{last?.message || '-'}</td>
                        <td><span className={`badge ${row.unreadCount ? 'badge-pending' : 'badge-approved'}`}>{row.unreadCount || 0}</span></td>
                        <td>
                          <div className="table-actions">
                            <button className="text-btn" onClick={() => openThread(row)}>View Thread</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={composeOpen} title="Send Message" onClose={() => setComposeOpen(false)}>
        <div className="modal-form">
          <label className="form-input-wrap"><span>Subject</span><input className="form-input" value={messageForm.subject} onChange={(e) => setMessageForm((p) => ({ ...p, subject: e.target.value }))} /></label>
          <label className="form-input-wrap">
            <span>Recipients</span>
            <select className="form-input" multiple value={messageForm.participantIds} onChange={(e) => setMessageForm((p) => ({ ...p, participantIds: Array.from(e.target.selectedOptions).map((x) => x.value) }))}>
              {(messageForm.threadType === 'hr-admin' ? hrAdminOptions : employeeOptions).map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </label>
          <label className="form-input-wrap"><span>Message</span><textarea className="form-input" rows={4} value={messageForm.message} onChange={(e) => setMessageForm((p) => ({ ...p, message: e.target.value }))} /></label>
          <label className="form-input-wrap"><span>Attachment Name</span><input className="form-input" value={messageForm.attachmentName} onChange={(e) => setMessageForm((p) => ({ ...p, attachmentName: e.target.value }))} /></label>
          <label className="form-input-wrap"><span>Attachment URL</span><input className="form-input" value={messageForm.attachmentUrl} onChange={(e) => setMessageForm((p) => ({ ...p, attachmentUrl: e.target.value }))} /></label>
          <div className="actions-row">
            <Button onClick={sendMessage} disabled={submitting}>{submitting ? 'Sending...' : 'Send Message'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={threadOpen} title="Message Thread" onClose={() => setThreadOpen(false)}>
        {!selectedThread ? <EmptyState title="No thread selected" description="Select a thread to view messages." /> : (
          <div className="modal-form">
            <div className="panel" style={{ padding: 10 }}>
              {(selectedThread.messages || []).map((msg) => (
                <div key={msg.id} className="inline-action-card">
                  <div><strong>Message:</strong> {msg.message}</div>
                  {msg.attachmentUrl ? <div><strong>Attachment:</strong> <a href={msg.attachmentUrl} target="_blank" rel="noreferrer">{msg.attachmentName || 'Attachment'}</a></div> : null}
                  <div className="actions-row"><button className="text-btn danger" onClick={() => onDeleteMessage(msg.id)}>Delete</button></div>
                </div>
              ))}
            </div>
            <label className="form-input-wrap"><span>Reply</span><textarea className="form-input" rows={3} value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} /></label>
            <label className="form-input-wrap"><span>Attachment Name</span><input className="form-input" value={replyAttachmentName} onChange={(e) => setReplyAttachmentName(e.target.value)} /></label>
            <label className="form-input-wrap"><span>Attachment URL</span><input className="form-input" value={replyAttachmentUrl} onChange={(e) => setReplyAttachmentUrl(e.target.value)} /></label>
            <div className="actions-row">
              <Button onClick={sendReply} disabled={submitting}>{submitting ? 'Sending...' : 'Reply'}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={announcementOpen} title={selectedAnnouncement ? 'Edit Announcement' : 'Create Announcement'} onClose={() => setAnnouncementOpen(false)}>
        <div className="modal-form">
          <label className="form-input-wrap"><span>Title</span><input className="form-input" value={announcementForm.title} onChange={(e) => setAnnouncementForm((p) => ({ ...p, title: e.target.value }))} /></label>
          <label className="form-input-wrap"><span>Message</span><textarea className="form-input" rows={4} value={announcementForm.message} onChange={(e) => setAnnouncementForm((p) => ({ ...p, message: e.target.value }))} /></label>
          <label className="form-input-wrap">
            <span>Recipients</span>
            <select className="form-input" multiple value={announcementForm.participantIds} onChange={(e) => setAnnouncementForm((p) => ({ ...p, participantIds: Array.from(e.target.selectedOptions).map((x) => x.value) }))}>
              {employeeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <small style={{ color: 'var(--text-muted)', marginTop: 6 }}>
              Hold Ctrl (Windows) or Cmd (Mac) to select multiple recipients.
            </small>
            <small style={{ color: 'var(--text-muted)', marginTop: 4 }}>
              Selected recipients: {announcementForm.participantIds.length}
            </small>
            <div className="actions-row" style={{ marginTop: 8 }}>
              <Button variant="ghost" onClick={selectAllAnnouncementRecipients}>Select All Team</Button>
              <Button variant="ghost" onClick={() => setAnnouncementForm((p) => ({ ...p, participantIds: [] }))}>Clear Recipients</Button>
            </div>
          </label>
          <label className="form-input-wrap"><span>Attach File Name</span><input className="form-input" value={announcementForm.attachmentName} onChange={(e) => setAnnouncementForm((p) => ({ ...p, attachmentName: e.target.value }))} /></label>
          <label className="form-input-wrap"><span>Attach File URL</span><input className="form-input" value={announcementForm.attachmentUrl} onChange={(e) => setAnnouncementForm((p) => ({ ...p, attachmentUrl: e.target.value }))} /></label>
          <div className="actions-row">
            <Button onClick={saveAnnouncement} disabled={submitting}>{submitting ? 'Saving...' : selectedAnnouncement ? 'Edit Announcement' : 'Send Announcement'}</Button>
            <Button variant="ghost" onClick={() => setAnnouncementOpen(false)} disabled={submitting}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default ManagerCommunicationPage

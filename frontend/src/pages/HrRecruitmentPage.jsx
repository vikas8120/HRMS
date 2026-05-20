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
  archiveRecruitmentCandidate,
  createRecruitmentCandidate,
  deleteRecruitmentCandidate,
  listRecruitmentCandidates,
  updateRecruitmentCandidate
} from '../api/adminRecruitmentApi'

const resetForm = () => ({
  fullName: '', email: '', phone: '', position: '', department: '', source: 'direct', stage: 'applied',
  experienceYears: '0', expectedCtc: '', noticePeriodDays: '0', location: '', resumeUrl: '', notes: '', interviewDate: '', joinedDate: '', assignedRecruiterId: ''
})

function HrRecruitmentPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [recruiters, setRecruiters] = useState([])
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('all')
  const [source, setSource] = useState('all')
  const [position, setPosition] = useState('all')
  const [toast, setToast] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(resetForm())
  const [selected, setSelected] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await listRecruitmentCandidates({ search, stage, source, position, archived: 'false' })
      setItems(res?.items || [])
      setRecruiters(res?.recruiters || [])
    } catch (error) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Failed to load recruitment data' })
      setItems([])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  const positionOptions = useMemo(() => [{ value: 'all', label: 'All Positions' }, ...Array.from(new Set(items.map((x) => x.position).filter(Boolean))).map((x) => ({ value: x, label: x }))], [items])

  const rows = useMemo(() => items.map((x) => ({
    id: x.id,
    fullName: x.fullName,
    position: x.position,
    stage: x.stage,
    source: x.source,
    recruiter: x.assignedRecruiterName || '-',
    interviewDate: x.interviewDate ? String(x.interviewDate).slice(0, 10) : '-'
  })), [items])

  const columns = [
    { key: 'fullName', label: 'Candidate' }, { key: 'position', label: 'Position' }, { key: 'stage', label: 'Stage' },
    { key: 'source', label: 'Source' }, { key: 'recruiter', label: 'Recruiter' }, { key: 'interviewDate', label: 'Interview' }
  ]

  const analytics = useMemo(() => {
    const total = items.length
    const hired = items.filter((x) => x.stage === 'hired').length
    const interview = items.filter((x) => x.stage === 'interview').length
    const offer = items.filter((x) => x.stage === 'offer').length
    const rejected = items.filter((x) => x.stage === 'rejected').length
    const stageBuckets = [
      { key: 'applied', label: 'Applied' },
      { key: 'screening', label: 'Screening' },
      { key: 'interview', label: 'Interview' },
      { key: 'offer', label: 'Offer' },
      { key: 'hired', label: 'Hired' },
      { key: 'rejected', label: 'Rejected' }
    ].map((stageItem) => ({
      ...stageItem,
      count: items.filter((x) => x.stage === stageItem.key).length
    }))
    return { total, hired, interview, offer, rejected, stageBuckets }
  }, [items])

  const openCreate = () => { setSelected(null); setForm(resetForm()); setModalOpen(true) }
  const openEdit = (row) => {
    const found = items.find((x) => x.id === row.id); if (!found) return
    setSelected(found)
    setForm({
      fullName: found.fullName || '', email: found.email || '', phone: found.phone || '', position: found.position || '', department: found.department || '',
      source: found.source || 'direct', stage: found.stage || 'applied', experienceYears: String(found.experienceYears || 0), expectedCtc: found.expectedCtc || '',
      noticePeriodDays: String(found.noticePeriodDays || 0), location: found.location || '', resumeUrl: found.resumeUrl || '', notes: found.notes || '',
      interviewDate: found.interviewDate ? String(found.interviewDate).slice(0, 10) : '', joinedDate: found.joinedDate ? String(found.joinedDate).slice(0, 10) : '',
      assignedRecruiterId: found.assignedRecruiterId || ''
    })
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.position.trim()) {
      setToast({ type: 'error', message: 'Name, email and position are required' }); return
    }
    const payload = { ...form, experienceYears: Number(form.experienceYears || 0), noticePeriodDays: Number(form.noticePeriodDays || 0), interviewDate: form.interviewDate || null, joinedDate: form.joinedDate || null, assignedRecruiterId: form.assignedRecruiterId || null }
    try {
      setSaving(true)
      if (selected?.id) await updateRecruitmentCandidate(selected.id, payload)
      else await createRecruitmentCandidate(payload)
      setModalOpen(false); setToast({ type: 'success', message: selected ? 'Candidate updated' : 'Candidate added' }); await load()
    } catch (error) {
      const statusCode = error?.response?.status
      if (statusCode === 404) {
        setToast({ type: 'error', message: 'Recruitment API route not found. Restart backend and try again.' })
      } else {
        setToast({ type: 'error', message: error?.response?.data?.message || 'Save failed' })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="section-layout">
      <PageHeader title="Recruitment" description="Manage candidate pipeline from application to hiring." breadcrumb={['HR Portal', 'Recruitment']} primaryActionLabel="Add Candidate" onPrimaryAction={openCreate} />
      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <div className="search-wrap"><label>Search</label><SearchBar value={search} onChange={setSearch} placeholder="Search name/email/position" /></div>
          <FilterDropdown label="Stage" value={stage} onChange={setStage} options={[{ value: 'all', label: 'All' }, { value: 'applied', label: 'Applied' }, { value: 'screening', label: 'Screening' }, { value: 'interview', label: 'Interview' }, { value: 'offer', label: 'Offer' }, { value: 'hired', label: 'Hired' }, { value: 'rejected', label: 'Rejected' }]} />
          <FilterDropdown label="Source" value={source} onChange={setSource} options={[{ value: 'all', label: 'All' }, { value: 'direct', label: 'Direct' }, { value: 'referral', label: 'Referral' }, { value: 'job-portal', label: 'Job Portal' }, { value: 'agency', label: 'Agency' }, { value: 'campus', label: 'Campus' }]} />
          <FilterDropdown label="Position" value={position} onChange={setPosition} options={positionOptions} />
          <div className="actions-row"><Button variant="ghost" onClick={load}>Apply</Button></div>
        </div>
      </div>

      <div className="panel" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.14), rgba(34,197,94,0.14))', border: '1px solid rgba(59,130,246,0.2)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
          <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 12, padding: 14, color: '#0f172a' }}><p style={{ margin: 0, color: '#334155', fontWeight: 600 }}>Total Candidates</p><h3 style={{ margin: '6px 0 0 0', fontSize: 28, color: '#0f172a' }}>{analytics.total}</h3></div>
          <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 12, padding: 14, color: '#0f172a' }}><p style={{ margin: 0, color: '#334155', fontWeight: 600 }}>In Interview</p><h3 style={{ margin: '6px 0 0 0', fontSize: 28, color: '#0f172a' }}>{analytics.interview}</h3></div>
          <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 12, padding: 14, color: '#0f172a' }}><p style={{ margin: 0, color: '#334155', fontWeight: 600 }}>Offers</p><h3 style={{ margin: '6px 0 0 0', fontSize: 28, color: '#0f172a' }}>{analytics.offer}</h3></div>
          <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 12, padding: 14, color: '#0f172a' }}><p style={{ margin: 0, color: '#334155', fontWeight: 600 }}>Hired</p><h3 style={{ margin: '6px 0 0 0', fontSize: 28, color: '#0f172a' }}>{analytics.hired}</h3></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          {analytics.stageBuckets.map((bucket) => (
            <div key={bucket.key} style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(148,163,184,0.36)', borderRadius: 10, padding: 10, color: '#0f172a' }}>
              <p style={{ margin: 0, fontSize: 13, color: '#334155', fontWeight: 600 }}>{bucket.label}</p>
              <h4 style={{ margin: '4px 0 0 0', fontSize: 22, color: '#0f172a' }}>{bucket.count}</h4>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Candidate Pipeline</h3></div>
        {loading ? <LoadingSkeleton rows={6} /> : rows.length === 0 ? <EmptyState title="No candidates found" /> : (
          <DataTable columns={columns} rows={rows} onView={openEdit} onEdit={openEdit} onDelete={(row) => { const found = items.find((x) => x.id === row.id); if (!found) return; setSelected(found); setConfirmOpen(true) }} />
        )}
      </div>

      <div className="panel"><h3>Quick Actions</h3><div className="actions-row">{items.slice(0, 6).map((x) => (<div key={x.id} className="inline-action-card"><span>{x.fullName} ({x.position})</span><div className="actions-row"><Button variant="ghost" onClick={() => openEdit({ id: x.id })}>Open</Button><Button variant="ghost" onClick={async () => { try { await archiveRecruitmentCandidate(x.id); setToast({ type: 'success', message: 'Candidate archived' }); await load() } catch (error) { setToast({ type: 'error', message: error?.response?.data?.message || 'Archive failed' }) } }}>Archive</Button></div></div>))}</div></div>

      <Modal open={modalOpen} title={selected ? 'Edit Candidate' : 'Add Candidate'} onClose={() => setModalOpen(false)}>
        <div className="form-grid">
          <FormInput label="Full Name" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
          <FormInput label="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <FormInput label="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          <FormInput label="Position" value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))} />
          <FormInput label="Department" value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} />
          <FilterDropdown label="Source" value={form.source} onChange={(v) => setForm((p) => ({ ...p, source: v }))} options={[{ value: 'direct', label: 'Direct' }, { value: 'referral', label: 'Referral' }, { value: 'job-portal', label: 'Job Portal' }, { value: 'agency', label: 'Agency' }, { value: 'campus', label: 'Campus' }]} />
          <FilterDropdown label="Stage" value={form.stage} onChange={(v) => setForm((p) => ({ ...p, stage: v }))} options={[{ value: 'applied', label: 'Applied' }, { value: 'screening', label: 'Screening' }, { value: 'interview', label: 'Interview' }, { value: 'offer', label: 'Offer' }, { value: 'hired', label: 'Hired' }, { value: 'rejected', label: 'Rejected' }]} />
          <FilterDropdown label="Recruiter" value={form.assignedRecruiterId} onChange={(v) => setForm((p) => ({ ...p, assignedRecruiterId: v }))} options={[{ value: '', label: 'Unassigned' }, ...recruiters.map((r) => ({ value: r.id, label: r.name }))]} />
          <FormInput label="Experience Years" type="number" min="0" step="0.1" value={form.experienceYears} onChange={(e) => setForm((p) => ({ ...p, experienceYears: e.target.value }))} />
          <FormInput label="Expected CTC" value={form.expectedCtc} onChange={(e) => setForm((p) => ({ ...p, expectedCtc: e.target.value }))} />
          <FormInput label="Notice Period (Days)" type="number" min="0" value={form.noticePeriodDays} onChange={(e) => setForm((p) => ({ ...p, noticePeriodDays: e.target.value }))} />
          <FormInput label="Location" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
          <FormInput label="Resume URL" value={form.resumeUrl} onChange={(e) => setForm((p) => ({ ...p, resumeUrl: e.target.value }))} />
          <FormInput label="Interview Date" type="date" value={form.interviewDate} onChange={(e) => setForm((p) => ({ ...p, interviewDate: e.target.value }))} />
          <FormInput label="Joined Date" type="date" value={form.joinedDate} onChange={(e) => setForm((p) => ({ ...p, joinedDate: e.target.value }))} />
          <FormInput label="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
        </div>
        <div className="actions-row"><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={save}>{saving ? 'Saving...' : 'Save'}</Button></div>
      </Modal>

      <ConfirmDialog open={confirmOpen} title="Delete Candidate" message={`Delete selected candidate?`} onCancel={() => setConfirmOpen(false)} onConfirm={async () => { if (!selected?.id) return; try { await deleteRecruitmentCandidate(selected.id); setConfirmOpen(false); setSelected(null); setToast({ type: 'success', message: 'Candidate deleted' }); await load() } catch (error) { setToast({ type: 'error', message: error?.response?.data?.message || 'Delete failed' }) } }} />
    </section>
  )
}

export default HrRecruitmentPage

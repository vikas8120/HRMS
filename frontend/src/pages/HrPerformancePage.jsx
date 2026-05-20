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
  archivePerformanceReview,
  createPerformanceReview,
  deletePerformanceReview,
  listPerformanceReviews,
  updatePerformanceReview
} from '../api/adminPerformanceApi'

const resetForm = () => ({
  cycle: '',
  employeeId: '',
  reviewerId: '',
  goal: '',
  selfScore: '0',
  managerScore: '0',
  status: 'draft',
  feedback: '',
  reviewDate: ''
})

function HrPerformancePage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [cycle, setCycle] = useState('all')
  const [status, setStatus] = useState('all')
  const [employeeId, setEmployeeId] = useState('all')
  const [toast, setToast] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(resetForm())
  const [selected, setSelected] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await listPerformanceReviews({ search, cycle, status, employeeId, archived: 'false' })
      setItems(res?.items || [])
      setUsers(res?.users || [])
    } catch (error) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Failed to load performance data' })
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

  const cycleOptions = useMemo(() => {
    const uniq = Array.from(new Set(items.map((x) => x.cycle).filter(Boolean)))
    return [{ value: 'all', label: 'All Cycles' }, ...uniq.map((x) => ({ value: x, label: x }))]
  }, [items])

  const employeeOptions = useMemo(() => [{ value: 'all', label: 'All Employees' }, ...users.map((x) => ({ value: x.id, label: x.name }))], [users])

  const rows = useMemo(() => items.map((x) => ({
    id: x.id,
    cycle: x.cycle,
    employee: x.employeeName || '-',
    reviewer: x.reviewerName || '-',
    finalScore: x.finalScore,
    status: x.status,
    reviewDate: x.reviewDate ? String(x.reviewDate).slice(0, 10) : '-'
  })), [items])

  const columns = [
    { key: 'cycle', label: 'Cycle' },
    { key: 'employee', label: 'Employee' },
    { key: 'reviewer', label: 'Reviewer' },
    { key: 'finalScore', label: 'Final Score' },
    { key: 'status', label: 'Status' },
    { key: 'reviewDate', label: 'Review Date' }
  ]

  const analytics = useMemo(() => {
    const total = items.length
    const avgScore = total ? Number((items.reduce((acc, item) => acc + Number(item.finalScore || 0), 0) / total).toFixed(2)) : 0
    const finalized = items.filter((x) => x.status === 'finalized').length
    const submitted = items.filter((x) => x.status === 'submitted').length
    const inProgress = items.filter((x) => x.status === 'in-progress').length
    const draft = items.filter((x) => x.status === 'draft').length
    const highPerformers = items.filter((x) => Number(x.finalScore || 0) >= 4).length

    const statusData = [
      { key: 'finalized', label: 'Finalized', count: finalized, color: '#22c55e' },
      { key: 'submitted', label: 'Submitted', count: submitted, color: '#3b82f6' },
      { key: 'in-progress', label: 'In Progress', count: inProgress, color: '#f59e0b' },
      { key: 'draft', label: 'Draft', count: draft, color: '#94a3b8' }
    ]

    return { total, avgScore, finalized, highPerformers, statusData }
  }, [items])

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
      cycle: found.cycle || '',
      employeeId: found.employeeId || '',
      reviewerId: found.reviewerId || '',
      goal: found.goal || '',
      selfScore: String(found.selfScore || 0),
      managerScore: String(found.managerScore || 0),
      status: found.status || 'draft',
      feedback: found.feedback || '',
      reviewDate: found.reviewDate ? String(found.reviewDate).slice(0, 10) : ''
    })
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.cycle.trim() || !form.employeeId || !form.goal.trim()) {
      setToast({ type: 'error', message: 'Cycle, employee and goal are required' })
      return
    }

    const payload = {
      ...form,
      selfScore: Number(form.selfScore || 0),
      managerScore: Number(form.managerScore || 0),
      reviewerId: form.reviewerId || null,
      reviewDate: form.reviewDate || null
    }

    try {
      if (selected?.id) await updatePerformanceReview(selected.id, payload)
      else await createPerformanceReview(payload)

      setModalOpen(false)
      setToast({ type: 'success', message: selected ? 'Performance review updated' : 'Performance review created' })
      await load()
    } catch (error) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Save failed' })
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Performance"
        description="Manage goals, scoring, reviewer feedback, and review-cycle records."
        breadcrumb={['HR Portal', 'Performance']}
        primaryActionLabel="Add Review"
        onPrimaryAction={openCreate}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel filters-panel">
        <div className="filters-row admin-filters-grid">
          <div className="search-wrap">
            <label>Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder="Search cycle, goal, employee" />
          </div>
          <FilterDropdown label="Cycle" value={cycle} onChange={setCycle} options={cycleOptions} />
          <FilterDropdown label="Employee" value={employeeId} onChange={setEmployeeId} options={employeeOptions} />
          <FilterDropdown label="Status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All' }, { value: 'draft', label: 'Draft' }, { value: 'in-progress', label: 'In Progress' }, { value: 'submitted', label: 'Submitted' }, { value: 'finalized', label: 'Finalized' }]} />
          <div className="actions-row"><Button variant="ghost" onClick={load}>Apply</Button></div>
        </div>
      </div>

      <div className="panel" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(16,185,129,0.14))', border: '1px solid rgba(99,102,241,0.24)' }}>
        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: '14px', padding: '14px', boxShadow: '0 8px 20px rgba(49,46,129,0.08)', color: '#0f172a' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#334155', fontWeight: 600 }}>Total Reviews</p>
            <h3 style={{ margin: '6px 0 0 0', fontSize: '28px', color: '#0f172a' }}>{analytics.total}</h3>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: '14px', padding: '14px', boxShadow: '0 8px 20px rgba(49,46,129,0.08)', color: '#0f172a' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#334155', fontWeight: 600 }}>Average Score</p>
            <h3 style={{ margin: '6px 0 0 0', fontSize: '28px', color: '#0f172a' }}>{analytics.avgScore}<span style={{ fontSize: '14px', color: '#64748b' }}>/5</span></h3>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: '14px', padding: '14px', boxShadow: '0 8px 20px rgba(49,46,129,0.08)', color: '#0f172a' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#334155', fontWeight: 600 }}>Finalized</p>
            <h3 style={{ margin: '6px 0 0 0', fontSize: '28px', color: '#0f172a' }}>{analytics.finalized}</h3>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: '14px', padding: '14px', boxShadow: '0 8px 20px rgba(49,46,129,0.08)', color: '#0f172a' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#334155', fontWeight: 600 }}>High Performers (4+)</p>
            <h3 style={{ margin: '6px 0 0 0', fontSize: '28px', color: '#0f172a' }}>{analytics.highPerformers}</h3>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: '14px', padding: '14px', color: '#0f172a' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>Status Distribution</h4>
            {analytics.statusData.map((item) => {
              const width = analytics.total ? Math.round((item.count / analytics.total) * 100) : 0
              return (
                <div key={item.key} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: '#334155', fontWeight: 600 }}>
                    <span>{item.label}</span>
                    <span>{item.count} ({width}%)</span>
                  </div>
                  <div style={{ height: '9px', borderRadius: '999px', background: '#e5e7eb', overflow: 'hidden' }}>
                    <div style={{ width: `${width}%`, height: '100%', background: item.color, transition: 'width 350ms ease' }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>Readiness</h4>
            <div style={{ width: '120px', height: '120px', borderRadius: '999px', background: `conic-gradient(#22c55e ${analytics.total ? (analytics.finalized / analytics.total) * 360 : 0}deg, #e5e7eb 0deg)` }} />
            <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#334155', fontWeight: 600 }}>{analytics.total ? Math.round((analytics.finalized / analytics.total) * 100) : 0}% finalized</p>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Performance Reviews</h3></div>
        {loading ? <LoadingSkeleton rows={6} /> : rows.length === 0 ? <EmptyState title="No performance reviews found" /> : (
          <DataTable
            columns={columns}
            rows={rows}
            onView={openEdit}
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
              <span>{x.goal.slice(0, 48) || 'Performance Goal'}</span>
              <div className="actions-row">
                <Button variant="ghost" onClick={() => openEdit({ id: x.id })}>Open</Button>
                <Button variant="ghost" onClick={async () => { await archivePerformanceReview(x.id); setToast({ type: 'success', message: 'Review archived' }); load() }}>Archive</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={modalOpen} title={selected ? 'Edit Performance Review' : 'Add Performance Review'} onClose={() => setModalOpen(false)}>
        <div className="form-grid">
          <FormInput label="Review Cycle" value={form.cycle} onChange={(e) => setForm((p) => ({ ...p, cycle: e.target.value }))} placeholder="Q2-2026" />
          <FilterDropdown label="Employee" value={form.employeeId} onChange={(v) => setForm((p) => ({ ...p, employeeId: v }))} options={users.map((u) => ({ value: u.id, label: u.name }))} />
          <FilterDropdown label="Reviewer" value={form.reviewerId} onChange={(v) => setForm((p) => ({ ...p, reviewerId: v }))} options={[{ value: '', label: 'Unassigned' }, ...users.map((u) => ({ value: u.id, label: u.name }))]} />
          <FormInput label="Goal" value={form.goal} onChange={(e) => setForm((p) => ({ ...p, goal: e.target.value }))} />
          <FormInput label="Self Score (0-5)" type="number" min="0" max="5" step="0.1" value={form.selfScore} onChange={(e) => setForm((p) => ({ ...p, selfScore: e.target.value }))} />
          <FormInput label="Manager Score (0-5)" type="number" min="0" max="5" step="0.1" value={form.managerScore} onChange={(e) => setForm((p) => ({ ...p, managerScore: e.target.value }))} />
          <FilterDropdown label="Status" value={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v }))} options={[{ value: 'draft', label: 'Draft' }, { value: 'in-progress', label: 'In Progress' }, { value: 'submitted', label: 'Submitted' }, { value: 'finalized', label: 'Finalized' }]} />
          <FormInput label="Review Date" type="date" value={form.reviewDate} onChange={(e) => setForm((p) => ({ ...p, reviewDate: e.target.value }))} />
          <FormInput label="Feedback" value={form.feedback} onChange={(e) => setForm((p) => ({ ...p, feedback: e.target.value }))} />
        </div>
        <div className="actions-row">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Performance Review"
        message={`Delete selected review?`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (!selected?.id) return
          await deletePerformanceReview(selected.id)
          setConfirmOpen(false)
          setSelected(null)
          setToast({ type: 'success', message: 'Performance review deleted' })
          await load()
        }}
      />
    </section>
  )
}

export default HrPerformancePage

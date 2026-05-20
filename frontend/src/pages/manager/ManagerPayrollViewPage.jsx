import { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import SearchBar from '../../components/ui/SearchBar'
import FilterDropdown from '../../components/ui/FilterDropdown'
import Modal from '../../components/ui/Modal'
import StatCard from '../../components/ui/StatCard'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import { getManagerTeam } from '../../api/managerTeamApi'
import {
  createManagerBonusRecommendation,
  getManagerPayrollStatus,
  getManagerPayrollTeamSummary
} from '../../api/managerPayrollApi'

const tabs = ['Team Salary Summary', 'Payroll Status', 'Bonus/Incentive Recommendation']

const monthOptions = [{ value: '', label: 'All Months' }, ...Array.from({ length: 12 }, (_, i) => {
  const value = String(i + 1).padStart(2, '0')
  return { value, label: value }
})]

const statusOptions = [{ value: 'all', label: 'All Status' }, { value: 'generated', label: 'Generated' }, { value: 'pending', label: 'Pending' }, { value: 'paid', label: 'Paid' }]

function ManagerPayrollViewPage() {
  const [activeTab, setActiveTab] = useState('Team Salary Summary')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [summaryRows, setSummaryRows] = useState([])
  const [summaryCards, setSummaryCards] = useState({ totalEmployees: 0, totalNetSalary: 0, totalGrossSalary: 0, totalBonus: 0 })
  const [statusRows, setStatusRows] = useState([])
  const [statusCards, setStatusCards] = useState({ generated: 0, pending: 0, paid: 0 })
  const [team, setTeam] = useState([])
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [status, setStatus] = useState('all')
  const [toast, setToast] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [bonusForm, setBonusForm] = useState({ employeeId: '', recommendationType: 'bonus', amount: '', reason: '', remarks: '' })

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2500)
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

  const loadSummary = async () => {
    const payload = await getManagerPayrollTeamSummary({ month, year, status })
    setSummaryRows(payload?.data || [])
    setSummaryCards(payload?.summary || { totalEmployees: 0, totalNetSalary: 0, totalGrossSalary: 0, totalBonus: 0 })
  }

  const loadStatus = async () => {
    const payload = await getManagerPayrollStatus({ month, year })
    setStatusRows(payload?.data || [])
    setStatusCards(payload?.statusSummary || { generated: 0, pending: 0, paid: 0 })
  }

  const loadAll = async () => {
    setLoading(true)
    try {
      await Promise.all([loadSummary(), loadStatus()])
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to load payroll data' })
      setSummaryRows([])
      setStatusRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTeam() }, [])
  useEffect(() => { loadAll() }, [month, year, status])

  const filteredSummary = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return summaryRows
    return summaryRows.filter((x) => `${x.employeeName} ${x.email} ${x.designation}`.toLowerCase().includes(needle))
  }, [summaryRows, search])

  const filteredStatus = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return statusRows
    return statusRows.filter((x) => `${x.employeeName} ${x.email} ${x.designation} ${x.status}`.toLowerCase().includes(needle))
  }, [statusRows, search])

  const employeeOptions = [{ value: '', label: 'Select Employee' }, ...team.map((x) => ({ value: String(x.employeeId || x.id), label: `${x.name} (${x.email})` }))]

  const exportCsv = (rows, filePrefix) => {
    const headers = ['Employee', 'Email', 'Designation', 'Month', 'Year', 'Gross Salary', 'Net Salary', 'Bonus', 'Status']
    const lines = rows.map((row) => [row.employeeName, row.email, row.designation, row.month, row.year, row.grossSalary, row.netSalary, row.bonus, row.status])
    const csv = [headers, ...lines].map((line) => line.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filePrefix}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadSummary = () => {
    const lines = [
      'Manager Payroll Summary',
      `Generated: ${new Date().toISOString()}`,
      `Total Employees: ${summaryCards.totalEmployees}`,
      `Total Gross Salary: ${summaryCards.totalGrossSalary}`,
      `Total Net Salary: ${summaryCards.totalNetSalary}`,
      `Total Bonus: ${summaryCards.totalBonus}`,
      '',
      ...filteredSummary.map((row, idx) => `${idx + 1}. ${row.employeeName} | Net ${row.netSalary} | ${row.status}`)
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `manager-payroll-summary-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const submitBonusRecommendation = async () => {
    if (!bonusForm.employeeId) return setToast({ type: 'error', message: 'Employee is required' })
    if (!bonusForm.amount || Number(bonusForm.amount) <= 0) return setToast({ type: 'error', message: 'Valid amount is required' })
    if (!bonusForm.reason.trim()) return setToast({ type: 'error', message: 'Reason is required' })

    setSubmitting(true)
    try {
      await createManagerBonusRecommendation({
        employeeId: bonusForm.employeeId,
        recommendationType: bonusForm.recommendationType || 'bonus',
        amount: Number(bonusForm.amount),
        reason: bonusForm.reason,
        remarks: bonusForm.remarks
      })
      setToast({ type: 'success', message: 'Submitted to HR/Admin' })
      setBonusForm({ employeeId: '', recommendationType: 'bonus', amount: '', reason: '', remarks: '' })
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to submit recommendation' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Payroll View"
        description="View assigned team payroll summaries and recommend bonus/incentives."
        breadcrumb={['Manager Portal', 'Payroll View']}
      />

      {toast ? <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>{toast.message}</div> : null}

      <div className="panel">
        <div className="workspace-nav">
          {tabs.map((tab) => (
            <button key={tab} className={`chip-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>
        <div className="filters-row admin-filters-grid" style={{ marginTop: 10 }}>
          <div className="search-wrap"><label>Search</label><SearchBar value={search} onChange={setSearch} placeholder="Search employee, email, designation" /></div>
          <FilterDropdown label="Month" value={month} onChange={setMonth} options={monthOptions} />
          <label className="form-input-wrap"><span>Year</span><input className="form-input" value={year} onChange={(e) => setYear(e.target.value)} /></label>
          <FilterDropdown label="Status" value={status} onChange={setStatus} options={statusOptions} />
        </div>
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={loadAll}>Filter</Button>
          <Button variant="ghost" onClick={loadAll}><RefreshCw size={14} /> Refresh</Button>
          <Button variant="ghost" onClick={() => exportCsv(activeTab === 'Payroll Status' ? filteredStatus : filteredSummary, 'manager-payroll-export')}><Download size={14} /> Export</Button>
          <Button variant="ghost" onClick={downloadSummary}><Download size={14} /> Download Summary</Button>
        </div>
      </div>

      {activeTab === 'Bonus/Incentive Recommendation' ? (
        <div className="panel">
          <div className="panel-head"><h3>Recommend Bonus/Incentive</h3></div>
          <div className="modal-form">
            <FilterDropdown label="Employee" value={bonusForm.employeeId} onChange={(value) => setBonusForm((p) => ({ ...p, employeeId: value }))} options={employeeOptions} />
            <FilterDropdown
              label="Recommendation Type"
              value={bonusForm.recommendationType}
              onChange={(value) => setBonusForm((p) => ({ ...p, recommendationType: value }))}
              options={[{ value: 'bonus', label: 'Bonus' }, { value: 'incentive', label: 'Incentive' }]}
            />
            <label className="form-input-wrap"><span>Amount</span><input className="form-input" type="number" value={bonusForm.amount} onChange={(e) => setBonusForm((p) => ({ ...p, amount: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Reason</span><textarea className="form-input" rows={3} value={bonusForm.reason} onChange={(e) => setBonusForm((p) => ({ ...p, reason: e.target.value }))} /></label>
            <label className="form-input-wrap"><span>Remarks</span><textarea className="form-input" rows={3} value={bonusForm.remarks} onChange={(e) => setBonusForm((p) => ({ ...p, remarks: e.target.value }))} /></label>
            <div className="actions-row">
              <Button onClick={submitBonusRecommendation} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit to HR'}</Button>
              <Button variant="ghost" onClick={submitBonusRecommendation} disabled={submitting}>{submitting ? 'Submitting...' : 'Recommend Bonus'}</Button>
              <Button variant="ghost" onClick={() => setBonusForm({ employeeId: '', recommendationType: 'bonus', amount: '', reason: '', remarks: '' })}>Cancel</Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="stats-grid premium-stats-grid">
            <StatCard title="Total Team Members" value={String(summaryCards.totalEmployees || 0)} trend="Assigned employees with payroll records" />
            <StatCard title="Total Gross" value={String(summaryCards.totalGrossSalary || 0)} trend="Gross payroll summary" trendTone="info" />
            <StatCard title="Total Net" value={String(summaryCards.totalNetSalary || 0)} trend="Net payroll summary" trendTone="success" />
            <StatCard title="Total Bonus" value={String(summaryCards.totalBonus || 0)} trend="Bonus paid in selected period" trendTone="warning" />
          </div>

          {activeTab === 'Payroll Status' ? (
            <div className="stats-grid premium-stats-grid" style={{ marginTop: 12 }}>
              <StatCard title="Generated" value={String(statusCards.generated || 0)} trend="Generated payrolls" />
              <StatCard title="Pending" value={String(statusCards.pending || 0)} trend="Awaiting processing" trendTone="warning" />
              <StatCard title="Paid" value={String(statusCards.paid || 0)} trend="Completed payouts" trendTone="success" />
            </div>
          ) : null}

          <div className="panel">
            <div className="panel-head"><h3>{activeTab}</h3></div>
            {loading ? <LoadingSkeleton rows={8} /> : (activeTab === 'Payroll Status' ? filteredStatus : filteredSummary).length === 0 ? (
              <EmptyState title="No payroll records" description="Payroll records for assigned employees will appear here." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Email</th>
                      <th>Designation</th>
                      <th>Month/Year</th>
                      <th>Gross Salary</th>
                      <th>Net Salary</th>
                      <th>Bonus</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab === 'Payroll Status' ? filteredStatus : filteredSummary).map((row) => (
                      <tr key={row.id}>
                        <td>{row.employeeName}</td>
                        <td>{row.email}</td>
                        <td>{row.designation}</td>
                        <td>{row.month}/{row.year}</td>
                        <td>{row.grossSalary}</td>
                        <td>{row.netSalary}</td>
                        <td>{row.bonus}</td>
                        <td><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                        <td>
                          <div className="table-actions">
                            <button className="text-btn" onClick={() => { setSelected(row); setViewOpen(true) }}>View</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <Modal open={viewOpen} title="Payroll Summary Details" onClose={() => setViewOpen(false)}>
        {!selected ? <EmptyState title="No record selected" description="Select a row to view details." /> : (
          <div className="modal-form">
            <div className="inline-action-card"><strong>Employee:</strong> <span>{selected.employeeName}</span></div>
            <div className="inline-action-card"><strong>Email:</strong> <span>{selected.email}</span></div>
            <div className="inline-action-card"><strong>Designation:</strong> <span>{selected.designation}</span></div>
            <div className="inline-action-card"><strong>Month/Year:</strong> <span>{selected.month}/{selected.year}</span></div>
            <div className="inline-action-card"><strong>Gross Salary:</strong> <span>{selected.grossSalary}</span></div>
            <div className="inline-action-card"><strong>Net Salary:</strong> <span>{selected.netSalary}</span></div>
            <div className="inline-action-card"><strong>Bonus:</strong> <span>{selected.bonus}</span></div>
            <div className="inline-action-card"><strong>Deductions:</strong> <span>{selected.deductions}</span></div>
            <div className="inline-action-card"><strong>Tax:</strong> <span>{selected.tax}</span></div>
            <div className="inline-action-card"><strong>Status:</strong> <span>{selected.status}</span></div>
          </div>
        )}
      </Modal>
    </section>
  )
}

export default ManagerPayrollViewPage

import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import FormInput from '../../components/ui/FormInput'
import FilterDropdown from '../../components/ui/FilterDropdown'

const reportGroups = {
  'Business Reports': ['Tenant Reports', 'Revenue Reports', 'Subscription Reports', 'Billing Reports'],
  'Ops Reports': ['User Reports', 'Support Reports', 'Storage Reports'],
  'Security & Platform': ['Security Reports', 'Login Reports', 'API Usage Reports', 'System Health Reports', 'Audit Reports']
}

const groupByReportType = Object.fromEntries(
  Object.entries(reportGroups).flatMap(([group, types]) => types.map((type) => [type, group]))
)

const allTypes = Object.values(reportGroups).flat()
const REPORTS_STORAGE_KEY = 'hrms_frontend_reports_v1'

const seedRows = [
  { id: 'rep-1', reportType: 'Tenant Reports', fromDate: '2026-05-01', toDate: '2026-05-31', format: 'csv', resultSummary: '24 active tenants, 2 paused tenants', dateTime: '2026-05-31T08:12:00.000Z' },
  { id: 'rep-2', reportType: 'Support Reports', fromDate: '2026-05-01', toDate: '2026-05-31', format: 'pdf', resultSummary: '126 tickets resolved, avg closure 9.4h', dateTime: '2026-05-31T09:45:00.000Z' },
  { id: 'rep-3', reportType: 'Security Reports', fromDate: '2026-05-01', toDate: '2026-05-31', format: 'xlsx', resultSummary: '31 blocked attempts, 0 critical breaches', dateTime: '2026-05-31T10:15:00.000Z' }
]

function ReportsModulePage({ page }) {
  const [rows, setRows] = useState(() => {
    try {
      const raw = localStorage.getItem(REPORTS_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed?.rows?.length ? parsed.rows : seedRows
    } catch {
      return seedRows
    }
  })
  const [toast, setToast] = useState({ type: '', message: '' })
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [format, setFormat] = useState('csv')
  const [selectedType, setSelectedType] = useState('Tenant Reports')
  const [submitting, setSubmitting] = useState(false)

  const activeGroup = useMemo(() => {
    if (!page) return 'Business Reports'
    if (reportGroups[page]) return page
    return groupByReportType[page] || 'Business Reports'
  }, [page])

  const allowedTypes = reportGroups[activeGroup] || reportGroups['Business Reports']

  useEffect(() => {
    if (page && allTypes.includes(page)) {
      setSelectedType(page)
      return
    }
    setSelectedType(allowedTypes[0])
  }, [page, activeGroup])

  useEffect(() => {
    const today = new Date()
    const prior = new Date()
    prior.setDate(today.getDate() - 30)
    setToDate(today.toISOString().slice(0, 10))
    setFromDate(prior.toISOString().slice(0, 10))
  }, [])

  useEffect(() => {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify({ rows }))
  }, [rows])

  const cols = [
    { key: 'reportType', label: 'Report Type' },
    { key: 'fromDate', label: 'From' },
    { key: 'toDate', label: 'To' },
    { key: 'format', label: 'Format' },
    { key: 'resultSummary', label: 'Summary' },
    { key: 'dateTime', label: 'Generated At' }
  ]

  const tableRows = useMemo(() => rows
    .filter((x) => allowedTypes.includes(x.reportType))
    .map((x) => ({
      ...x,
      fromDate: new Date(x.fromDate).toLocaleDateString(),
      toDate: new Date(x.toDate).toLocaleDateString(),
      dateTime: new Date(x.dateTime).toLocaleString()
    })), [rows, allowedTypes])

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast({ type: '', message: '' }), 1600)
  }

  const runGenerate = (fmt) => {
    if (submitting) return
    if (!fromDate || !toDate) return showToast('error', 'Select date range')
    if (new Date(fromDate) > new Date(toDate)) return showToast('error', 'From Date cannot be after To Date')
    const normalizedFormat = String(fmt || format || '').trim().toLowerCase()
    if (!['csv', 'pdf', 'xlsx'].includes(normalizedFormat)) return showToast('error', 'Format must be csv, pdf, or xlsx')

    setSubmitting(true)
    const next = {
      id: `rep-${Date.now()}`,
      reportType: selectedType,
      fromDate,
      toDate,
      format: normalizedFormat,
      resultSummary: `${selectedType} generated for selected range`,
      dateTime: new Date().toISOString()
    }
    setRows((prev) => [next, ...prev])
    showToast('success', `${normalizedFormat.toUpperCase()} report generated (frontend only)`)
    setSubmitting(false)
  }

  return (
    <section className="section-layout">
      <PageHeader
        title={activeGroup}
        description="Generate and export reports with group-wise frontend workspace."
        breadcrumb={['Super Admin', 'Reports', activeGroup]}
        primaryActionLabel="Refresh"
        onPrimaryAction={() => showToast('success', 'Refreshed (frontend state)')}
      />
      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}

      <div id="reports-generator-section" className="panel">
        <h3>Generate Report</h3>
        <div className="form-grid">
          <FilterDropdown label="Report Type" value={selectedType} onChange={setSelectedType} options={allowedTypes.map((type) => ({ value: type, label: type }))} />
          <FormInput label="From Date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <FormInput label="To Date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <FilterDropdown label="Format" value={format} onChange={setFormat} options={[{ value: 'csv', label: 'CSV' }, { value: 'pdf', label: 'PDF' }, { value: 'xlsx', label: 'XLSX' }]} />
        </div>
        <div className="actions-row">
          <Button disabled={submitting} onClick={() => runGenerate(format)}>{submitting ? 'Generating...' : 'Generate Report'}</Button>
          <Button variant="ghost" disabled={submitting} onClick={() => runGenerate('csv')}>Export CSV</Button>
          <Button variant="ghost" disabled={submitting} onClick={() => runGenerate('pdf')}>Export PDF</Button>
        </div>
      </div>

      <div id="reports-history-section" className="panel">
        <h3>{activeGroup} History</h3>
        <DataTable columns={cols} rows={tableRows} showActions={false} emptyTitle={`No ${activeGroup.toLowerCase()} history found`} />
      </div>
    </section>
  )
}

export default ReportsModulePage

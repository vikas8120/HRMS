import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import FormInput from '../../components/ui/FormInput'
import FilterDropdown from '../../components/ui/FilterDropdown'
import { generateReport, listReports } from '../../api/reportsApi'

const reportTypes = [
  'Tenant Reports',
  'Revenue Reports',
  'Subscription Reports',
  'User Reports',
  'Security Reports',
  'Login Reports',
  'API Usage Reports',
  'Support Reports',
  'Storage Reports',
  'System Health Reports',
  'Billing Reports',
  'Audit Reports'
]

const sectionByPage = {
  'Tenant Reports': 'reports-generator-section',
  'Revenue Reports': 'reports-generator-section',
  'Subscription Reports': 'reports-generator-section',
  'User Reports': 'reports-generator-section',
  'Security Reports': 'reports-generator-section',
  'Login Reports': 'reports-generator-section',
  'API Usage Reports': 'reports-generator-section',
  'Support Reports': 'reports-generator-section',
  'Storage Reports': 'reports-generator-section',
  'System Health Reports': 'reports-generator-section',
  'Billing Reports': 'reports-generator-section',
  'Audit Reports': 'reports-generator-section',
  'Export Center': 'reports-history-section'
}

function ReportsModulePage({ page }) {
  const [rows, setRows] = useState([])
  const [toast, setToast] = useState({ type: '', message: '' })
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [format, setFormat] = useState('csv')
  const [filterText, setFilterText] = useState('')
  const [selectedType, setSelectedType] = useState('Tenant Reports')

  const load = async () => {
    const res = await listReports({ page: 1, limit: 200, reportType: 'all' })
    setRows(res.items || [])
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (reportTypes.includes(page)) setSelectedType(page)
    if (!page || !sectionByPage[page]) return
    const timer = setTimeout(() => {
      const element = document.getElementById(sectionByPage[page])
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => clearTimeout(timer)
  }, [page])

  const cols = [{ key: 'reportType', label: 'Report Type' }, { key: 'fromDate', label: 'From' }, { key: 'toDate', label: 'To' }, { key: 'format', label: 'Format' }, { key: 'resultSummary', label: 'Summary' }, { key: 'dateTime', label: 'Generated At' }]
  const tableRows = useMemo(() => rows.map((x) => ({
    id: x._id,
    reportType: x.reportType,
    fromDate: new Date(x.fromDate).toLocaleDateString(),
    toDate: new Date(x.toDate).toLocaleDateString(),
    format: x.format,
    resultSummary: x.resultSummary || '-',
    dateTime: new Date(x.dateTime).toLocaleString()
  })), [rows])

  const runGenerate = async (fmt) => {
    if (!fromDate || !toDate) return setToast({ type: 'error', message: 'Select date range' })
    const res = await generateReport({ reportType: selectedType, fromDate, toDate, format: fmt, filters: { query: filterText } })
    setToast({ type: 'success', message: `${fmt.toUpperCase()} report ready (mock): ${res.downloadUrl}` })
    load()
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Reports"
        description="Single-page reporting workspace for generation, filters, exports, and history."
        breadcrumb={['Super Admin', 'Reports', 'Workspace']}
        primaryActionLabel="Refresh"
        onPrimaryAction={load}
      />
      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}

      <div className="panel">
        <div className="panel-head"><h3>All Report Controls In One Page</h3></div>
        <p>Generate any report type, export in multiple formats, and audit report history in one place.</p>
      </div>

      <div id="reports-generator-section" className="panel">
        <h3>Generate Report</h3>
        <div className="form-grid">
          <FilterDropdown label="Report Type" value={selectedType} onChange={setSelectedType} options={reportTypes.map((type) => ({ value: type, label: type }))} />
          <FormInput label="From Date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <FormInput label="To Date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <FormInput label="Filter" value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Optional filter" />
          <FormInput label="Format" value={format} onChange={(e) => setFormat(e.target.value)} placeholder="csv/pdf" />
        </div>
        <div className="actions-row">
          <Button onClick={() => runGenerate(format)}>Generate Report</Button>
          <Button variant="ghost" onClick={() => runGenerate('csv')}>Export CSV</Button>
          <Button variant="ghost" onClick={() => runGenerate('pdf')}>Export PDF</Button>
        </div>
      </div>

      <div id="reports-history-section" className="panel">
        <h3>Report History</h3>
        <DataTable columns={cols} rows={tableRows} onView={() => {}} onEdit={() => {}} onDelete={() => {}} />
      </div>
    </section>
  )
}

export default ReportsModulePage

import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import FormInput from '../../components/ui/FormInput'
import FilterDropdown from '../../components/ui/FilterDropdown'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
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
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await listReports({ page: 1, limit: 200, reportType: 'all' })
      setRows(res.items || [])
    } catch (error) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Failed to load reports' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const today = new Date()
    const prior = new Date()
    prior.setDate(today.getDate() - 30)
    setToDate(today.toISOString().slice(0, 10))
    setFromDate(prior.toISOString().slice(0, 10))
    load()
  }, [])

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
    if (submitting) return
    if (!fromDate || !toDate) return setToast({ type: 'error', message: 'Select date range' })
    if (new Date(fromDate) > new Date(toDate)) return setToast({ type: 'error', message: 'From Date cannot be after To Date' })
    const normalizedFormat = String(fmt || format || '').trim().toLowerCase()
    if (!['csv', 'pdf', 'xlsx'].includes(normalizedFormat)) {
      return setToast({ type: 'error', message: 'Format must be csv, pdf, or xlsx' })
    }
    try {
      setSubmitting(true)
      const res = await generateReport({ reportType: selectedType, fromDate, toDate, format: normalizedFormat, filters: { query: filterText } })
      setToast({ type: 'success', message: res?.message || `${normalizedFormat.toUpperCase()} report generated successfully` })
      await load()
    } catch (error) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Failed to generate report' })
    } finally {
      setSubmitting(false)
    }
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
          <FilterDropdown
            label="Format"
            value={format}
            onChange={setFormat}
            options={[{ value: 'csv', label: 'CSV' }, { value: 'pdf', label: 'PDF' }, { value: 'xlsx', label: 'XLSX' }]}
          />
        </div>
        <div className="actions-row">
          <Button disabled={submitting} onClick={() => runGenerate(format)}>{submitting ? 'Generating...' : 'Generate Report'}</Button>
          <Button variant="ghost" disabled={submitting} onClick={() => runGenerate('csv')}>Export CSV</Button>
          <Button variant="ghost" disabled={submitting} onClick={() => runGenerate('pdf')}>Export PDF</Button>
        </div>
      </div>

      <div id="reports-history-section" className="panel">
        <h3>Report History</h3>
        {loading ? <LoadingSkeleton rows={6} /> : <DataTable columns={cols} rows={tableRows} showActions={false} />}
        {!loading && tableRows.length === 0 ? <EmptyState title="No report history found" /> : null}
      </div>
    </section>
  )
}

export default ReportsModulePage

import { useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import FormInput from '../../components/ui/FormInput'
import { listBackupLogs, runBackup, runRestore } from '../../api/backupRestoreApi'

const backupTypes = ['Database Backup', 'File Backup', 'Automatic Backup', 'Manual Backup', 'Backup Scheduling', 'Cloud Backup', 'Backup Encryption']
const restoreTypes = ['Restore Database', 'Restore Files', 'Disaster Recovery']

const sectionByPage = {
  'Database Backup': 'backup-actions-section',
  'File Backup': 'backup-actions-section',
  'Automatic Backup': 'backup-actions-section',
  'Manual Backup': 'backup-actions-section',
  'Backup Scheduling': 'backup-actions-section',
  'Cloud Backup': 'backup-actions-section',
  'Backup Encryption': 'backup-actions-section',
  'Restore Database': 'restore-actions-section',
  'Restore Files': 'restore-actions-section',
  'Disaster Recovery': 'restore-actions-section',
  'Backup Logs': 'backup-logs-section'
}

function BackupRestoreModulePage({ page }) {
  const [logs, setLogs] = useState([])
  const [toast, setToast] = useState({ type: '', message: '' })
  const [target, setTarget] = useState('')
  const [details, setDetails] = useState('')
  const [selectedBackupType, setSelectedBackupType] = useState('Database Backup')
  const [selectedRestoreType, setSelectedRestoreType] = useState('Restore Database')

  const load = async () => {
    const res = await listBackupLogs({ page: 1, limit: 100, type: 'all' })
    setLogs(res.items)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!page || !sectionByPage[page]) return
    const timer = setTimeout(() => {
      const element = document.getElementById(sectionByPage[page])
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => clearTimeout(timer)
  }, [page])

  const cols = [{ key: 'type', label: 'Type' }, { key: 'mode', label: 'Mode' }, { key: 'target', label: 'Target' }, { key: 'status', label: 'Status' }, { key: 'details', label: 'Details' }, { key: 'dateTime', label: 'Date/Time' }]
  const rows = logs.map((x) => ({ id: x._id, type: x.type, mode: x.mode, target: x.target || '-', status: x.status, details: x.details || '-', dateTime: new Date(x.dateTime).toLocaleString() }))

  const runBackupAction = async () => {
    try {
      await runBackup({
        type: selectedBackupType,
        mode: selectedBackupType.includes('Automatic') ? 'automatic' : 'manual',
        target,
        details,
        encryption: selectedBackupType.includes('Encryption'),
        cloudProvider: selectedBackupType.includes('Cloud') ? 'MockCloud' : ''
      })
      setToast({ type: 'success', message: `${selectedBackupType} simulated successfully` })
      load()
    } catch (e) {
      setToast({ type: 'error', message: e?.response?.data?.message || 'Backup action failed' })
    }
  }

  const runRestoreAction = async () => {
    try {
      await runRestore({ type: selectedRestoreType, target, details })
      setToast({ type: 'success', message: `${selectedRestoreType} simulated successfully` })
      load()
    } catch (e) {
      setToast({ type: 'error', message: e?.response?.data?.message || 'Restore action failed' })
    }
  }

  return (
    <section className="section-layout">
      <PageHeader
        title="Backup & Restore"
        description="Single-page workspace for backup operations, restore workflows, and execution logs."
        breadcrumb={['Super Admin', 'Backup & Restore', 'Workspace']}
        primaryActionLabel="Refresh"
        onPrimaryAction={load}
      />
      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}

      <div className="panel">
        <div className="panel-head"><h3>All Backup & Restore Controls In One Page</h3></div>
        <p>Run backup and restore workflows from one page and monitor complete execution history below.</p>
      </div>

      <div className="panel">
        <div className="form-grid">
          <FormInput label="Target" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="database/files/path" />
          <FormInput label="Details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="optional notes" />
        </div>
      </div>

      <div id="backup-actions-section" className="panel">
        <h3>Backup Actions</h3>
        <div className="actions-row">
          {backupTypes.map((type) => (
            <Button key={type} variant={selectedBackupType === type ? 'primary' : 'ghost'} onClick={() => setSelectedBackupType(type)}>{type}</Button>
          ))}
        </div>
        <div className="actions-row"><Button onClick={runBackupAction}>Execute {selectedBackupType}</Button></div>
      </div>

      <div id="restore-actions-section" className="panel">
        <h3>Restore Actions</h3>
        <div className="actions-row">
          {restoreTypes.map((type) => (
            <Button key={type} variant={selectedRestoreType === type ? 'primary' : 'ghost'} onClick={() => setSelectedRestoreType(type)}>{type}</Button>
          ))}
        </div>
        <div className="actions-row"><Button onClick={runRestoreAction}>Execute {selectedRestoreType}</Button></div>
      </div>

      <div id="backup-logs-section" className="panel">
        <h3>Backup Logs</h3>
        <DataTable columns={cols} rows={rows} onView={() => {}} onEdit={() => {}} onDelete={() => {}} />
      </div>
    </section>
  )
}

export default BackupRestoreModulePage

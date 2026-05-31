import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import FormInput from '../../components/ui/FormInput'

const backupTypes = ['Database Backup', 'File Backup', 'Automatic Backup', 'Manual Backup', 'Backup Scheduling', 'Cloud Backup', 'Backup Encryption', 'Backup Logs']
const restoreTypes = ['Restore Database', 'Restore Files', 'Disaster Recovery']

const allTypes = [...backupTypes, ...restoreTypes]
const BACKUP_STORAGE_KEY = 'hrms_frontend_backup_restore_v1'

const seedLogs = [
  { id: 'bk-1', type: 'Database Backup', mode: 'manual', target: 'prod-main-db', status: 'success', details: 'Snapshot completed in 2m 14s', dateTime: '2026-05-31T09:10:00.000Z' },
  { id: 'bk-2', type: 'Restore Database', mode: 'manual', target: 'staging-db', status: 'success', details: 'Restored from backup v2.1.0', dateTime: '2026-05-31T11:45:00.000Z' },
  { id: 'bk-3', type: 'Cloud Backup', mode: 'automatic', target: 's3://hrms-backups', status: 'success', details: 'Nightly cloud sync complete', dateTime: '2026-05-31T02:00:00.000Z' }
]

const actionMeta = {
  'Database Backup': 'Create database snapshot of selected target.',
  'File Backup': 'Create backup package for selected file path.',
  'Automatic Backup': 'Run scheduled-style backup simulation.',
  'Manual Backup': 'Run immediate on-demand backup.',
  'Backup Scheduling': 'Save schedule run entry for selected target.',
  'Cloud Backup': 'Push backup to cloud destination.',
  'Backup Encryption': 'Backup with encryption flag enabled.',
  'Backup Logs': 'View only mode for backup audit history.',
  'Restore Database': 'Restore database from latest available backup.',
  'Restore Files': 'Restore files to selected path.',
  'Disaster Recovery': 'Run disaster recovery simulation workflow.'
}

function BackupRestoreModulePage({ page }) {
  const [logs, setLogs] = useState(() => {
    try {
      const raw = localStorage.getItem(BACKUP_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed?.logs?.length ? parsed.logs : seedLogs
    } catch {
      return seedLogs
    }
  })
  const [toast, setToast] = useState({ type: '', message: '' })
  const [target, setTarget] = useState('')
  const [details, setDetails] = useState('')
  const [selectedType, setSelectedType] = useState('Database Backup')
  const [lastAction, setLastAction] = useState(null)

  const activeGroup = useMemo(() => {
    if (page && restoreTypes.includes(page)) return 'Restore'
    return 'Backup'
  }, [page])

  const currentTypes = activeGroup === 'Backup' ? backupTypes : restoreTypes

  useEffect(() => {
    if (page && allTypes.includes(page)) {
      setSelectedType(page)
      return
    }
    setSelectedType(currentTypes[0])
  }, [page, activeGroup])

  useEffect(() => {
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify({ logs }))
  }, [logs])

  const visibleRows = useMemo(() => logs
    .filter((row) => (activeGroup === 'Backup' ? backupTypes.includes(row.type) : restoreTypes.includes(row.type)))
    .map((x) => ({ ...x, dateTime: new Date(x.dateTime).toLocaleString() })), [logs, activeGroup])

  const cols = [
    { key: 'type', label: 'Type' },
    { key: 'mode', label: 'Mode' },
    { key: 'target', label: 'Target' },
    { key: 'status', label: 'Status' },
    { key: 'details', label: 'Details' },
    { key: 'dateTime', label: 'Date/Time' }
  ]

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast({ type: '', message: '' }), 1600)
  }

  const executeAction = () => {
    if (selectedType === 'Backup Logs') {
      showToast('success', 'View mode selected. Check logs section below.')
      const logsPanel = document.getElementById('backup-logs-section')
      if (logsPanel) logsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (!target.trim()) {
      showToast('error', 'Target is required for this action')
      return
    }
    const resolvedTarget = target || (activeGroup === 'Backup' ? 'default-backup-target' : 'default-restore-target')
    const next = {
      id: `bk-${Date.now()}`,
      type: selectedType,
      mode: selectedType.includes('Automatic') ? 'automatic' : 'manual',
      target: resolvedTarget,
      status: 'success',
      details: details || `${selectedType} executed from frontend workspace`,
      dateTime: new Date().toISOString()
    }
    setLogs((prev) => [next, ...prev])
    setLastAction({
      type: selectedType,
      target: resolvedTarget,
      at: new Date().toLocaleString()
    })
    setTarget('')
    setDetails('')
    showToast('success', `${selectedType} completed (frontend only)`)
    setTimeout(() => {
      const logsPanel = document.getElementById('backup-logs-section')
      if (logsPanel) logsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
  }

  return (
    <section className="section-layout">
      <PageHeader
        title={activeGroup === 'Backup' ? 'Backup Operations' : 'Restore Operations'}
        description="Frontend-only workspace for backup and restore workflows with live activity logs."
        breadcrumb={['Super Admin', 'Backup & Restore', activeGroup]}
        primaryActionLabel="Refresh"
        onPrimaryAction={() => showToast('success', 'Refreshed (frontend state)')}
      />
      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}

      <div className="panel">
        <h3>{activeGroup} Actions</h3>
        <p style={{ marginTop: '-2px', color: 'var(--muted)' }}>
          Step 1: Select action. Step 2: Enter target/details. Step 3: Click execute.
        </p>
        <div className="form-grid">
          <FormInput label="Target *" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="database / files / cloud path" />
          <FormInput label="Details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="optional notes" />
        </div>
        <div className="actions-row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          {currentTypes.map((type) => (
            <Button key={type} variant={selectedType === type ? 'primary' : 'ghost'} onClick={() => setSelectedType(type)}>{type}</Button>
          ))}
        </div>
        <div className="panel" style={{ marginTop: 10, marginBottom: 0 }}>
          <strong>Selected:</strong> {selectedType}
          <br />
          <span style={{ color: 'var(--muted)' }}>{actionMeta[selectedType]}</span>
        </div>
        <div className="actions-row" style={{ marginTop: 10 }}>
          <Button className="backup-execute-btn" onClick={executeAction}>{selectedType === 'Backup Logs' ? 'Open Backup Logs' : `Execute ${selectedType}`}</Button>
        </div>
        {lastAction ? (
          <div className="panel" style={{ marginTop: 10, marginBottom: 0 }}>
            <strong>Last Action:</strong> {lastAction.type} on <strong>{lastAction.target}</strong> at {lastAction.at}
          </div>
        ) : null}
      </div>

      <div className="panel" id="backup-logs-section">
        <h3>{activeGroup} Logs</h3>
        <DataTable columns={cols} rows={visibleRows} showActions={false} emptyTitle={`No ${activeGroup.toLowerCase()} logs found`} />
      </div>
    </section>
  )
}

export default BackupRestoreModulePage

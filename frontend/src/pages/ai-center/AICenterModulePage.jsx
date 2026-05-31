import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormInput from '../../components/ui/FormInput'
import FilterDropdown from '../../components/ui/FilterDropdown'

const AI_CENTER_STORAGE_KEY = 'hrms_frontend_ai_center_v1'

const insightTypes = ['AI Dashboard', 'AI Attendance Insights', 'AI Attrition Prediction', 'AI Payroll Analytics', 'AI Usage Analytics']
const automationTypes = ['AI Chatbot', 'AI Auto Reports', 'AI Automation Rules']
const riskTypes = ['AI Fraud Detection']

const allTypes = [...insightTypes, ...automationTypes, ...riskTypes]

const initialInsights = [
  { id: 'ins-1', module: 'AI Dashboard', score: 82, trend: '+6%', highlights: ['Prediction confidence stable', 'Usage increasing across payroll', 'No anomaly in last 24h'] },
  { id: 'ins-2', module: 'AI Attendance Insights', score: 77, trend: '+3%', highlights: ['Late check-ins reduced by 11%', 'Shift variance normal', 'Geo mismatch alerts low'] },
  { id: 'ins-3', module: 'AI Attrition Prediction', score: 68, trend: '+2%', highlights: ['Attrition risk concentrated in sales', 'Top trigger: workload index', 'Retention model refreshed'] },
  { id: 'ins-4', module: 'AI Payroll Analytics', score: 85, trend: '+5%', highlights: ['Payroll anomalies: 0 critical', 'Overtime variance controlled', 'Approval SLA improved'] },
  { id: 'ins-5', module: 'AI Usage Analytics', score: 74, trend: '+9%', highlights: ['Active AI users up 14%', 'Most used: assistant summary', 'Token efficiency improved'] }
]

const initialUsageLogs = [
  { id: 'ulg-1', module: 'AI Dashboard', action: 'VIEW_INSIGHT', usageCount: 12, actor: 'Super Admin', dateTime: '2026-05-31T14:15:00.000Z' },
  { id: 'ulg-2', module: 'AI Chatbot', action: 'RUN_ASSIST', usageCount: 31, actor: 'HR Manager', dateTime: '2026-05-31T13:12:00.000Z' },
  { id: 'ulg-3', module: 'AI Fraud Detection', action: 'SCAN_TRIGGER', usageCount: 4, actor: 'Risk Engine', dateTime: '2026-05-31T12:00:00.000Z' }
]

const initialRules = [
  { id: 'rule-1', name: 'Attrition Alert', trigger: 'risk_score > 80', action: 'notify_hr_head', enabled: true },
  { id: 'rule-2', name: 'Payroll Anomaly Alert', trigger: 'anomaly_severity = high', action: 'create_audit_ticket', enabled: true }
]

const initialSettings = {
  modelMode: 'balanced',
  autoReportFrequency: 'weekly',
  chatbotTone: 'professional',
  fraudSensitivity: 'medium'
}

function AICenterModulePage({ page }) {
  const [toast, setToast] = useState({ type: '', message: '' })
  const [insights, setInsights] = useState(() => {
    try {
      const raw = localStorage.getItem(AI_CENTER_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed?.insights?.length ? parsed.insights : initialInsights
    } catch {
      return initialInsights
    }
  })
  const [logs, setLogs] = useState(() => {
    try {
      const raw = localStorage.getItem(AI_CENTER_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed?.logs?.length ? parsed.logs : initialUsageLogs
    } catch {
      return initialUsageLogs
    }
  })
  const [rules, setRules] = useState(() => {
    try {
      const raw = localStorage.getItem(AI_CENTER_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed?.rules?.length ? parsed.rules : initialRules
    } catch {
      return initialRules
    }
  })
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(AI_CENTER_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed?.settings ? parsed.settings : initialSettings
    } catch {
      return initialSettings
    }
  })

  const [ruleModal, setRuleModal] = useState(false)
  const [editRuleId, setEditRuleId] = useState('')
  const [selectedInsightType, setSelectedInsightType] = useState('AI Dashboard')
  const [selectedAutomationType, setSelectedAutomationType] = useState('AI Chatbot')
  const [selectedRiskType, setSelectedRiskType] = useState('AI Fraud Detection')
  const [ruleForm, setRuleForm] = useState({ name: '', trigger: '', action: '', enabled: true })

  useEffect(() => {
    localStorage.setItem(AI_CENTER_STORAGE_KEY, JSON.stringify({ insights, logs, rules, settings }))
  }, [insights, logs, rules, settings])

  useEffect(() => {
    if (!page) return
    if (insightTypes.includes(page)) setSelectedInsightType(page)
    if (automationTypes.includes(page)) setSelectedAutomationType(page)
    if (riskTypes.includes(page)) setSelectedRiskType(page)
  }, [page])

  const activeGroup = useMemo(() => {
    if (page && insightTypes.includes(page)) return 'Insights'
    if (page && automationTypes.includes(page)) return 'Automation'
    if (page && riskTypes.includes(page)) return 'Risk'
    return 'Insights'
  }, [page])

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast({ type: '', message: '' }), 1600)
  }

  const addUsageLog = (moduleName, action = 'VIEW_INSIGHT') => {
    const row = {
      id: `ulg-${Date.now()}`,
      module: moduleName,
      action,
      usageCount: 1,
      actor: 'Super Admin',
      dateTime: new Date().toISOString()
    }
    setLogs((prev) => [row, ...prev])
    showToast('success', `${moduleName} usage logged`)
  }

  const visibleInsights = useMemo(() => insights.filter((item) => item.module === selectedInsightType), [insights, selectedInsightType])

  const usageCols = [
    { key: 'module', label: 'Module' },
    { key: 'action', label: 'Action' },
    { key: 'usageCount', label: 'Count' },
    { key: 'actor', label: 'Actor' },
    { key: 'dateTime', label: 'Date/Time' }
  ]

  const usageRows = useMemo(() => logs
    .filter((x) => {
      if (activeGroup === 'Insights') return insightTypes.includes(x.module)
      if (activeGroup === 'Automation') return automationTypes.includes(x.module)
      return riskTypes.includes(x.module)
    })
    .map((x) => ({ ...x, dateTime: new Date(x.dateTime).toLocaleString() })), [logs, activeGroup])

  const ruleCols = [
    { key: 'name', label: 'Rule' },
    { key: 'trigger', label: 'Trigger' },
    { key: 'action', label: 'Action' },
    { key: 'enabled', label: 'Status' }
  ]

  const ruleRows = useMemo(() => rules.map((x) => ({ ...x, enabled: x.enabled ? 'active' : 'inactive' })), [rules])

  return (
    <section className="section-layout ai-center-page">
      <PageHeader
        title={activeGroup === 'Insights' ? selectedInsightType : activeGroup === 'Automation' ? selectedAutomationType : selectedRiskType}
        description="Frontend-only AI workspace with tab-wise controls and persistent local state."
        breadcrumb={['Super Admin', 'AI Center', activeGroup]}
        primaryActionLabel="Refresh"
        onPrimaryAction={() => showToast('success', 'Refreshed (frontend state)')}
      />

      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}

      {activeGroup === 'Insights' ? (
        <>
          <div className="panel">
            <div className="form-grid">
              <FilterDropdown label="Insight Module" value={selectedInsightType} onChange={setSelectedInsightType} options={insightTypes.map((x) => ({ value: x, label: x }))} />
            </div>
          </div>

          <div className="panel">
            <h3>Insight Result</h3>
            {visibleInsights.map((insight) => (
              <div key={insight.id} className="panel" style={{ marginBottom: 10 }}>
                <strong>{insight.module}</strong>
                <p style={{ color: 'var(--muted)' }}>Score: {insight.score} | Trend: {insight.trend}</p>
                <ul style={{ marginTop: 6 }}>
                  {insight.highlights.map((h, idx) => <li key={`${insight.id}-${idx}`}>{h}</li>)}
                </ul>
                <div className="actions-row"><Button onClick={() => addUsageLog(insight.module, 'VIEW_INSIGHT')}>Log Usage</Button></div>
              </div>
            ))}
          </div>

          <div className="panel">
            <h3>AI Usage Analytics</h3>
            <DataTable columns={usageCols} rows={usageRows} showActions={false} emptyTitle="No usage logs found" />
          </div>
        </>
      ) : null}

      {activeGroup === 'Automation' ? (
        <>
          <div className="panel">
            <div className="form-grid">
              <FilterDropdown label="Automation Module" value={selectedAutomationType} onChange={setSelectedAutomationType} options={automationTypes.map((x) => ({ value: x, label: x }))} />
              <FilterDropdown label="Model Mode" value={settings.modelMode} onChange={(v) => setSettings((p) => ({ ...p, modelMode: v }))} options={[{ value: 'fast', label: 'Fast' }, { value: 'balanced', label: 'Balanced' }, { value: 'accurate', label: 'Accurate' }]} />
              <FormInput label="Auto Report Frequency" value={settings.autoReportFrequency} onChange={(e) => setSettings((p) => ({ ...p, autoReportFrequency: e.target.value }))} />
              <FormInput label="Chatbot Tone" value={settings.chatbotTone} onChange={(e) => setSettings((p) => ({ ...p, chatbotTone: e.target.value }))} />
            </div>
            <div className="actions-row" style={{ marginTop: 10 }}>
              <Button onClick={() => showToast('success', 'Automation settings saved (frontend only)')}>Save Settings</Button>
              <Button variant="ghost" onClick={() => addUsageLog(selectedAutomationType, 'RUN_AUTOMATION')}>Run {selectedAutomationType}</Button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>AI Automation Rules</h3><Button onClick={() => setRuleModal(true)}>Add Rule</Button></div>
            <DataTable
              columns={ruleCols}
              rows={ruleRows}
              showDeleteAction={false}
              onView={(row) => {
                setEditRuleId(row.id)
                setRuleForm({ name: row.name || '', trigger: row.trigger || '', action: row.action || '', enabled: row.enabled === 'active' })
                setRuleModal(true)
              }}
              onEdit={(row) => {
                setEditRuleId(row.id)
                setRuleForm({ name: row.name || '', trigger: row.trigger || '', action: row.action || '', enabled: row.enabled === 'active' })
                setRuleModal(true)
              }}
            />
          </div>
        </>
      ) : null}

      {activeGroup === 'Risk' ? (
        <>
          <div className="panel">
            <div className="form-grid">
              <FilterDropdown label="Risk Module" value={selectedRiskType} onChange={setSelectedRiskType} options={riskTypes.map((x) => ({ value: x, label: x }))} />
              <FilterDropdown label="Fraud Sensitivity" value={settings.fraudSensitivity} onChange={(v) => setSettings((p) => ({ ...p, fraudSensitivity: v }))} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
            </div>
            <div className="actions-row" style={{ marginTop: 10 }}>
              <Button onClick={() => addUsageLog('AI Fraud Detection', 'SCAN_TRIGGER')}>Run Risk Scan</Button>
              <Button variant="ghost" onClick={() => showToast('success', 'Risk settings saved (frontend only)')}>Save Risk Settings</Button>
            </div>
          </div>

          <div className="panel">
            <h3>Risk Activity Logs</h3>
            <DataTable columns={usageCols} rows={usageRows} showActions={false} emptyTitle="No risk logs found" />
          </div>
        </>
      ) : null}

      <Modal open={ruleModal} title={editRuleId ? 'Update Automation Rule' : 'Create Automation Rule'} onClose={() => { setRuleModal(false); setEditRuleId('') }}>
        <div className="form-grid">
          <FormInput label="Name" value={ruleForm.name} onChange={(e) => setRuleForm((p) => ({ ...p, name: e.target.value }))} />
          <FormInput label="Trigger" value={ruleForm.trigger} onChange={(e) => setRuleForm((p) => ({ ...p, trigger: e.target.value }))} />
          <FormInput label="Action" value={ruleForm.action} onChange={(e) => setRuleForm((p) => ({ ...p, action: e.target.value }))} />
          <FilterDropdown label="Status" value={ruleForm.enabled ? 'enabled' : 'disabled'} onChange={(v) => setRuleForm((p) => ({ ...p, enabled: v === 'enabled' }))} options={[{ value: 'enabled', label: 'Enabled' }, { value: 'disabled', label: 'Disabled' }]} />
        </div>
        <div className="actions-row">
          <Button onClick={() => {
            if (!ruleForm.name || !ruleForm.trigger || !ruleForm.action) return showToast('error', 'All fields required')
            if (editRuleId) {
              setRules((prev) => prev.map((r) => (r.id === editRuleId ? { ...r, ...ruleForm } : r)))
              showToast('success', 'Rule updated (frontend only)')
            } else {
              setRules((prev) => [{ id: `rule-${Date.now()}`, ...ruleForm }, ...prev])
              showToast('success', 'Rule created (frontend only)')
            }
            setRuleModal(false)
            setEditRuleId('')
            setRuleForm({ name: '', trigger: '', action: '', enabled: true })
          }}>{editRuleId ? 'Update Rule' : 'Save Rule'}</Button>
        </div>
      </Modal>
    </section>
  )
}

export default AICenterModulePage

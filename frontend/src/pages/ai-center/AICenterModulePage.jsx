import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FormInput from '../../components/ui/FormInput'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import { createAIUsageLog, createAutomationRule, getAIInsights, listAISettings, listAIUsageLogs, listAutomationRules, saveAISetting, updateAutomationRule } from '../../api/aiCenterApi'

const insightModules = [
  'AI Dashboard',
  'Attendance Insights',
  'Attrition Prediction',
  'Payroll Analytics',
  'AI Chatbot',
  'Auto Reports',
  'Fraud Detection'
]

const sectionByPage = {
  'AI Dashboard': 'ai-insights-section',
  'AI Attendance Insights': 'ai-insights-section',
  'AI Attrition Prediction': 'ai-insights-section',
  'AI Payroll Analytics': 'ai-insights-section',
  'AI Chatbot': 'ai-insights-section',
  'AI Auto Reports': 'ai-insights-section',
  'AI Fraud Detection': 'ai-insights-section',
  'AI Usage Analytics': 'ai-usage-section',
  'AI Automation Rules': 'ai-rules-section'
}

function AICenterModulePage({ page }) {
  const [insights, setInsights] = useState([])
  const [settings, setSettings] = useState([])
  const [logs, setLogs] = useState([])
  const [rules, setRules] = useState([])
  const [toast, setToast] = useState({ type: '', message: '' })
  const [ruleModal, setRuleModal] = useState(false)
  const [editRuleId, setEditRuleId] = useState('')
  const [ruleForm, setRuleForm] = useState({ name: '', trigger: '', action: '', enabled: true })
  const [loading, setLoading] = useState(false)

  const toastOk = (m) => setToast({ type: 'success', message: m })
  const toastError = (m) => setToast({ type: 'error', message: m })

  const load = async () => {
    setLoading(true)
    try {
      const [insightResponses, st, lg, rl] = await Promise.all([
        Promise.all(insightModules.map((moduleName) => getAIInsights(moduleName))),
        listAISettings(),
        listAIUsageLogs({ page: 1, limit: 50, module: 'all' }),
        listAutomationRules()
      ])

      setInsights(insightResponses)
      setSettings(st.items)
      setLogs(lg.items)
      setRules(rl.items)
    } catch (e) {
      toastError(e?.response?.data?.message || 'Failed to load AI data')
    } finally {
      setLoading(false)
    }
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

  const logCols = [{ key: 'module', label: 'Module' }, { key: 'action', label: 'Action' }, { key: 'usageCount', label: 'Count' }, { key: 'actor', label: 'Actor' }, { key: 'dateTime', label: 'Date/Time' }]
  const logRows = useMemo(() => logs.map((x) => ({ id: x._id, module: x.module, action: x.action, usageCount: x.usageCount, actor: x.actor, dateTime: new Date(x.dateTime).toLocaleString() })), [logs])

  const ruleCols = [{ key: 'name', label: 'Rule' }, { key: 'trigger', label: 'Trigger' }, { key: 'action', label: 'Action' }, { key: 'enabled', label: 'Status' }]
  const ruleRows = useMemo(() => rules.map((x) => ({ id: x._id, name: x.name, trigger: x.trigger, action: x.action, enabled: x.enabled ? 'active' : 'inactive' })), [rules])

  return (
    <section className="section-layout">
      <PageHeader
        title="AI Center"
        description="Single-page AI workspace for insights, settings, usage analytics, and automation rules."
        breadcrumb={['Super Admin', 'AI Center', 'Workspace']}
        primaryActionLabel="Refresh"
        onPrimaryAction={load}
      />

      {toast.message ? <div className={`toast toast-${toast.type}`}>{toast.message}</div> : null}
      {loading ? <div className="panel"><LoadingSkeleton rows={5} /></div> : null}

      <div className="panel">
        <div className="panel-head"><h3>All AI Controls In One Page</h3></div>
        <p>Manage AI insights, platform settings, usage telemetry, and automation rules in one unified workspace.</p>
      </div>

      <div id="ai-insights-section" className="panel">
        <h3>AI Insights</h3>
        <div className="permission-grid">
          {insights.map((insight) => (
            <div key={insight.module} className="permission-card">
              <h4>{insight.module}</h4>
              <pre className="form-input" style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(insight.data || {}, null, 2)}</pre>
              <Button onClick={async () => { try { const res = await createAIUsageLog({ module: insight.module, action: 'VIEW_INSIGHT', usageCount: 1, actor: 'Super Admin' }); toastOk(res?.message || 'Usage log created'); load() } catch (error) { toastError(error?.response?.data?.message || 'Failed to log usage') } }}>Log Usage</Button>
            </div>
          ))}
        </div>
        {!loading && insights.length === 0 ? <EmptyState title="No AI insights available" /> : null}
      </div>

      <div id="ai-settings-section" className="panel">
        <h3>AI Settings</h3>
        {settings.length === 0 ? <EmptyState title="No AI settings yet" /> : settings.map((s) => (
          <div key={s._id} className="inline-action-card">
            <strong>{s.key}</strong>
            <span>{s.description || '-'}</span>
            <Button variant="ghost" onClick={async () => { try { const res = await saveAISetting({ key: s.key, value: s.value, description: s.description }); toastOk(res?.message || 'Setting saved') } catch (error) { toastError(error?.response?.data?.message || 'Failed to save setting') } }}>Save</Button>
          </div>
        ))}
      </div>

      <div id="ai-usage-section" className="panel">
        <h3>AI Usage Analytics</h3>
        <DataTable columns={logCols} rows={logRows} showActions={false} />
        {!loading && logRows.length === 0 ? <EmptyState title="No AI usage logs found" /> : null}
      </div>

      <div id="ai-rules-section" className="panel">
        <div className="panel-head"><h3>AI Automation Rules</h3><Button onClick={() => setRuleModal(true)}>Add Rule</Button></div>
        <DataTable columns={ruleCols} rows={ruleRows} showDeleteAction={false} onView={(row) => {
          const r = rules.find((x) => x._id === row.id)
          if (!r) return
          setEditRuleId(r._id)
          setRuleForm({ name: r.name || '', trigger: r.trigger || '', action: r.action || '', enabled: !!r.enabled })
          setRuleModal(true)
        }} onEdit={(row) => {
          const r = rules.find((x) => x._id === row.id)
          if (!r) return
          setEditRuleId(r._id)
          setRuleForm({ name: r.name || '', trigger: r.trigger || '', action: r.action || '', enabled: !!r.enabled })
          setRuleModal(true)
        }} />
        {!loading && ruleRows.length === 0 ? <EmptyState title="No automation rules found" /> : null}
      </div>

      <Modal open={ruleModal} title={editRuleId ? 'Update Automation Rule' : 'Create Automation Rule'} onClose={() => { setRuleModal(false); setEditRuleId('') }}>
        <div className="form-grid">
          <FormInput label="Name" value={ruleForm.name} onChange={(e) => setRuleForm((p) => ({ ...p, name: e.target.value }))} />
          <FormInput label="Trigger" value={ruleForm.trigger} onChange={(e) => setRuleForm((p) => ({ ...p, trigger: e.target.value }))} />
          <FormInput label="Action" value={ruleForm.action} onChange={(e) => setRuleForm((p) => ({ ...p, action: e.target.value }))} />
        </div>
        <div className="actions-row">
          <Button onClick={async () => {
            if (!ruleForm.name || !ruleForm.trigger || !ruleForm.action) return toastError('All fields required')
            try {
              if (editRuleId) {
                const res = await updateAutomationRule(editRuleId, ruleForm)
                toastOk(res?.message || 'Rule updated')
              } else {
                const res = await createAutomationRule(ruleForm)
                toastOk(res?.message || 'Rule created')
              }
              setRuleModal(false)
              setEditRuleId('')
              setRuleForm({ name: '', trigger: '', action: '', enabled: true })
              load()
            } catch (error) {
              toastError(error?.response?.data?.message || (editRuleId ? 'Failed to update rule' : 'Failed to create rule'))
            }
          }}>{editRuleId ? 'Update Rule' : 'Save Rule'}</Button>
        </div>
      </Modal>
    </section>
  )
}

export default AICenterModulePage

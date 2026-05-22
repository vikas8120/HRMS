import { Suspense, lazy, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  KanbanSquare,
  LayoutDashboard,
  ListChecks,
  MessageCircle,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Users,
  Phone,
  Mail,
  History,
  Plus
} from 'lucide-react'
import '../styles-premium-crm.css'

const PremiumDashboardView = lazy(() => import('./premium/PremiumDashboardView'))
const PremiumAnalyticsView = lazy(() => import('./premium/PremiumAnalyticsView'))

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'leads', label: 'Leads', icon: Target },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'pipeline', label: 'Sales Pipeline', icon: KanbanSquare },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'tasks', label: 'Tasks', icon: ListChecks },
  { key: 'calendar', label: 'Calendar', icon: Calendar },
  { key: 'messages', label: 'Messages', icon: MessageCircle },
  { key: 'marketing', label: 'Marketing', icon: TrendingUp },
  { key: 'ai', label: 'AI Assistant', icon: Bot },
  { key: 'support', label: 'Support', icon: Activity },
  { key: 'settings', label: 'Settings', icon: Settings }
]

const heroStats = [
  { label: 'Total Revenue', value: '$4,281,900', delta: '+12.4%' },
  { label: 'Qualified Leads', value: '2,459', delta: '+8.1%' },
  { label: 'Churn Rate', value: '1.8%', delta: '-2.4%' },
  { label: 'Predictive Health', value: '94/100', delta: 'Optimal', accent: true }
]

const customers = [
  { id: 1, name: 'Sophia Chen', email: 'sophia@neotech.io', company: 'NeoTech Solutions', status: 'success' },
  { id: 2, name: 'Marcus Knight', email: 'm.knight@stratus.com', company: 'Stratus Cloud Services', status: 'warning' },
  { id: 3, name: 'Julia Lang', email: 'julia@quantum.ai', company: 'Quantum Analytics', status: 'success' }
]

const pipelineColumns = {
  'New Lead': [
    { title: 'Starlight Tech - Series B', value: '$450,000', tag: 'High Priority', meta: '2d ago' },
    { title: 'Nexus Logistics Expansion', value: '$125,000', tag: 'Medium', meta: '5d ago' }
  ],
  Contacted: [
    { title: 'Aether Analytics SaaS', value: '$280,000', tag: 'Hot Lead', meta: 'Replied' }
  ],
  Proposal: [
    { title: 'Global Retail Core Ops', value: '$1,200,000', tag: 'Draft Sent', meta: 'Exp. 13d' }
  ]
}

function LandingSection({ onEnter }) {
  return (
    <div className="crm-landing">
      <div className="crm-bg-blobs" />
      <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
        LuxCRM AI Enterprise Workspace
      </motion.h1>
      <p>Premium AI-native CRM for executive operations, customer intelligence, and high-performance pipeline control.</p>
      <div className="crm-cta-row">
        <button className="crm-btn crm-btn-primary" onClick={onEnter}>Enter Workspace</button>
        <button className="crm-btn crm-btn-glass">Request Live Demo</button>
      </div>
    </div>
  )
}

function DashboardReferenceView() {
  return (
    <div className="crm-reference-grid">
      <section className="crm-reference-left">
        <div className="crm-title-row">
          <div>
            <h1>Executive Overview</h1>
            <p>Real-time performance metrics for Q3 Enterprise operations.</p>
          </div>
          <div className="crm-title-actions">
            <button className="crm-chip-btn">Last 30 Days</button>
            <button className="crm-chip-btn primary">Generate Report</button>
          </div>
        </div>
        <div className="crm-stat-row">
          {heroStats.map((s) => (
            <div key={s.label} className={`crm-stat-card ${s.accent ? 'accent' : ''}`}>
              <div className="crm-stat-delta">{s.delta}</div>
              <p>{s.label}</p>
              <h3>{s.value}</h3>
            </div>
          ))}
        </div>
        <div className="crm-glass-card chart-mock">
          <h3>Revenue Analytics</h3>
          <div className="bars">{[35, 52, 40, 64, 58, 76, 68, 86].map((h, i) => <span key={i} style={{ height: `${h}%` }} className={i === 7 ? 'active' : ''} />)}</div>
        </div>
      </section>
      <aside className="crm-reference-right crm-glass-card">
        <h3><Sparkles size={16} /> AI Insights</h3>
        <div className="crm-insight-box">
          <h4>Predictive Alert</h4>
          <p>High churn probability detected for 4 enterprise accounts in Tech-SaaS vertical.</p>
        </div>
        <ul className="crm-list">
          <li>How does current revenue compare to 2023 baseline?</li>
          <li>Show top performing leads from LinkedIn ads.</li>
          <li>Draft a follow-up for the Acropolis Global deal.</li>
        </ul>
      </aside>
    </div>
  )
}

function CustomersReferenceView() {
  return (
    <div className="crm-reference-grid customers-layout">
      <section className="crm-reference-left">
        <h1>Customer Ecosystem</h1>
        <p>Managing 1,284 premium accounts with AI-driven retention scoring.</p>
        <div className="crm-stat-row compact">
          <div className="crm-stat-card"><p>Total LTV</p><h3>$12.4M</h3></div>
          <div className="crm-stat-card"><p>Churn Risk</p><h3>2.4%</h3></div>
          <div className="crm-stat-card"><p>Active Programs</p><h3>48</h3></div>
        </div>
        <div className="crm-glass-card">
          <table className="crm-table">
            <thead><tr><th>Customer Name</th><th>Company</th><th>Status</th></tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong><small>{c.email}</small></td>
                  <td>{c.company}</td>
                  <td><span className={`crm-status ${c.status}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <aside className="crm-drawer crm-glass-card">
        <button className="crm-close-btn">×</button>
        <div className="crm-avatar">SC</div>
        <h2>Sophia Chen</h2>
        <p>VP of Engineering at NeoTech Solutions</p>
        <div className="crm-drawer-actions">
          <button className="crm-chip-btn primary"><Mail size={14} /> Email</button>
          <button className="crm-chip-btn"><Phone size={14} /> Call</button>
        </div>
        <div className="crm-insight-box"><strong>Health Score:</strong> 94/100</div>
        <div className="crm-history">
          <h4>Activity History</h4>
          <p><History size={14} /> Slack conversation summary generated by AI</p>
          <p><History size={14} /> Contract expansion signed</p>
          <p><History size={14} /> Quarterly business review</p>
        </div>
      </aside>
    </div>
  )
}

function PipelineReferenceView() {
  return (
    <div className="crm-reference-grid pipeline-layout">
      <section className="crm-reference-left">
        <div className="crm-stat-row compact">
          <div className="crm-stat-card"><p>Total Pipeline Value</p><h3>$12,482,000</h3></div>
          <div className="crm-stat-card"><p>Expected Close (Q3)</p><h3>$4,820,000</h3></div>
          <div className="crm-stat-card"><p>AI Lead Scoring</p><h3>88/100</h3></div>
        </div>
        <div className="crm-pipeline-board">
          {Object.entries(pipelineColumns).map(([col, cards]) => (
            <div key={col} className="crm-pipeline-column">
              <h4>{col}</h4>
              {cards.map((card) => (
                <div key={card.title} className="crm-deal-card">
                  <span className="crm-deal-tag">{card.tag}</span>
                  <strong>{card.title}</strong>
                  <p>{card.value}</p>
                  <small>{card.meta}</small>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
      <button className="crm-fab"><Plus size={24} /></button>
    </div>
  )
}

function AIView() {
  return (
    <div className="crm-view-grid">
      <div className="crm-glass-card"><h3>AI Assistant</h3><p>Use the side menu to explore the luxury workflow modules.</p></div>
    </div>
  )
}

function PremiumCRMPage() {
  const [entered, setEntered] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [active, setActive] = useState('dashboard')

  const content = useMemo(() => {
    if (active === 'dashboard') return <Suspense fallback={<div className="crm-glass-card">Loading dashboard...</div>}><PremiumDashboardView /></Suspense>
    if (active === 'customers') return <CustomersReferenceView />
    if (active === 'pipeline') return <PipelineReferenceView />
    if (active === 'analytics') return <Suspense fallback={<div className="crm-glass-card">Loading analytics...</div>}><PremiumAnalyticsView /></Suspense>
    if (active === 'ai') return <AIView />
    if (active === 'tasks' || active === 'calendar') return <Suspense fallback={<div className="crm-glass-card">Loading dashboard...</div>}><PremiumDashboardView /></Suspense>
    return <DashboardReferenceView />
  }, [active])

  if (!entered) return <LandingSection onEnter={() => setEntered(true)} />

  return (
    <div className="crm-shell">
      <aside className={`crm-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <button className="crm-collapse" onClick={() => setCollapsed((v) => !v)}>{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button>
        <div className="crm-brand"><Sparkles size={16} /> {!collapsed ? 'LuxCRM AI' : ''}</div>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button key={item.key} className={`crm-nav-item ${active === item.key ? 'active' : ''}`} onClick={() => setActive(item.key)}>
              <Icon size={17} />
              {!collapsed ? <span>{item.label}</span> : null}
            </button>
          )
        })}
      </aside>
      <main className="crm-main">
        <div className="crm-header-bar">
          <div className="crm-search"><Search size={16} /><input placeholder="Search customers, companies, or insights..." /></div>
          <div className="crm-head-icons"><Bell size={18} /><Clock3 size={18} /><User size={18} /></div>
        </div>
        <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
          {content}
        </motion.div>
      </main>
    </div>
  )
}

export default PremiumCRMPage

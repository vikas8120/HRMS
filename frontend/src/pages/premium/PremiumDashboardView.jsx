import { motion } from 'framer-motion'
import { CheckCircle2, CircleDollarSign, Sparkles, Target, TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const kpis = [
  { label: 'Revenue', value: '$2.84M', delta: '+19.8%', icon: CircleDollarSign },
  { label: 'Active Leads', value: '12,409', delta: '+8.2%', icon: Target },
  { label: 'Won Deals', value: '942', delta: '+12.6%', icon: CheckCircle2 },
  { label: 'Avg. Deal Size', value: '$18.7k', delta: '+6.4%', icon: TrendingUp }
]

const trendData = [
  { name: 'Jan', revenue: 110, leads: 60 },
  { name: 'Feb', revenue: 128, leads: 72 },
  { name: 'Mar', revenue: 138, leads: 74 },
  { name: 'Apr', revenue: 160, leads: 90 },
  { name: 'May', revenue: 178, leads: 105 },
  { name: 'Jun', revenue: 194, leads: 120 }
]

function PremiumDashboardView() {
  return (
    <div className="crm-view-grid">
      <div className="crm-kpi-grid">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <motion.div key={k.label} className="crm-glass-card crm-kpi" whileHover={{ y: -3 }}>
              <div><p>{k.label}</p><h3>{k.value}</h3><small>{k.delta}</small></div>
              <Icon size={20} />
            </motion.div>
          )
        })}
      </div>
      <div className="crm-glass-card crm-chart-card">
        <h3>Revenue & Lead Growth</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6C63FF" stopOpacity={0.7} /><stop offset="100%" stopColor="#6C63FF" stopOpacity={0.06} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#33415566" />
            <XAxis dataKey="name" stroke="#cbd5e1" />
            <YAxis stroke="#cbd5e1" />
            <Tooltip />
            <Area type="monotone" dataKey="revenue" stroke="#6C63FF" fill="url(#rev)" />
            <Line type="monotone" dataKey="leads" stroke="#06B6D4" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="crm-glass-card">
        <h3>AI Insights</h3>
        <ul className="crm-list">
          <li><Sparkles size={14} /> Best follow-up time: 11:30 AM for +17% response rate.</li>
          <li><Sparkles size={14} /> 3 at-risk enterprise accounts need escalation.</li>
          <li><Sparkles size={14} /> Forecast predicts 124% quota attainment this month.</li>
        </ul>
      </div>
    </div>
  )
}

export default PremiumDashboardView

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const retentionData = [
  { name: 'Q1', retention: 92, churn: 8 },
  { name: 'Q2', retention: 94, churn: 6 },
  { name: 'Q3', retention: 95, churn: 5 },
  { name: 'Q4', retention: 96, churn: 4 }
]

const segmentData = [
  { name: 'Enterprise', value: 42, color: '#6C63FF' },
  { name: 'SMB', value: 31, color: '#8B5CF6' },
  { name: 'Mid Market', value: 27, color: '#06B6D4' }
]

const trendData = [
  { name: 'Jan', revenue: 110 },
  { name: 'Feb', revenue: 128 },
  { name: 'Mar', revenue: 138 },
  { name: 'Apr', revenue: 160 },
  { name: 'May', revenue: 178 },
  { name: 'Jun', revenue: 194 }
]

function PremiumAnalyticsView() {
  return (
    <div className="crm-view-grid">
      <div className="crm-glass-card crm-chart-card">
        <h3>Retention vs Churn</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={retentionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#33415566" />
            <XAxis dataKey="name" stroke="#cbd5e1" />
            <YAxis stroke="#cbd5e1" />
            <Tooltip />
            <Bar dataKey="retention" fill="#10B981" radius={[8, 8, 0, 0]} />
            <Bar dataKey="churn" fill="#EF4444" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="crm-glass-card crm-chart-card">
        <h3>Segment Split</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={segmentData} cx="50%" cy="50%" dataKey="value" outerRadius={75}>
              {segmentData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="crm-glass-card crm-chart-card">
        <h3>AI Forecasting</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#33415566" />
            <XAxis dataKey="name" stroke="#cbd5e1" />
            <YAxis stroke="#cbd5e1" />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default PremiumAnalyticsView

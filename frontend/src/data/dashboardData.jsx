import {
  LayoutDashboard, Building2, UserCog, CreditCard, BarChart3, Sparkles, LifeBuoy,
  Shield, Plug, Brain, Database, FileText, Settings, Activity, Receipt, Bot, Users
} from 'lucide-react'

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\//g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const moduleRegistry = [
  { label: 'Dashboard', icon: LayoutDashboard, items: [] },
  { label: 'Company Management', icon: Building2, items: ['Company Management', 'Company Branding', 'Branch Management', 'Company Storage Usage', 'Company Domain Setup', 'Company Activity Logs', 'Company Configuration', 'Company Suspension', 'Company Reactivation'] },
  { label: 'Admin Management', icon: UserCog, items: ['Admin Management', 'Reset Password', 'Admin Access Logs', 'Admin Activity Tracking', 'Account Lock/Unlock', 'Role Assignment', 'Permission Control'] },
  { label: 'Subscription & Billing', icon: CreditCard, items: ['Subscription Plans', 'Feature Mapping', 'Plan Limits', 'Add-on Services', 'Plan Upgrade/Downgrade', 'Auto Renewal', 'Subscription History', 'Invoice Management', 'Generate Invoice', 'Payment Tracking', 'Discount Coupons'] },
  { label: 'Revenue & Analytics', icon: BarChart3, items: ['Monthly Revenue', 'Annual Revenue', 'MRR Analytics', 'ARR Analytics', 'Revenue Forecasting', 'Churn Analytics', 'Renewal Rate', 'Revenue by Plan', 'Top Paying Customers'] },
  { label: 'Feature Management', icon: Sparkles, items: ['Module Enable/Disable', 'Tenant-wise Features', 'Plan-wise Features', 'API Feature Access', 'Usage Limits', 'AI Feature Access'] },
  { label: 'Support Center', icon: LifeBuoy, items: ['Ticket Dashboard', 'Open Tickets', 'Closed Tickets', 'Escalated Tickets'] },
  { label: 'Audit & Security', icon: Shield, items: ['All Logs', 'Login Logs', 'User Activity Logs', 'Company Activity Logs', 'Admin Activity Logs', 'API Logs', 'Security Logs', 'Configuration Changes', 'Permission Changes', 'Billing Logs', 'IP Tracking', 'Device Logs', 'Export Logs', 'Password Policies', 'Two-Factor Authentication', 'SSO Settings', 'OAuth Settings', 'IP Whitelisting', 'Session Timeout', 'Captcha Settings', 'Token Expiry Settings', 'Threat Monitoring'] },
  { label: 'Integrations', icon: Plug, items: ['Biometric Devices', 'Google Workspace', 'Microsoft 365', 'Slack', 'Zoom', 'Teams', 'Payment Gateway', 'Accounting Software', 'Email Integration', 'SMS Gateway', 'WhatsApp API', 'Maps API', 'Webhooks', 'Third-party Marketplace'] },
  { label: 'AI Center', icon: Brain, items: ['AI Dashboard', 'AI Attendance Insights', 'AI Attrition Prediction', 'AI Payroll Analytics', 'AI Chatbot', 'AI Auto Reports', 'AI Fraud Detection', 'AI Usage Analytics', 'AI Automation Rules'] },
  { label: 'Backup & Restore', icon: Database, items: ['Database Backup', 'File Backup', 'Automatic Backup', 'Manual Backup', 'Restore Database', 'Restore Files', 'Backup Scheduling', 'Cloud Backup', 'Backup Encryption', 'Backup Logs', 'Disaster Recovery'] },
  { label: 'Reports', icon: FileText, items: ['Tenant Reports', 'Revenue Reports', 'Subscription Reports', 'User Reports', 'Security Reports', 'Login Reports', 'API Usage Reports', 'Support Reports', 'Storage Reports', 'System Health Reports', 'Billing Reports', 'Audit Reports', 'Export Center'] },
  { label: 'System Settings', icon: Settings, items: ['General Settings', 'Email Settings', 'SMS Settings', 'WhatsApp Settings', 'Notification Templates', 'Timezone Settings', 'Currency Settings', 'Language Settings', 'Theme Management', 'Branding Settings', 'Date Format', 'File Upload Limits', 'Maintenance Mode', 'Application Version'] }
]

export const navItems = moduleRegistry.map((module) => {
  const root = '/super-admin'
  const base = module.label === 'Dashboard' ? `${root}/dashboard` : `${root}/${slugify(module.label)}`
  return {
    label: module.label,
    icon: module.icon,
    path: base,
    children: module.items.map((item) => ({ label: item, path: `${base}/${slugify(item)}` }))
  }
})

export const dashboardStats = [
  { title: 'Total Companies', value: '248', trend: '+12 this month', icon: Building2 },
  { title: 'Active Users', value: '14,923', trend: '+8.4%', icon: Users },
  { title: 'Active Subscriptions', value: '223', trend: '89.9% renewal rate', icon: Receipt },
  { title: 'Monthly Revenue', value: '$184,200', trend: '+11.2%', icon: BarChart3 },
  { title: 'Pending Renewals', value: '17', trend: 'Needs follow-up', icon: CreditCard },
  { title: 'Open Tickets', value: '26', trend: '5 critical', icon: LifeBuoy },
  { title: 'System Health', value: '99.96%', trend: 'All services stable', icon: Activity },
  { title: 'AI Agents Running', value: '41', trend: 'Across all tenants', icon: Bot }
]

export const recentActivities = [
  { id: 'ACT-101', actor: 'System', action: 'Nightly backup completed', time: '5 mins ago', severity: 'success' },
  { id: 'ACT-102', actor: 'Billing Bot', action: 'Processed 14 invoices', time: '18 mins ago', severity: 'info' },
  { id: 'ACT-103', actor: 'Security Monitor', action: 'Blocked suspicious login attempt', time: '29 mins ago', severity: 'warning' },
  { id: 'ACT-104', actor: 'Support', action: 'Ticket #824 assigned to Tier-2', time: '47 mins ago', severity: 'info' }
]

export const buildModuleRows = (title) =>
  Array.from({ length: 8 }).map((_, index) => ({
    id: `${slugify(title).slice(0, 4).toUpperCase()}-${index + 1}`,
    name: `${title} Item ${index + 1}`,
    status: index % 2 === 0 ? 'Active' : 'Pending',
    owner: ['Platform Team', 'Finance Team', 'Security Team'][index % 3],
    updated: `${index + 1}h ago`
  }))


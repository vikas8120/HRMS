const DEMO_DB_KEY = 'hrms_demo_db_v2'

const now = new Date()
const nowIso = now.toISOString()

const seedDb = () => ({
  users: [
    { id: 'u-super', name: 'Super Admin', email: 'super@demo.com', role: 'platform_admin', password: 'demo123' },
    { id: 'u-admin', name: 'Company Admin', email: 'admin@demo.com', role: 'admin', password: 'demo123' },
    { id: 'u-hr', name: 'HR Manager', email: 'hr@demo.com', role: 'hr', password: 'demo123' },
    { id: 'u-manager', name: 'Team Manager', email: 'manager@demo.com', role: 'manager', password: 'demo123' },
    { id: 'u-employee', name: 'John Employee', email: 'employee@demo.com', role: 'employee', password: 'demo123' }
  ],
  employees: [
    { id: 'emp-001', employeeId: 'EMP001', name: 'John Employee', role: 'Developer', department: 'Engineering', departmentId: 'dep-01', status: 'active' },
    { id: 'emp-002', employeeId: 'EMP002', name: 'Sara QA', role: 'QA Engineer', department: 'Engineering', departmentId: 'dep-01', status: 'active' },
    { id: 'emp-003', employeeId: 'EMP003', name: 'Mia Designer', role: 'UI/UX Designer', department: 'Design', departmentId: 'dep-02', status: 'active' },
    { id: 'emp-004', employeeId: 'EMP004', name: 'Arjun Analyst', role: 'Business Analyst', department: 'Engineering', departmentId: 'dep-01', status: 'active' },
    { id: 'emp-005', employeeId: 'EMP005', name: 'Neha Support', role: 'Support Engineer', department: 'Engineering', departmentId: 'dep-01', status: 'active' }
  ],
  managers: [
    { id: 'mgr-01', name: 'Team Manager', email: 'manager@demo.com', status: 'active', departmentId: 'dep-01' }
  ],
  hrUsers: [
    { id: 'hr-01', name: 'HR Manager', email: 'hr@demo.com', status: 'active' }
  ],
  departments: [
    { id: 'dep-01', name: 'Engineering', manager: 'Team Manager' },
    { id: 'dep-02', name: 'Design', manager: 'HR Manager' }
  ],
  documents: [
    { id: 'doc-01', title: 'PAN Card', employeeId: 'emp-001', employeeName: 'John Employee', category: 'id-proof', status: 'active', verified: true, fileUrl: '/uploads/documents/demo-pan.pdf', createdAt: nowIso },
    { id: 'doc-02', title: 'Address Proof', employeeId: 'emp-001', employeeName: 'John Employee', category: 'address-proof', status: 'pending', verified: false, fileUrl: '/uploads/documents/demo-address.pdf', createdAt: nowIso }
  ],
  announcements: [
    { id: 'ann-01', title: 'Townhall Friday', message: 'Monthly townhall at 5 PM.', createdAt: nowIso, priority: 'high' }
  ],
  tasks: [
    { id: 'task-01', title: 'Finish onboarding docs', status: 'in-progress', dueDate: nowIso, priority: 'medium' },
    { id: 'task-02', title: 'Review sprint backlog', status: 'completed', dueDate: nowIso, priority: 'medium' },
    { id: 'task-03', title: 'Escalation response', status: 'overdue', dueDate: new Date(Date.now() - 86400000).toISOString(), priority: 'high' },
    { id: 'task-04', title: '1:1 with team members', status: 'active', dueDate: new Date(Date.now() + 86400000).toISOString(), priority: 'low' },
    { id: 'task-05', title: 'Attendance anomaly check', status: 'completed', dueDate: nowIso, priority: 'medium' }
  ],
  tickets: [
    { id: 'tic-01', ticketNo: 'TCK-1001', subject: 'Laptop issue', description: 'Keyboard not working', status: 'open', priority: 'medium', createdAt: nowIso, messages: [] }
  ],
  payroll: [
    {
      id: 'pay-01',
      employeeId: 'emp-001',
      employeeName: 'John Employee',
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      netSalary: 78000,
      grossSalary: 90000,
      bonus: 4000,
      deductions: 12000,
      tax: 6000,
      status: 'paid'
    },
    {
      id: 'pay-02',
      employeeId: 'emp-002',
      employeeName: 'Sara QA',
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      netSalary: 72000,
      grossSalary: 84000,
      bonus: 3000,
      deductions: 11000,
      tax: 5000,
      status: 'generated'
    },
    {
      id: 'pay-03',
      employeeId: 'emp-003',
      employeeName: 'Mia Designer',
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      netSalary: 69000,
      grossSalary: 81000,
      bonus: 2500,
      deductions: 10500,
      tax: 4500,
      status: 'pending'
    }
  ],
  attendance: [
    { id: 'att-01', employeeId: 'emp-001', employeeName: 'John Employee', departmentId: 'dep-01', date: nowIso.slice(0, 10), checkIn: '09:34', checkOut: '18:12', status: 'present', workingHours: 8.6 },
    { id: 'att-02', employeeId: 'emp-002', employeeName: 'Sara QA', departmentId: 'dep-01', date: nowIso.slice(0, 10), checkIn: '10:08', checkOut: '18:25', status: 'late', workingHours: 8.0 },
    { id: 'att-03', employeeId: 'emp-003', employeeName: 'Mia Designer', departmentId: 'dep-02', date: nowIso.slice(0, 10), checkIn: '', checkOut: '', status: 'absent', workingHours: 0 },
    { id: 'att-04', employeeId: 'emp-004', employeeName: 'Arjun Analyst', departmentId: 'dep-01', date: nowIso.slice(0, 10), checkIn: '09:12', checkOut: '18:05', status: 'present', workingHours: 8.7 },
    { id: 'att-05', employeeId: 'emp-005', employeeName: 'Neha Support', departmentId: 'dep-01', date: nowIso.slice(0, 10), checkIn: '09:48', checkOut: '18:15', status: 'present', workingHours: 8.2 }
  ],
  companies: [
    {
      id: 'cmp-01',
      companyName: 'Acme Corp',
      companyCode: 'ACME',
      industry: 'Software',
      email: 'info@acme.com',
      phone: '+91-9999999999',
      address: 'Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      gst: '29ABCDE1234F1Z5',
      pan: 'ABCDE1234F',
      plan: 'Starter',
      employeeLimit: 100,
      storageLimit: 50,
      status: 'active',
      createdAt: nowIso,
      branches: [
        { _id: 'br-01', name: 'HQ', code: 'HQ', city: 'Bangalore', manager: 'Team Manager', phone: '+91-9999999999', status: 'active' }
      ],
      storageUsage: { usedStorage: 7.2, documentsCount: 124, backupSize: 2.1 },
      branding: { logoUrl: '', primaryColor: '#0f766e', secondaryColor: '#115e59', customDomain: '', loginPageBranding: '' },
      domainSetup: { customDomain: 'acme.local', verified: true, sslStatus: 'active' }
    }
  ],
  plans: [{ id: 'pln-01', name: 'Starter', price: 49, status: 'active' }],
  subscriptions: [{ id: 'sub-01', companyId: 'cmp-01', planId: 'pln-01', status: 'active' }],
  invoices: [{ id: 'inv-01', number: 'INV-1001', amount: 49, status: 'paid' }],
  payments: [{ id: 'paym-01', invoiceId: 'inv-01', amount: 49, status: 'success' }],
  coupons: [{ id: 'cpn-01', code: 'WELCOME10', discount: 10 }],
  addons: [{ id: 'add-01', name: 'Advanced Analytics', price: 19 }],
  reports: [{ id: 'rep-01', title: 'Monthly HR Summary', createdAt: nowIso }],
  integrations: [{ id: 'int-01', name: 'Slack', status: 'connected' }],
  supportAgents: [{ id: 'sa-01', name: 'Nora Agent' }],
  supportCategories: [{ id: 'sc-01', name: 'Technical' }],
  auditLogs: [{ id: 'aud-01', category: 'Security Logs', action: 'LOGIN', actorName: 'Super Admin', createdAt: nowIso }],
  systemSettings: [{ key: 'timezone', value: 'Asia/Kolkata' }],
  featureFlags: [{ key: 'beta_analytics', enabled: true }],
  dashboardWidgets: [{ id: 'wid-01', section: 'overview', title: 'Active Users', value: 1240 }],
  aiSettings: [{ key: 'model', value: 'gpt-5.4-mini' }],
  automationRules: [{ id: 'ar-01', name: 'Low Attendance Alert', enabled: true }],
  globalUsers: [{ id: 'gu-01', name: 'Asha User', email: 'asha@acme.com', status: 'active' }],
  superAdmins: [{ id: 'sa-admin-01', name: 'Platform Owner', email: 'owner@demo.com', status: 'active' }],
  roles: [{ id: 'role-01', name: 'Admin', permissions: ['read', 'write'] }],
  platformOverview: [{ id: 'po-01', metric: 'Uptime', value: '99.98%' }],
  featureManagement: [{ id: 'ff-01', key: 'smart_reports', enabled: true }],
  backupLogs: [{ id: 'bkp-01', type: 'full', status: 'success', createdAt: nowIso }],
  managerRequests: [{ id: 'mr-01', title: 'Extra headcount request', status: 'open' }],
  managerMeetings: [{ id: 'mm-01', title: 'Sprint planning', date: nowIso.slice(0, 10) }],
  managerMessages: [
    { id: 'msg-01', module: 'attendance', action: 'LATE_MARKED', subject: 'Late check-in recorded', message: 'Sara QA marked late check-in at 10:12 AM', status: 'sent', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'msg-02', module: 'leave', action: 'LEAVE_REQUEST', subject: 'Leave request submitted', message: 'Mia Designer requested casual leave for 2 days', status: 'sent', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 'msg-03', module: 'performance', action: 'REVIEW_COMPLETED', subject: 'Performance review submitted', message: 'Arjun Analyst review cycle completed', status: 'sent', createdAt: new Date(Date.now() - 10800000).toISOString() },
    { id: 'msg-04', module: 'tasks', action: 'TASK_OVERDUE', subject: 'Overdue task alert', message: 'Escalation response task is overdue by 1 day', status: 'sent', createdAt: new Date(Date.now() - 14400000).toISOString() }
  ],
  managerNotifications: [
    { id: 'mn-01', title: 'Leave approval pending', message: '2 leave requests are awaiting your action', status: 'unread' },
    { id: 'mn-02', title: 'Attendance anomaly', message: '1 team member has irregular attendance', status: 'unread' },
    { id: 'mn-03', title: 'Review due', message: 'Quarterly review deadline is tomorrow', status: 'read' }
  ],
  managerSupportTickets: [{ id: 'mst-01', ticketNo: 'MST-1001', subject: 'Access issue', status: 'open' }],
  managerPerformance: [
    { id: 'mpr-01', employeeId: 'emp-001', rating: 4.2, reviews: 3, period: 'Q2-2026' },
    { id: 'mpr-02', employeeId: 'emp-002', rating: 4.5, reviews: 4, period: 'Q2-2026' },
    { id: 'mpr-03', employeeId: 'emp-003', rating: 3.9, reviews: 2, period: 'Q2-2026' },
    { id: 'mpr-04', employeeId: 'emp-004', rating: 4.1, reviews: 3, period: 'Q2-2026' },
    { id: 'mpr-05', employeeId: 'emp-005', rating: 3.8, reviews: 2, period: 'Q2-2026' }
  ],
  employeeLeaves: [
    { id: 'el-01', employeeName: 'John Employee', type: 'casual', status: 'approved', fromDate: nowIso.slice(0, 10), toDate: nowIso.slice(0, 10) },
    { id: 'el-02', employeeName: 'Mia Designer', type: 'casual', status: 'pending', fromDate: nowIso.slice(0, 10), toDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10) },
    { id: 'el-03', employeeName: 'Arjun Analyst', type: 'sick', status: 'pending', fromDate: nowIso.slice(0, 10), toDate: nowIso.slice(0, 10) },
    { id: 'el-04', employeeName: 'Neha Support', type: 'earned', status: 'approved', fromDate: nowIso.slice(0, 10), toDate: nowIso.slice(0, 10) }
  ],
  recruitment: [{ id: 'rc-01', name: 'Priya Candidate', stage: 'Interview', status: 'active' }]
})

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value)
  } catch (_error) {
    return fallback
  }
}

const getDb = () => {
  const raw = localStorage.getItem(DEMO_DB_KEY)
  if (raw) return safeParse(raw, seedDb())
  const seeded = seedDb()
  localStorage.setItem(DEMO_DB_KEY, JSON.stringify(seeded))
  return seeded
}

const saveDb = (db) => localStorage.setItem(DEMO_DB_KEY, JSON.stringify(db))
const getSessionUser = () => safeParse(localStorage.getItem('currentUser'), null)
const ensureArray = (v) => (Array.isArray(v) ? v : [])

const ensureModuleSeedData = (db) => {
  db.supportAgents = ensureArray(db.supportAgents)
  db.supportCategories = ensureArray(db.supportCategories)
  db.tickets = ensureArray(db.tickets)
  db.auditLogs = ensureArray(db.auditLogs)
  db.aiSettings = ensureArray(db.aiSettings)
  db.automationRules = ensureArray(db.automationRules)
  db.managerPerformance = ensureArray(db.managerPerformance)
  db.managerMessages = ensureArray(db.managerMessages)
  db.managerNotifications = ensureArray(db.managerNotifications)
  db.employeeLeaves = ensureArray(db.employeeLeaves)

  if (db.supportCategories.length === 0) {
    db.supportCategories.push(
      { _id: 'sc-01', name: 'Technical' },
      { _id: 'sc-02', name: 'Payroll' },
      { _id: 'sc-03', name: 'Account Access' }
    )
  }
  if (db.supportAgents.length === 0) {
    db.supportAgents.push(
      { _id: 'sa-01', name: 'Nora Agent' },
      { _id: 'sa-02', name: 'Kiran Agent' }
    )
  }
  if (db.tickets.length < 8) {
    const missing = 8 - db.tickets.length
    for (let i = 1; i <= missing; i += 1) {
      const idx = db.tickets.length + i
      db.tickets.push({
        _id: `tkt-seed-${idx}`,
        ticketNo: `TCK-${1100 + idx}`,
        subject: `Demo ticket ${idx}`,
        description: 'Auto-seeded support ticket for UI demo',
        status: idx % 4 === 0 ? 'closed' : 'open',
        priority: idx % 3 === 0 ? 'high' : 'medium',
        category: db.supportCategories[idx % db.supportCategories.length],
        assignedAgent: db.supportAgents[idx % db.supportAgents.length],
        slaDueAt: new Date(Date.now() + idx * 3600000).toISOString(),
        createdAt: new Date(Date.now() - idx * 7200000).toISOString(),
        messages: [{ _id: `msg-seed-${idx}`, senderType: 'agent', senderName: 'Nora Agent', message: 'Seeded demo update', createdAt: new Date().toISOString() }]
      })
    }
  }
  if (db.auditLogs.length < 20) {
    const cats = ['Security Logs', 'Login Events', 'Access Control', 'System Activity']
    const acts = ['LOGIN', 'PASSWORD_CHANGE', 'ROLE_UPDATE', 'EXPORT']
    const missing = 20 - db.auditLogs.length
    for (let i = 1; i <= missing; i += 1) {
      db.auditLogs.push({
        _id: `aud-seed-${Date.now()}-${i}`,
        dateTime: new Date(Date.now() - i * 1800000).toISOString(),
        category: cats[i % cats.length],
        actorName: i % 2 === 0 ? 'Super Admin' : 'Security Admin',
        module: i % 2 === 0 ? 'Auth' : 'Audit',
        action: acts[i % acts.length],
        description: 'Auto-seeded audit event',
        ipAddress: `10.10.0.${(i % 40) + 10}`,
        device: i % 2 === 0 ? 'Chrome / Windows' : 'Safari / iOS',
        createdAt: new Date(Date.now() - i * 1800000).toISOString()
      })
    }
  }
  if (db.aiSettings.length < 3) {
    db.aiSettings = [
      { _id: 'ai-01', key: 'default_model', value: 'gpt-5.4-mini', description: 'Default AI model for analytics' },
      { _id: 'ai-02', key: 'insight_refresh_interval', value: 30, description: 'Refresh interval in minutes' },
      { _id: 'ai-03', key: 'anomaly_detection', value: true, description: 'Enable anomaly detection' }
    ]
  }
  if (db.automationRules.length < 5) {
    const rules = [
      { _id: 'ar-01', name: 'Low Attendance Alert', trigger: 'on_low_attendance', action: 'notify_manager', enabled: true },
      { _id: 'ar-02', name: 'Attrition Risk Escalation', trigger: 'on_high_attrition_risk', action: 'notify_hr_head', enabled: true },
      { _id: 'ar-03', name: 'Payroll Outlier Review', trigger: 'on_payroll_anomaly', action: 'create_audit_task', enabled: true },
      { _id: 'ar-04', name: 'Late Check-in Pattern', trigger: 'on_late_checkin_pattern', action: 'send_warning', enabled: false },
      { _id: 'ar-05', name: 'Weekly AI Summary', trigger: 'on_weekly_schedule', action: 'email_summary', enabled: true }
    ]
    db.automationRules = rules
  }
  if (db.managerPerformance.length < 4) {
    db.managerPerformance = [
      { id: 'mpr-01', employeeId: 'emp-001', rating: 4.2, reviews: 3, period: 'Q2-2026' },
      { id: 'mpr-02', employeeId: 'emp-002', rating: 4.5, reviews: 4, period: 'Q2-2026' },
      { id: 'mpr-03', employeeId: 'emp-003', rating: 3.9, reviews: 2, period: 'Q2-2026' },
      { id: 'mpr-04', employeeId: 'emp-004', rating: 4.1, reviews: 3, period: 'Q2-2026' },
      { id: 'mpr-05', employeeId: 'emp-005', rating: 3.8, reviews: 2, period: 'Q2-2026' }
    ]
  }
  if (db.employeeLeaves.length < 3) {
    db.employeeLeaves = [
      { id: 'el-01', employeeName: 'John Employee', type: 'casual', status: 'approved', fromDate: nowIso.slice(0, 10), toDate: nowIso.slice(0, 10) },
      { id: 'el-02', employeeName: 'Mia Designer', type: 'casual', status: 'pending', fromDate: nowIso.slice(0, 10), toDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10) },
      { id: 'el-03', employeeName: 'Arjun Analyst', type: 'sick', status: 'pending', fromDate: nowIso.slice(0, 10), toDate: nowIso.slice(0, 10) }
    ]
  }
  if (db.managerMessages.length < 3) {
    db.managerMessages = [
      { id: 'msg-01', module: 'attendance', action: 'LATE_MARKED', subject: 'Late check-in recorded', message: 'Sara QA marked late check-in at 10:12 AM', status: 'sent', createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: 'msg-02', module: 'leave', action: 'LEAVE_REQUEST', subject: 'Leave request submitted', message: 'Mia Designer requested casual leave for 2 days', status: 'sent', createdAt: new Date(Date.now() - 7200000).toISOString() },
      { id: 'msg-03', module: 'performance', action: 'REVIEW_COMPLETED', subject: 'Performance review submitted', message: 'Arjun Analyst review cycle completed', status: 'sent', createdAt: new Date(Date.now() - 10800000).toISOString() }
    ]
  }
  if (db.managerNotifications.length < 2) {
    db.managerNotifications = [
      { id: 'mn-01', title: 'Leave approval pending', message: '2 leave requests are awaiting your action', status: 'unread' },
      { id: 'mn-02', title: 'Attendance anomaly', message: '1 team member has irregular attendance', status: 'unread' }
    ]
  }
  const today = nowIso.slice(0, 10)
  const attendanceToday = db.attendance.filter((item) => String(item.date || '').slice(0, 10) === today)
  if (attendanceToday.length < 4) {
    const seedAttendance = [
      { id: 'att-01', employeeId: 'emp-001', employeeName: 'John Employee', departmentId: 'dep-01', date: today, checkIn: '09:34', checkOut: '18:12', status: 'present', workingHours: 8.6 },
      { id: 'att-02', employeeId: 'emp-002', employeeName: 'Sara QA', departmentId: 'dep-01', date: today, checkIn: '10:08', checkOut: '18:25', status: 'late', workingHours: 8.0 },
      { id: 'att-03', employeeId: 'emp-003', employeeName: 'Mia Designer', departmentId: 'dep-02', date: today, checkIn: '', checkOut: '', status: 'absent', workingHours: 0 },
      { id: 'att-04', employeeId: 'emp-004', employeeName: 'Arjun Analyst', departmentId: 'dep-01', date: today, checkIn: '09:12', checkOut: '18:05', status: 'present', workingHours: 8.7 },
      { id: 'att-05', employeeId: 'emp-005', employeeName: 'Neha Support', departmentId: 'dep-01', date: today, checkIn: '09:48', checkOut: '18:15', status: 'present', workingHours: 8.2 }
    ]
    const others = db.attendance.filter((item) => String(item.date || '').slice(0, 10) !== today)
    db.attendance = [...seedAttendance, ...others]
  }

  return db
}

const roleRedirectMap = {
  platform_admin: '/super-admin/dashboard',
  superadmin: '/super-admin/dashboard',
  admin: '/admin/dashboard',
  hr: '/hr/dashboard',
  manager: '/manager/dashboard',
  employee: '/employee/dashboard'
}

const normalizePath = (url = '') => String(url).split('?')[0].replace(/^https?:\/\/[^/]+/i, '').replace(/^\/api/, '') || '/'
const ok = (config, data, status = 200) => Promise.resolve({ data, status, statusText: 'OK', headers: {}, config, request: {} })
const created = (config, data) => ok(config, data, 201)

const isCollectionGet = (method, id) => method === 'get' && !id
const isDetailGet = (method, id) => method === 'get' && Boolean(id)
const summarizeAttendance = (records) => {
  const summary = { total: records.length, present: 0, absent: 0, halfDay: 0, late: 0, leave: 0 }
  records.forEach((x) => {
    const s = String(x.status || '').toLowerCase()
    if (s === 'present') summary.present += 1
    if (s === 'absent') summary.absent += 1
    if (s === 'half-day') summary.halfDay += 1
    if (s === 'late') summary.late += 1
    if (s === 'leave') summary.leave += 1
  })
  return summary
}

const listMap = (db) => ({
  employees: db.employees,
  departments: db.departments,
  managers: db.managers,
  hr: db.hrUsers,
  documents: db.documents,
  announcements: db.announcements,
  tasks: db.tasks,
  tickets: db.tickets,
  payroll: db.payroll,
  attendance: db.attendance,
  companies: db.companies,
  plans: db.plans,
  subscriptions: db.subscriptions,
  invoices: db.invoices,
  payments: db.payments,
  coupons: db.coupons,
  addons: db.addons,
  reports: db.reports,
  integrations: db.integrations,
  support: db.tickets,
  categories: db.supportCategories,
  agents: db.supportAgents,
  'audit-security': db.auditLogs,
  'system-settings': db.systemSettings,
  'feature-management': db.featureFlags,
  widgets: db.dashboardWidgets,
  ai: db.aiSettings,
  automation: db.automationRules,
  admins: db.superAdmins,
  roles: db.roles,
  'platform-overview': db.platformOverview,
  'feature-management': db.featureManagement,
  backup: db.backupLogs,
  requests: db.managerRequests,
  meetings: db.managerMeetings,
  messages: db.managerMessages,
  notifications: db.managerNotifications,
  performance: db.managerPerformance,
  recruitment: db.recruitment
})

const csvBlob = (text) => new Blob([text], { type: 'text/csv;charset=utf-8;' })

export const isDemoMode = () => {
  const explicit = String(import.meta.env.VITE_FRONTEND_ONLY || '').toLowerCase()
  if (explicit === 'true') return true
  if (explicit === 'false') return false
  return true
}

export const resetDemoData = () => {
  localStorage.removeItem(DEMO_DB_KEY)
}

export const generateMoreDemoData = (count = 25) => {
  const db = ensureModuleSeedData(getDb())
  const safeCount = Math.max(1, Math.min(200, Number(count) || 25))
  const pad = (n) => String(n).padStart(3, '0')

  for (let i = 1; i <= safeCount; i += 1) {
    const idx = Date.now() + i
    const empId = `emp-x-${pad(i)}`
    const deptId = i % 2 === 0 ? 'dep-01' : 'dep-02'
    const deptName = deptId === 'dep-01' ? 'Engineering' : 'Design'
    const employee = {
      id: empId,
      employeeId: `EMPX${pad(i)}`,
      name: `Demo Employee ${i}`,
      role: i % 3 === 0 ? 'Analyst' : 'Engineer',
      department: deptName,
      departmentId: deptId,
      status: 'active'
    }
    db.employees.push(employee)

    db.documents.push({
      id: `doc-x-${idx}`,
      title: `Demo Document ${i}`,
      employeeId: empId,
      employeeName: employee.name,
      category: i % 2 === 0 ? 'id-proof' : 'address-proof',
      status: i % 5 === 0 ? 'pending' : 'active',
      verified: i % 4 !== 0,
      fileUrl: '/uploads/documents/demo-uploaded-file.pdf',
      createdAt: new Date().toISOString()
    })

    db.attendance.push({
      id: `att-x-${idx}`,
      employeeId: empId,
      employeeName: employee.name,
      departmentId: deptId,
      date: new Date().toISOString().slice(0, 10),
      checkIn: '09:15',
      checkOut: '18:05',
      status: i % 7 === 0 ? 'late' : 'present',
      workingHours: 8.2
    })

    db.payroll.push({
      id: `pay-x-${idx}`,
      employeeId: empId,
      employeeName: employee.name,
      month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      netSalary: 45000 + (i * 700),
      status: 'processed'
    })

    db.tasks.push({
      id: `task-x-${idx}`,
      title: `Demo Task ${i}`,
      status: i % 3 === 0 ? 'completed' : 'in-progress',
      dueDate: new Date(Date.now() + (i * 86400000)).toISOString(),
      priority: i % 4 === 0 ? 'high' : 'medium'
    })

    db.tickets.push({
      id: `tic-x-${idx}`,
      ticketNo: `TCK-${1000 + i}`,
      subject: `Demo Support Request ${i}`,
      description: 'Auto-generated demo ticket',
      status: i % 4 === 0 ? 'closed' : 'open',
      priority: i % 5 === 0 ? 'high' : 'medium',
      createdAt: new Date().toISOString(),
      messages: []
    })

    db.reports.push({
      id: `rep-x-${idx}`,
      title: `Generated Report ${i}`,
      createdAt: new Date().toISOString()
    })

    db.globalUsers.push({
      id: `gu-x-${idx}`,
      name: `Global User ${i}`,
      email: `global${i}@demo.com`,
      status: i % 6 === 0 ? 'inactive' : 'active'
    })
  }

  saveDb(db)
  return {
    generated: safeCount,
    totals: {
      employees: db.employees.length,
      attendance: db.attendance.length,
      payroll: db.payroll.length,
      documents: db.documents.length,
      tasks: db.tasks.length,
      tickets: db.tickets.length,
      reports: db.reports.length,
      globalUsers: db.globalUsers.length
    }
  }
}

export const handleDemoRequest = async (config) => {
  const method = String(config?.method || 'get').toLowerCase()
  const path = normalizePath(config?.url)
  const db = ensureModuleSeedData(getDb())
  const maps = listMap(db)
  const currentUser = getSessionUser() || { id: db.users[0].id, name: db.users[0].name, email: db.users[0].email, role: db.users[0].role }

  if ((path.includes('/export') || path.endsWith('/payslip')) && method === 'get') {
    return ok(config, csvBlob('id,name,value\n1,demo,ok'))
  }

  if (path === '/auth/login' && method === 'post') {
    const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
    const identifier = String(body.identifier || '').toLowerCase().trim()
    const password = String(body.password || '').trim()
    const user = db.users.find((u) => (u.email.toLowerCase() === identifier || u.id.toLowerCase() === identifier || u.role.toLowerCase() === identifier) && u.password === password)
      || db.users.find((u) => u.password === password)
    if (!user) return ok(config, { message: 'Invalid credentials' }, 401)
    const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role }
    return ok(config, { token: `demo-token-${user.role}`, user: sessionUser, redirectUrl: roleRedirectMap[String(user.role || '').toLowerCase()] || '/login' })
  }

  if (path === '/auth/me' && method === 'get') return ok(config, { user: currentUser })

  if (path === '/employee/dashboard' && method === 'get') {
    const todayDate = new Date().toISOString().slice(0, 10)
    const attendanceRecords = Array.isArray(db.attendance) ? db.attendance : []
    const todayAttendance = attendanceRecords.find((item) => String(item?.date || '').slice(0, 10) === todayDate) || attendanceRecords[0] || null
    const monthPrefix = todayDate.slice(0, 7)
    const thisMonthRecords = attendanceRecords.filter((item) => String(item?.date || '').startsWith(monthPrefix))
    const thisMonthAttendanceSummary = thisMonthRecords.reduce((acc, item) => {
      const status = String(item?.status || '').toLowerCase()
      if (status === 'present') acc.present += 1
      else if (status === 'absent') acc.absent += 1
      else if (status === 'late') acc.late += 1
      else if (status === 'half-day' || status === 'halfday') acc.halfDay += 1
      return acc
    }, { month: monthPrefix, present: 0, absent: 0, late: 0, halfDay: 0 })

    return ok(config, {
      data: {
        profile: db.employees[0],
        todayAttendanceStatus: todayAttendance ? {
          status: todayAttendance.status || 'absent',
          checkIn: todayAttendance.checkIn || '',
          checkOut: todayAttendance.checkOut || '',
          workingHours: Number(todayAttendance.workingHours || 0)
        } : {
          status: 'absent',
          checkIn: '',
          checkOut: '',
          workingHours: 0
        },
        thisMonthAttendanceSummary,
        leaveBalance: { casual: 8, sick: 6, earned: 10 },
        pendingLeaveRequests: db.employeeLeaves.filter((x) => x.status === 'pending').length,
        upcomingHolidays: [
          { name: 'Independence Day', date: `${todayDate.slice(0, 4)}-08-15` },
          { name: 'Gandhi Jayanti', date: `${todayDate.slice(0, 4)}-10-02` }
        ],
        notifications: (db.announcements || []).map((item, idx) => ({
          id: item.id || `ann-${idx + 1}`,
          title: item.title || 'Announcement',
          message: item.message || ''
        }))
      }
    })
  }

  if (path === '/manager/payroll/team-summary' && method === 'get') {
    const params = config?.params || {}
    const monthParam = String(params.month || '')
    const yearParam = String(params.year || '')
    const statusParam = String(params.status || 'all').toLowerCase()
    const payrollRows = Array.isArray(db.payroll) ? db.payroll : []

    const rows = payrollRows
      .map((item, index) => {
        const monthRaw = String(item.month || '')
        const monthParts = monthRaw.split('-')
        const year = item.year || monthParts[0] || String(new Date().getFullYear())
        const month = item.monthNo || monthParts[1] || String(new Date().getMonth() + 1).padStart(2, '0')
        const status = String(item.status || item.paymentStatus || 'generated').toLowerCase()
        const employee = (db.employees || []).find((emp) =>
          String(emp.employeeId || emp.id).toLowerCase() === String(item.employeeId || '').toLowerCase()
        )

        return {
          id: item.id || `mpr-${index + 1}`,
          employeeId: item.employeeId || employee?.employeeId || employee?.id || '',
          employeeName: item.employeeName || employee?.name || 'Employee',
          email: employee?.email || `${String(item.employeeName || 'employee').toLowerCase().replace(/\s+/g, '.')}@demo.com`,
          designation: employee?.role || employee?.designation || 'Team Member',
          year: String(year),
          month: String(month).padStart(2, '0'),
          grossSalary: Number(item.grossSalary || item.netSalary || 0),
          netSalary: Number(item.netSalary || 0),
          bonus: Number(item.bonus || 0),
          deductions: Number(item.deductions || 0),
          tax: Number(item.tax || 0),
          status
        }
      })
      .filter((row) => (monthParam ? row.month === monthParam : true))
      .filter((row) => (yearParam ? row.year === yearParam : true))
      .filter((row) => (statusParam === 'all' ? true : row.status === statusParam))

    const summary = rows.reduce((acc, row) => {
      acc.totalEmployees += 1
      acc.totalGrossSalary += Number(row.grossSalary || 0)
      acc.totalNetSalary += Number(row.netSalary || 0)
      acc.totalBonus += Number(row.bonus || 0)
      return acc
    }, { totalEmployees: 0, totalNetSalary: 0, totalGrossSalary: 0, totalBonus: 0 })

    return ok(config, { data: rows, summary })
  }

  if (path === '/manager/payroll/status' && method === 'get') {
    const payrollRows = Array.isArray(db.payroll) ? db.payroll : []
    const rows = payrollRows.map((item) => ({
      status: String(item.status || item.paymentStatus || 'generated').toLowerCase()
    }))
    const statusSummary = rows.reduce((acc, row) => {
      if (row.status === 'paid') acc.paid += 1
      else if (row.status === 'pending') acc.pending += 1
      else acc.generated += 1
      return acc
    }, { generated: 0, pending: 0, paid: 0 })
    return ok(config, { data: rows, statusSummary })
  }

  if (path === '/manager/payroll/bonus-recommendation' && method === 'post') {
    return created(config, { message: 'Bonus recommendation submitted successfully' })
  }

  if (path === '/manager/dashboard' && method === 'get') {
    const todayDate = new Date().toISOString().slice(0, 10)
    const teamMembers = ensureArray(db.employees)
    const attendance = ensureArray(db.attendance)
    const leaves = ensureArray(db.employeeLeaves)
    const tasks = ensureArray(db.tasks)
    const performance = ensureArray(db.managerPerformance)
    const messages = ensureArray(db.managerMessages)

    const todayAttendance = attendance.filter((item) => String(item.date || '').slice(0, 10) === todayDate)
    const presentToday = todayAttendance.filter((item) => item.status === 'present').length
    const absentToday = Math.max(teamMembers.length - presentToday, 0)

    const pendingLeaveRequests = leaves.filter((item) => item.status === 'pending')
    const completedTasks = tasks.filter((item) => item.status === 'completed')
    const overdueTasks = tasks.filter((item) => item.status === 'overdue')
    const activeTasks = tasks.filter((item) => !['completed', 'cancelled'].includes(String(item.status || '').toLowerCase()))

    const taskStatusMap = tasks.reduce((acc, task) => {
      const key = String(task.status || 'unknown')
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    return ok(config, {
      data: {
        cards: {
          totalTeamMembers: teamMembers.length,
          presentToday,
          absentToday,
          pendingLeaveRequests: pendingLeaveRequests.length,
          activeTasks: activeTasks.length,
          completedTasks: completedTasks.length,
          overdueTasks: overdueTasks.length,
          averageTeamPerformance: Number(
            performance.length
              ? (performance.reduce((sum, row) => sum + Number(row.rating || 0), 0) / performance.length).toFixed(1)
              : 0
          )
        },
        taskStatusChart: Object.entries(taskStatusMap).map(([status, count]) => ({ status, count })),
        pendingLeaveRequestsPreview: pendingLeaveRequests.slice(0, 8).map((item) => ({
          id: item.id,
          employeeName: item.employeeName || teamMembers[0]?.name || 'Employee',
          leaveType: item.type || item.leaveType || 'casual',
          startDate: item.fromDate || item.startDate || todayDate,
          endDate: item.toDate || item.endDate || todayDate,
          status: item.status || 'pending'
        })),
        todayAttendancePreview: todayAttendance.slice(0, 8).map((item) => ({
          id: item.id,
          employeeName: item.employeeName || 'Employee',
          status: item.status || 'absent',
          checkIn: item.checkIn || '-',
          checkOut: item.checkOut || '-'
        })),
        teamPerformanceSummary: performance.slice(0, 8).map((item) => ({
          employeeId: item.employeeId,
          employeeName: teamMembers.find((emp) => String(emp.id) === String(item.employeeId))?.name || item.employeeName || 'Employee',
          averageScore: Number(item.rating || item.averageScore || 0),
          reviews: Number(item.reviews || 1)
        })),
        recentActivities: messages.slice(0, 10).map((item, idx) => ({
          id: item.id || `activity-${idx + 1}`,
          module: item.module || 'manager',
          action: item.subject || item.action || 'Update',
          message: item.message || item.subject || 'Team update',
          createdAt: item.createdAt || new Date().toISOString()
        })),
        notifications: db.managerNotifications || []
      }
    })
  }

  if (path === '/hr/dashboard' && method === 'get') {
    return ok(config, {
      data: {
        employees: db.employees.length,
        openRecruitment: db.recruitment.length,
        pendingLeaves: db.employeeLeaves.filter((x) => x.status === 'pending').length
      }
    })
  }

  if (path.startsWith('/employee/attendance')) {
    if (path.endsWith('/today') && method === 'get') return ok(config, { data: db.attendance[0] })
    if (path.endsWith('/monthly') && method === 'get') return ok(config, { data: db.attendance })
    if (path.endsWith('/history') && method === 'get') return ok(config, { data: db.attendance })
    if (path.endsWith('/check-in') && method === 'post') {
      const todayDate = new Date().toISOString().slice(0, 10)
      const nowIsoValue = new Date().toISOString()
      const current = db.attendance[0] || {
        id: 'att-01',
        employeeId: 'emp-001',
        employeeName: 'John Employee',
        departmentId: 'dep-01',
        date: todayDate
      }
      const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
      db.attendance[0] = {
        ...current,
        date: todayDate,
        checkIn: nowIsoValue,
        checkOut: '',
        status: 'present',
        workingHours: 0,
        purpose: body.purpose || 'mark-attendance',
        purposeLabel: body.purposeLabel || 'Mark Attendance'
      }
      saveDb(db)
      return ok(config, { message: 'Checked in', data: db.attendance[0] })
    }
    if (path.endsWith('/check-out') && method === 'post') {
      const todayDate = new Date().toISOString().slice(0, 10)
      const nowIsoValue = new Date().toISOString()
      const current = db.attendance[0] || {
        id: 'att-01',
        employeeId: 'emp-001',
        employeeName: 'John Employee',
        departmentId: 'dep-01',
        date: todayDate
      }
      const checkInDate = current.checkIn ? new Date(current.checkIn) : null
      const checkOutDate = new Date(nowIsoValue)
      let workingHours = Number(current.workingHours || 0)
      if (checkInDate && !Number.isNaN(checkInDate.getTime())) {
        const diffMs = checkOutDate.getTime() - checkInDate.getTime()
        workingHours = Math.max(0, Number((diffMs / (1000 * 60 * 60)).toFixed(2)))
      }
      db.attendance[0] = {
        ...current,
        date: todayDate,
        checkOut: nowIsoValue,
        status: 'present',
        workingHours
      }
      saveDb(db)
      return ok(config, { message: 'Checked out', data: db.attendance[0] })
    }
    if (path.endsWith('/reset-today') && method === 'post') {
      const todayDate = new Date().toISOString().slice(0, 10)
      const current = db.attendance[0] || {
        id: 'att-01',
        employeeId: 'emp-001',
        employeeName: 'John Employee',
        departmentId: 'dep-01',
        date: todayDate
      }
      db.attendance[0] = {
        ...current,
        date: todayDate,
        checkIn: '',
        checkOut: '',
        status: 'absent',
        workingHours: 0
      }
      saveDb(db)
      return ok(config, { message: 'Today attendance reset successfully', data: db.attendance[0] })
    }
    if (path.endsWith('/regularization-request') && method === 'post') return ok(config, { message: 'Regularization request submitted' })
  }

  if (path.startsWith('/admin/attendance')) {
    if (path === '/admin/attendance' && method === 'get') return ok(config, { data: db.attendance })
    if (path.endsWith('/today') && method === 'get') return ok(config, { data: db.attendance, summary: summarizeAttendance(db.attendance) })
    if (path.endsWith('/monthly') && method === 'get') return ok(config, { data: { summary: summarizeAttendance(db.attendance), records: db.attendance } })
    if (path.endsWith('/my-today') && method === 'get') return ok(config, { data: { ...db.attendance[0], faceEnrolled: true } })
    if (path.endsWith('/face-enroll') && method === 'post') return ok(config, { message: 'Face enrolled successfully', data: { ...db.attendance[0], faceEnrolled: true } })
    if (path.endsWith('/punch-in') && method === 'post') return ok(config, { message: 'Punch in recorded', data: { ...db.attendance[0], checkIn: new Date().toISOString(), faceEnrolled: true } })
    if (path.endsWith('/punch-out') && method === 'post') return ok(config, { message: 'Punch out recorded', data: { ...db.attendance[0], checkOut: new Date().toISOString(), faceEnrolled: true } })
    if (path.endsWith('/manual') && method === 'post') {
      const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
      const next = { id: `att-${Date.now()}`, ...body, employeeName: db.employees.find((e) => String(e.id) === String(body.employeeId) || String(e.employeeId) === String(body.employeeId))?.name || 'Employee', departmentId: 'dep-01', workingHours: 8 }
      db.attendance.unshift(next)
      saveDb(db)
      return created(config, { message: 'Attendance marked successfully', data: next })
    }
    if (/^\/admin\/attendance\/[^/]+$/.test(path) && method === 'put') {
      const id = path.split('/').pop()
      const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
      const idx = db.attendance.findIndex((x) => String(x.id) === String(id))
      if (idx >= 0) db.attendance[idx] = { ...db.attendance[idx], ...body }
      saveDb(db)
      return ok(config, { message: 'Attendance updated successfully', data: db.attendance[idx] || db.attendance[0] })
    }
  }

  if (path === '/employee/tickets/categories' && method === 'get') return ok(config, { data: [{ id: 'it', name: 'IT Support' }, { id: 'hr', name: 'HR Query' }] })

  if (path.startsWith('/employee/tickets')) {
    if (path === '/employee/tickets' && method === 'get') return ok(config, { data: db.tickets })
    if (path === '/employee/tickets' && method === 'post') return created(config, { message: 'Ticket created successfully' })
    if (/^\/employee\/tickets\/[^/]+$/.test(path) && method === 'get') {
      const id = path.split('/').pop()
      return ok(config, { data: db.tickets.find((t) => t.id === id) || db.tickets[0] })
    }
    if (/^\/employee\/tickets\/[^/]+\/messages$/.test(path) && method === 'post') return created(config, { message: 'Reply added successfully' })
    if (/^\/employee\/tickets\/[^/]+\/(close|reopen)$/.test(path) && method === 'patch') return ok(config, { message: 'Ticket updated' })
  }

  if (path.startsWith('/employee/documents')) {
    if (path === '/employee/documents' && method === 'get') {
      return ok(config, { data: { items: db.documents.filter((d) => d.employeeId === 'emp-001'), required: { requiredCategories: ['id-proof', 'address-proof', 'bank'], missingCategories: ['bank'], uploadedCount: 2, missingCount: 1 } } })
    }
    if (path === '/employee/documents' && method === 'post') return created(config, { message: 'Document uploaded successfully', data: {} })
    if (/^\/employee\/documents\/[^/]+$/.test(path) && method === 'get') {
      const id = path.split('/').pop()
      return ok(config, { data: db.documents.find((d) => d.id === id) || db.documents[0] })
    }
    if (/^\/employee\/documents\/[^/]+$/.test(path) && (method === 'put' || method === 'delete')) return ok(config, { message: method === 'put' ? 'Document updated' : 'Document deleted' })
  }

  if (path === '/admin/dashboard' && method === 'get') {
    const employees = ensureArray(db.employees)
    const hrUsers = ensureArray(db.hrUsers)
    const managers = ensureArray(db.managers)
    const departments = ensureArray(db.departments)
    const attendance = ensureArray(db.attendance)
    const payroll = ensureArray(db.payroll)
    const leaves = ensureArray(db.employeeLeaves)
    const auditLogs = ensureArray(db.auditLogs)
    const companies = ensureArray(db.companies)
    const today = new Date().toISOString().slice(0, 10)

    const attendanceToday = attendance.filter((item) => String(item.date || '').slice(0, 10) === today)
    const presentToday = attendanceToday.filter((item) => String(item.status || '').toLowerCase() === 'present').length
    const absentToday = Math.max(employees.length - presentToday, 0)
    const pendingLeaves = leaves.filter((item) => String(item.status || '').toLowerCase() === 'pending').length
    const approvedLeaves = leaves.filter((item) => String(item.status || '').toLowerCase() === 'approved').length
    const rejectedLeaves = leaves.filter((item) => String(item.status || '').toLowerCase() === 'rejected').length

    const monthlyPayroll = payroll.reduce((sum, row) => sum + Number(row.netSalary || 0), 0)
    const company = companies[0] || null

    const attendanceChartData = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - idx))
      const dateKey = d.toISOString().slice(0, 10)
      const rows = attendance.filter((item) => String(item.date || '').slice(0, 10) === dateKey)
      const present = rows.filter((item) => String(item.status || '').toLowerCase() === 'present').length
      const absent = Math.max(employees.length - present, 0)
      return { date: dateKey.slice(5), present, absent }
    })

    const payrollChartMap = payroll.reduce((acc, row) => {
      const month = String(row.month || today.slice(0, 7))
      acc[month] = (acc[month] || 0) + Number(row.netSalary || 0)
      return acc
    }, {})
    const payrollChartData = Object.keys(payrollChartMap).sort().map((month) => ({
      month: month.slice(5),
      total: payrollChartMap[month]
    }))

    const deptMap = employees.reduce((acc, emp) => {
      const key = emp.department || 'Unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    const departmentWiseEmployees = Object.entries(deptMap).map(([department, totalEmployees]) => ({
      department,
      totalEmployees
    }))

    const recentLeaveRequests = leaves.slice(0, 8).map((item, idx) => ({
      id: item.id || `leave-${idx + 1}`,
      employeeName: item.employeeName || employees[idx % Math.max(employees.length, 1)]?.name || 'Employee',
      type: item.type || 'casual',
      status: item.status || 'pending',
      fromDate: item.fromDate || today,
      toDate: item.toDate || today
    }))

    const recentActivities = auditLogs.slice(0, 10).map((item, idx) => ({
      id: item._id || item.id || `act-${idx + 1}`,
      action: item.action || 'UPDATE',
      message: item.description || item.category || 'Activity event',
      module: item.module || 'Audit',
      createdAt: item.createdAt || item.dateTime || new Date().toISOString()
    }))

    return ok(config, {
      data: {
        totalEmployees: employees.length,
        totalHR: hrUsers.length,
        totalManagers: managers.length,
        totalDepartments: departments.length,
        presentToday,
        absentToday,
        todayAttendance: { present: presentToday, absent: absentToday, total: employees.length },
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        monthlyPayroll,
        attendanceChartData,
        payrollChartData,
        departmentWiseEmployees,
        recentEmployees: employees.slice(0, 8),
        recentLeaveRequests,
        recentActivities,
        companyProfileSummary: company
          ? {
              companyName: company.companyName,
              companyCode: company.companyCode,
              plan: company.plan,
              status: company.status,
              timezone: company.timezone,
              currency: company.currency,
              location: [company.city, company.state, company.country].filter(Boolean).join(', '),
              employeeLimit: company.employeeLimit
            }
          : null,
        alerts: [
          { id: 'alert-1', severity: absentToday > 0 ? 'warning' : 'success', title: 'Attendance Watch', message: `${absentToday} team member(s) absent today.` },
          { id: 'alert-2', severity: pendingLeaves > 0 ? 'warning' : 'info', title: 'Leave Queue', message: `${pendingLeaves} leave request(s) pending approval.` },
          { id: 'alert-3', severity: 'info', title: 'Payroll Run', message: `Current payroll outflow ${monthlyPayroll.toLocaleString('en-US')}.` }
        ]
      }
    })
  }

  if (path === '/super-admin/companies' && method === 'get') {
    const items = db.companies
    return ok(config, {
      items,
      pagination: {
        page: Number(config?.params?.page || 1),
        limit: Number(config?.params?.limit || 10),
        total: items.length,
        totalPages: 1
      }
    })
  }
  if (/^\/super-admin\/companies\/[^/]+$/.test(path) && method === 'get') {
    const id = path.split('/').pop()
    const item = db.companies.find((x) => String(x.id) === String(id)) || db.companies[0]
    return ok(config, { item })
  }
  if (/^\/super-admin\/companies\/[^/]+\/activity-logs$/.test(path) && method === 'get') {
    const items = db.auditLogs.map((x) => ({ _id: x.id, action: x.action, description: x.category, dateTime: x.createdAt }))
    return ok(config, { items })
  }
  if (path === '/super-admin/companies' && method === 'post') {
    const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
    const next = {
      id: `cmp-${Date.now()}`,
      companyName: body.companyName || 'New Company',
      companyCode: body.companyCode || `CMP${String(db.companies.length + 1).padStart(3, '0')}`,
      industry: body.industry || 'General',
      email: body.email || '',
      phone: body.phone || '',
      address: body.address || '',
      city: body.city || '',
      state: body.state || '',
      country: body.country || '',
      timezone: body.timezone || 'Asia/Kolkata',
      currency: body.currency || 'INR',
      gst: body.gst || '',
      pan: body.pan || '',
      plan: body.plan || 'Starter',
      employeeLimit: Number(body.employeeLimit || 50),
      storageLimit: Number(body.storageLimit || 5),
      status: body.status || 'active',
      createdAt: new Date().toISOString(),
      branches: [],
      storageUsage: { usedStorage: 0, documentsCount: 0, backupSize: 0 },
      branding: { logoUrl: '', primaryColor: '#0f766e', secondaryColor: '#115e59', customDomain: '', loginPageBranding: '' },
      domainSetup: { customDomain: '', verified: false, sslStatus: 'pending' }
    }
    db.companies.unshift(next)
    saveDb(db)
    return created(config, { item: next, message: 'Company created successfully' })
  }
  if (/^\/super-admin\/companies\/[^/]+$/.test(path) && (method === 'put' || method === 'patch')) {
    const id = path.split('/').pop()
    const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
    const idx = db.companies.findIndex((x) => String(x.id) === String(id))
    if (idx >= 0) db.companies[idx] = { ...db.companies[idx], ...body }
    saveDb(db)
    return ok(config, { item: db.companies[idx] || db.companies[0], message: 'Company updated successfully' })
  }
  if (/^\/super-admin\/companies\/[^/]+$/.test(path) && method === 'delete') {
    const id = path.split('/').pop()
    db.companies = db.companies.filter((x) => String(x.id) !== String(id))
    saveDb(db)
    return ok(config, { message: 'Company deleted successfully' })
  }
  if (/^\/super-admin\/companies\/[^/]+\/status$/.test(path) && method === 'patch') {
    const id = path.split('/')[3]
    const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
    const idx = db.companies.findIndex((x) => String(x.id) === String(id))
    if (idx >= 0) db.companies[idx] = { ...db.companies[idx], status: body.status || db.companies[idx].status }
    saveDb(db)
    return ok(config, { item: db.companies[idx] || db.companies[0], message: 'Status updated' })
  }
  if (/^\/super-admin\/companies\/[^/]+\/branches$/.test(path) && method === 'post') {
    const id = path.split('/')[3]
    const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
    const idx = db.companies.findIndex((x) => String(x.id) === String(id))
    const branch = { _id: `br-${Date.now()}`, ...body }
    if (idx >= 0) db.companies[idx].branches = [...(db.companies[idx].branches || []), branch]
    saveDb(db)
    return created(config, { item: db.companies[idx] || db.companies[0], message: 'Branch added' })
  }
  if (/^\/super-admin\/companies\/[^/]+\/branches\/[^/]+$/.test(path) && (method === 'put' || method === 'delete')) {
    const [, , , companyId, , branchId] = path.split('/')
    const idx = db.companies.findIndex((x) => String(x.id) === String(companyId))
    if (idx >= 0) {
      if (method === 'delete') {
        db.companies[idx].branches = (db.companies[idx].branches || []).filter((b) => String(b._id) !== String(branchId))
      } else {
        const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
        db.companies[idx].branches = (db.companies[idx].branches || []).map((b) => (String(b._id) === String(branchId) ? { ...b, ...body } : b))
      }
    }
    saveDb(db)
    return ok(config, { item: db.companies[idx] || db.companies[0], message: method === 'delete' ? 'Branch deleted' : 'Branch updated' })
  }

  if (path === '/super-admin/dashboard/stats' && method === 'get') {
    const companies = ensureArray(db.companies)
    const users = ensureArray(db.globalUsers)
    const subscriptions = ensureArray(db.subscriptions)
    const payments = ensureArray(db.payments)

    const monthlyRevenue = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    return ok(config, {
      data: {
        companies: companies.length,
        subscriptions: subscriptions.length,
        users: users.length,
        monthlyRevenue,
        systemHealth: {
          apiStatus: 'Operational',
          databaseStatus: 'Operational',
          storageStatus: 'Operational',
          uptime: '99.97%'
        }
      }
    })
  }
  if (path === '/super-admin/dashboard/overview' && method === 'get') {
    const companies = ensureArray(db.companies)
    const users = ensureArray(db.globalUsers)
    const subscriptions = ensureArray(db.subscriptions)
    const payments = ensureArray(db.payments)
    const tickets = ensureArray(db.tickets)
    const logs = ensureArray(db.auditLogs)

    const monthlyRevenue = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const revenueDeals = [
      { month: 'Jan', revenue: 82000, deals: 18 },
      { month: 'Feb', revenue: 90000, deals: 21 },
      { month: 'Mar', revenue: 101000, deals: 24 },
      { month: 'Apr', revenue: 98000, deals: 23 },
      { month: 'May', revenue: 114000, deals: 27 },
      { month: 'Jun', revenue: 126000, deals: 30 },
      { month: 'Jul', revenue: 121000, deals: 28 },
      { month: 'Aug', revenue: 132000, deals: 33 },
      { month: 'Sep', revenue: 141000, deals: 35 },
      { month: 'Oct', revenue: 149000, deals: 37 },
      { month: 'Nov', revenue: 158000, deals: 40 },
      { month: 'Dec', revenue: 169000, deals: 44 }
    ]

    const leadSources = [
      { source: 'Organic', value: 32 },
      { source: 'Paid Ads', value: 24 },
      { source: 'Referrals', value: 21 },
      { source: 'Direct', value: 14 },
      { source: 'Partners', value: 9 }
    ]

    const salesFunnel = [
      { stage: 'Leads', count: 460 },
      { stage: 'Qualified', count: 300 },
      { stage: 'Demo', count: 210 },
      { stage: 'Proposal', count: 132 },
      { stage: 'Won', count: 84 }
    ]

    const openTickets = tickets.filter((item) => String(item.status || '').toLowerCase() === 'open').length
    const resolvedTickets = tickets.filter((item) => String(item.status || '').toLowerCase() === 'closed').length
    const pendingTickets = Math.max(tickets.length - openTickets - resolvedTickets, 0)

    const recentActivities = logs.slice(0, 8).map((item, index) => ({
      title: item.action || `Event ${index + 1}`,
      description: item.description || 'Platform activity event',
      type: item.category || 'System',
      createdAt: item.createdAt || item.dateTime || new Date(Date.now() - index * 3600000).toISOString()
    }))

    return ok(config, {
      data: {
        stats: {
          totalCompanies: companies.length,
          activeCompanies: companies.filter((item) => String(item.status || '').toLowerCase() === 'active').length,
          totalAdmins: ensureArray(db.users).filter((item) => String(item.role || '').toLowerCase() === 'admin').length,
          totalUsers: users.length,
          activeUsers: users.filter((item) => String(item.status || '').toLowerCase() !== 'inactive').length,
          activeSubscriptions: subscriptions.filter((item) => String(item.status || '').toLowerCase() === 'active').length,
          monthlyRevenue,
          systemHealth: 'Healthy'
        },
        revenueDeals,
        leadSources,
        salesFunnel,
        supportSummary: {
          totalTickets: tickets.length,
          openTickets,
          pendingTickets,
          resolvedTickets
        },
        recentActivities,
        aiInsights: [
          { title: 'Revenue acceleration', message: 'Enterprise plan conversions increased this quarter.', severity: 'success' },
          { title: 'Renewal watchlist', message: '8 subscriptions are due for renewal in the next 10 days.', severity: 'warning' },
          { title: 'Support stability', message: 'Average first response time improved by 11%.', severity: 'info' }
        ]
      }
    })
  }
  if (path === '/super-admin/dashboard/system-health' && method === 'get') {
    return ok(config, { data: { api: 'healthy', db: 'healthy', queue: 'healthy' } })
  }
  if (path === '/super-admin/dashboard/recent-activities' && method === 'get') {
    return ok(config, { data: db.auditLogs })
  }
  if (path === '/super-admin/dashboard/platform-overview' && method === 'get') {
    const items = ensureArray(db.platformOverview).map((item, index) => ({
      _id: item._id || item.id || `po-${index + 1}`,
      name: item.name || item.metric || `Overview ${index + 1}`,
      value: item.value || '-',
      status: item.status || 'active'
    }))
    return ok(config, { items, data: items })
  }
  if (/^\/super-admin\/dashboard\/widgets\/[^/]+$/.test(path) && method === 'get') {
    const sectionKey = path.split('/').pop()
    const items = ensureArray(db.dashboardWidgets).map((item, index) => ({
      _id: item._id || item.id || `wid-${index + 1}`,
      sectionKey: item.section || sectionKey,
      name: item.title || `Widget ${index + 1}`,
      value: item.value ?? 0,
      status: 'active'
    }))
    return ok(config, { items, data: items })
  }
  if (path === '/super-admin/dashboard/premium-crm' && method === 'get') {
    return ok(config, { data: { revenue: 120000, leads: 320, winRate: 42 } })
  }
  if (path === '/super-admin/system-settings' && method === 'get') {
    return ok(config, { items: [
      { _id: 'ss-01', group: 'General Settings', key: 'general_settings', value: { appName: 'HRMS Demo', supportEmail: 'support@demo.com' }, description: 'General application settings' },
      { _id: 'ss-02', group: 'Date Format', key: 'date_format', value: { format: 'DD-MM-YYYY' }, description: 'Date format setting' },
      { _id: 'ss-03', group: 'Timezone Settings', key: 'timezone_settings', value: { timezone: 'Asia/Kolkata' }, description: 'Timezone selection' }
    ] })
  }
  // Support Center (strict shapes for unified module pages)
  if (path === '/super-admin/support/tickets' && method === 'get') {
    const params = config?.params || {}
    const page = Number(params.page || 1)
    const limit = Number(params.limit || 10)
    const search = String(params.search || '').toLowerCase()
    const status = String(params.status || 'all').toLowerCase()

    const items = db.tickets
      .map((t, idx) => ({
        _id: t._id || t.id || `tkt-${idx + 1}`,
        ticketNo: t.ticketNo || `TCK-${1000 + idx}`,
        subject: t.subject || 'Support request',
        description: t.description || '',
        status: String(t.status || 'open').toLowerCase(),
        priority: String(t.priority || 'medium').toLowerCase(),
        category: t.category || { _id: db.supportCategories[0]?.id || 'sc-01', name: db.supportCategories[0]?.name || 'Technical' },
        assignedAgent: t.assignedAgent || { _id: db.supportAgents[0]?.id || 'sa-01', name: db.supportAgents[0]?.name || 'Nora Agent' },
        slaDueAt: t.slaDueAt || new Date(Date.now() + (idx + 1) * 3600000).toISOString(),
        createdAt: t.createdAt || new Date().toISOString(),
        messages: Array.isArray(t.messages) ? t.messages : []
      }))
      .filter((t) => (status === 'all' ? true : t.status === status))
      .filter((t) => !search || `${t.ticketNo} ${t.subject} ${t.description}`.toLowerCase().includes(search))

    return ok(config, {
      items,
      pagination: { page, limit, total: items.length, totalPages: Math.max(1, Math.ceil(items.length / limit)) }
    })
  }
  if (path === '/super-admin/support/tickets' && method === 'post') {
    const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
    const category = db.supportCategories.find((c) => String(c.id || c._id) === String(body.category)) || db.supportCategories[0]
    const agent = db.supportAgents.find((a) => String(a.id || a._id) === String(body.assignedAgent)) || db.supportAgents[0]
    const next = {
      _id: `tkt-${Date.now()}`,
      ticketNo: `TCK-${1000 + db.tickets.length + 1}`,
      subject: body.subject || 'New Ticket',
      description: body.description || '',
      status: body.status || 'open',
      priority: body.priority || 'medium',
      category: category ? { _id: category._id || category.id, name: category.name } : { _id: 'sc-01', name: 'Technical' },
      assignedAgent: agent ? { _id: agent._id || agent.id, name: agent.name } : { _id: 'sa-01', name: 'Nora Agent' },
      slaDueAt: new Date(Date.now() + 24 * 3600000).toISOString(),
      createdAt: new Date().toISOString(),
      messages: []
    }
    db.tickets.unshift(next)
    saveDb(db)
    return created(config, { item: next, message: 'Ticket created successfully' })
  }
  if (/^\/super-admin\/support\/tickets\/[^/]+$/.test(path) && method === 'put') {
    const id = path.split('/').pop()
    const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
    const idx = db.tickets.findIndex((t) => String(t._id || t.id) === String(id))
    if (idx >= 0) db.tickets[idx] = { ...db.tickets[idx], ...body }
    saveDb(db)
    return ok(config, { item: db.tickets[idx] || db.tickets[0], message: 'Ticket updated successfully' })
  }
  if (/^\/super-admin\/support\/tickets\/[^/]+\/assign$/.test(path) && method === 'patch') return ok(config, { message: 'Ticket assigned successfully' })
  if (/^\/super-admin\/support\/tickets\/[^/]+\/priority$/.test(path) && method === 'patch') return ok(config, { message: 'Priority updated successfully' })
  if (/^\/super-admin\/support\/tickets\/[^/]+\/sla$/.test(path) && method === 'patch') return ok(config, { message: 'SLA updated successfully' })
  if (/^\/super-admin\/support\/tickets\/[^/]+\/resolve$/.test(path) && method === 'patch') return ok(config, { message: 'Ticket resolved successfully' })
  if (/^\/super-admin\/support\/tickets\/[^/]+\/messages$/.test(path) && method === 'get') {
    const id = path.split('/')[4]
    const ticket = db.tickets.find((t) => String(t._id || t.id) === String(id))
    const items = (ticket?.messages || []).length
      ? ticket.messages
      : [{ _id: `msg-${id}-1`, senderType: 'agent', senderName: 'Nora Agent', message: 'We are checking this issue.', createdAt: new Date().toISOString() }]
    return ok(config, { items })
  }
  if (/^\/super-admin\/support\/tickets\/[^/]+\/messages$/.test(path) && method === 'post') return created(config, { message: 'Message added successfully' })
  if (/^\/super-admin\/support\/tickets\/[^/]+\/internal-notes$/.test(path) && method === 'post') return created(config, { message: 'Internal note added successfully' })
  if (path === '/super-admin/support/categories' && method === 'get') {
    const items = db.supportCategories.map((c, idx) => ({ _id: c._id || c.id || `sc-${idx + 1}`, name: c.name || `Category ${idx + 1}` }))
    return ok(config, { items })
  }
  if (path === '/super-admin/support/categories' && method === 'post') {
    const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
    const next = { _id: `sc-${Date.now()}`, name: body.name || 'New Category' }
    db.supportCategories.unshift(next)
    saveDb(db)
    return created(config, { item: next, message: 'Category created successfully' })
  }
  if (path === '/super-admin/support/agents' && method === 'get') {
    const items = db.supportAgents.map((a, idx) => ({ _id: a._id || a.id || `sa-${idx + 1}`, name: a.name || `Agent ${idx + 1}` }))
    return ok(config, { items })
  }
  if (path === '/super-admin/support/agents' && method === 'post') {
    const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
    const next = { _id: `sa-${Date.now()}`, name: body.name || 'New Agent' }
    db.supportAgents.unshift(next)
    saveDb(db)
    return created(config, { item: next, message: 'Agent created successfully' })
  }

  // Audit & Security
  if (path === '/super-admin/audit-security/logs' && method === 'get') {
    const params = config?.params || {}
    const page = Number(params.page || 1)
    const limit = Number(params.limit || 50)
    const category = String(params.category || 'all').toLowerCase()
    const search = String(params.search || '').toLowerCase()
    const items = db.auditLogs
      .map((l, idx) => ({
        _id: l._id || l.id || `aud-${idx + 1}`,
        dateTime: l.dateTime || l.createdAt || new Date(Date.now() - idx * 3600000).toISOString(),
        category: l.category || 'Security Logs',
        actorName: l.actorName || 'Super Admin',
        module: l.module || 'Auth',
        action: l.action || 'LOGIN',
        description: l.description || `${l.action || 'Action'} event`,
        ipAddress: l.ipAddress || `192.168.1.${(idx % 50) + 10}`,
        device: l.device || (idx % 2 === 0 ? 'Chrome / Windows' : 'Mobile App')
      }))
      .filter((x) => (category === 'all' ? true : String(x.category).toLowerCase() === category))
      .filter((x) => !search || `${x.actorName} ${x.action} ${x.description} ${x.module}`.toLowerCase().includes(search))
    return ok(config, { items, pagination: { page, limit, total: items.length, totalPages: Math.max(1, Math.ceil(items.length / limit)) } })
  }
  if (path === '/super-admin/audit-security/logs' && method === 'post') {
    const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
    const next = {
      _id: `aud-${Date.now()}`,
      dateTime: new Date().toISOString(),
      category: body.category || 'Security Logs',
      actorName: body.actorName || 'Super Admin',
      module: body.module || 'Audit & Security',
      action: body.action || 'MANUAL_LOG',
      description: body.description || 'Manual audit entry',
      ipAddress: '127.0.0.1',
      device: 'Browser'
    }
    db.auditLogs.unshift(next)
    saveDb(db)
    return created(config, { item: next, message: 'Audit log added successfully' })
  }
  if (path === '/super-admin/audit-security/logs/export' && method === 'get') return ok(config, { message: 'Audit logs export generated', count: db.auditLogs.length })
  if (path === '/super-admin/audit-security/settings' && method === 'get') {
    return ok(config, {
      items: [
        { _id: 'sec-01', group: 'Authentication', key: 'password_policy', description: 'Password policy rules', value: { minLength: 8, requireUppercase: true, requireNumber: true } },
        { _id: 'sec-02', group: 'Authentication', key: 'two_factor_auth', description: '2FA controls', value: { enabled: true, methods: ['email', 'authenticator'] } },
        { _id: 'sec-03', group: 'SSO/OAuth', key: 'sso_settings', description: 'Single sign-on provider config', value: { enabled: false, provider: '' } },
        { _id: 'sec-04', group: 'SSO/OAuth', key: 'oauth_settings', description: 'OAuth client config', value: { enabled: true, clientId: 'demo-client', clientSecret: 'demo-secret' } },
        { _id: 'sec-05', group: 'Network Security', key: 'ip_whitelisting', description: 'Allowed IP list', value: { enabled: false, ips: [] } },
        { _id: 'sec-06', group: 'Session Control', key: 'session_timeout', description: 'Idle session timeout', value: { minutes: 30 } },
        { _id: 'sec-07', group: 'Session Control', key: 'token_expiry_settings', description: 'Token expiry timings', value: { accessTokenMinutes: 60, refreshTokenDays: 7 } },
        { _id: 'sec-08', group: 'Threat Detection', key: 'threat_monitoring', description: 'Threat monitoring and alerting', value: { enabled: true, alertLevel: 'medium' } },
        { _id: 'sec-09', group: 'Threat Detection', key: 'captcha_settings', description: 'Captcha provider configuration', value: { enabled: true, provider: 'reCAPTCHA' } }
      ]
    })
  }
  if (path === '/super-admin/audit-security/settings' && method === 'put') return ok(config, { message: 'Security setting saved successfully' })

  // AI Center
  if (path === '/super-admin/ai/insights' && method === 'get') {
    const module = String(config?.params?.module || 'AI Dashboard')
    return ok(config, {
      data: {
        module,
        data: {
          score: 82,
          trend: '+6%',
          highlights: ['Prediction confidence stable', 'Usage increasing across payroll', 'No anomaly in last 24h']
        }
      }
    })
  }
  if (path === '/super-admin/ai/settings' && method === 'get') {
    const items = [
      { _id: 'ai-01', key: 'default_model', description: 'Default AI model for analytics', value: 'gpt-5.4-mini' },
      { _id: 'ai-02', key: 'insight_refresh_interval', description: 'Refresh interval in minutes', value: 30 },
      { _id: 'ai-03', key: 'anomaly_detection', description: 'Enable anomaly detection', value: true }
    ]
    return ok(config, { items })
  }
  if (path === '/super-admin/ai/settings' && method === 'put') return ok(config, { message: 'AI setting saved successfully' })
  if (path === '/super-admin/ai/usage-logs' && method === 'get') {
    const items = Array.from({ length: 18 }).map((_, idx) => ({
      _id: `ai-log-${idx + 1}`,
      module: ['AI Dashboard', 'Attendance Insights', 'Payroll Analytics'][idx % 3],
      action: idx % 2 === 0 ? 'VIEW_INSIGHT' : 'RUN_REPORT',
      usageCount: (idx % 5) + 1,
      actor: idx % 2 === 0 ? 'Super Admin' : 'HR Manager',
      dateTime: new Date(Date.now() - idx * 1800000).toISOString()
    }))
    return ok(config, { items })
  }
  if (path === '/super-admin/ai/usage-logs' && method === 'post') return created(config, { message: 'AI usage log created successfully' })
  if (path === '/super-admin/ai/automation-rules' && method === 'get') {
    const items = db.automationRules.map((r, idx) => ({
      _id: r._id || r.id || `rule-${idx + 1}`,
      name: r.name || `Automation Rule ${idx + 1}`,
      trigger: r.trigger || 'on_low_attendance',
      action: r.action || 'notify_manager',
      enabled: typeof r.enabled === 'boolean' ? r.enabled : true
    }))
    return ok(config, { items })
  }
  if (path === '/super-admin/ai/automation-rules' && method === 'post') {
    const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
    const next = { _id: `rule-${Date.now()}`, name: body.name || 'New Rule', trigger: body.trigger || 'manual', action: body.action || 'notify', enabled: body.enabled !== false }
    db.automationRules.unshift(next)
    saveDb(db)
    return created(config, { item: next, message: 'Automation rule created successfully' })
  }
  if (/^\/super-admin\/ai\/automation-rules\/[^/]+$/.test(path) && method === 'put') {
    const id = path.split('/').pop()
    const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
    const idx = db.automationRules.findIndex((r) => String(r._id || r.id) === String(id))
    if (idx >= 0) db.automationRules[idx] = { ...db.automationRules[idx], ...body }
    saveDb(db)
    return ok(config, { item: db.automationRules[idx] || db.automationRules[0], message: 'Automation rule updated successfully' })
  }

  if (path === '/admin/settings' && method === 'get') {
    return ok(config, { data: {
      companyProfile: { name: 'Acme Corp', email: 'info@acme.com', phone: '+91-9999999999', address: 'Bangalore', website: 'acme.com' },
      officeTiming: { startTime: '09:00', endTime: '18:00', timezone: 'Asia/Kolkata' },
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      attendanceRules: { workHoursPerDay: 8, graceMinutes: 15, halfDayHours: 4 },
      leavePolicy: { casual: 12, sick: 12, earned: 15 },
      payrollSettings: { payDay: 30, pfEnabled: true, pfPercent: 12, esiEnabled: false, esiPercent: 0 },
      holidays: [{ id: 'hol-01', name: 'Independence Day', date: '2026-08-15', type: 'National', description: 'National holiday' }]
    } })
  }

  // Generic REST-style mock for remaining modules
  const resourceKey = Object.keys(maps).find((k) => path.includes(`/${k}`))
  if (resourceKey) {
    const list = maps[resourceKey]
    const match = path.match(/\/([^/]+)\/?$/)
    const maybeId = match ? match[1] : ''
    const looksLikeId = /^(?:[a-z]+-)?\d+|[a-z]{2,}-[a-z0-9-]+$/i.test(maybeId) && !path.endsWith(`/${resourceKey}`)

    if (isCollectionGet(method, looksLikeId ? maybeId : '')) {
      return ok(config, {
        data: list,
        items: list,
        records: list,
        overview: { total: Array.isArray(list) ? list.length : 0 },
        stats: { total: Array.isArray(list) ? list.length : 0 },
        summary: summarizeAttendance(Array.isArray(db.attendance) ? db.attendance : [])
      })
    }

    if (isDetailGet(method, looksLikeId ? maybeId : '')) {
      const found = Array.isArray(list) ? list.find((x) => String(x.id) === String(maybeId)) || list[0] || {} : {}
      return ok(config, { data: found, item: found })
    }

    if (method === 'post') {
      const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
      const createdItem = { id: `${resourceKey}-${Date.now()}`, ...(body instanceof FormData ? {} : body), createdAt: new Date().toISOString() }
      if (Array.isArray(list)) list.unshift(createdItem)
      saveDb(db)
      return created(config, { message: 'Created successfully', data: createdItem, item: createdItem, items: list })
    }

    if (method === 'put' || method === 'patch') {
      const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
      const updated = { ...(Array.isArray(list) ? list[0] : {}), ...(body instanceof FormData ? {} : body), updatedAt: new Date().toISOString() }
      return ok(config, { message: 'Updated successfully', data: updated, item: updated, items: list })
    }

    if (method === 'delete') {
      return ok(config, { message: 'Deleted successfully', success: true, items: list, data: null })
    }
  }

  // Final safe fallback
  return ok(config, {
    message: 'Demo response',
    success: true,
    data: [],
    items: [],
    records: [],
    stats: {},
    summary: {},
    overview: {}
  })
}


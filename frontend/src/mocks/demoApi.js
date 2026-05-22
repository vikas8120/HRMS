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
    { id: 'emp-003', employeeId: 'EMP003', name: 'Mia Designer', role: 'UI/UX Designer', department: 'Design', departmentId: 'dep-02', status: 'active' }
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
    { id: 'task-01', title: 'Finish onboarding docs', status: 'in-progress', dueDate: nowIso, priority: 'medium' }
  ],
  tickets: [
    { id: 'tic-01', ticketNo: 'TCK-1001', subject: 'Laptop issue', description: 'Keyboard not working', status: 'open', priority: 'medium', createdAt: nowIso, messages: [] }
  ],
  payroll: [
    { id: 'pay-01', employeeId: 'emp-001', employeeName: 'John Employee', month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, netSalary: 78000, status: 'processed' }
  ],
  attendance: [
    { id: 'att-01', employeeId: 'emp-001', employeeName: 'John Employee', departmentId: 'dep-01', date: nowIso.slice(0, 10), checkIn: '09:34', checkOut: '18:12', status: 'present', workingHours: 8.6 }
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
  managerMessages: [{ id: 'msg-01', subject: 'Team update', status: 'sent' }],
  managerNotifications: [{ id: 'mn-01', title: 'Leave approval pending', status: 'unread' }],
  managerSupportTickets: [{ id: 'mst-01', ticketNo: 'MST-1001', subject: 'Access issue', status: 'open' }],
  managerPerformance: [{ id: 'mpr-01', employeeId: 'emp-002', rating: 4.5, period: 'Q2-2026' }],
  employeeLeaves: [{ id: 'el-01', type: 'casual', status: 'approved', fromDate: nowIso.slice(0, 10), toDate: nowIso.slice(0, 10) }],
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
  'global-users': db.globalUsers,
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
    return ok(config, {
      data: {
        profile: db.employees[0],
        stats: { tasks: db.tasks.length, announcements: db.announcements.length, documents: db.documents.length },
        announcements: db.announcements,
        tasks: db.tasks,
        attendanceToday: db.attendance[0]
      }
    })
  }

  if (path === '/manager/dashboard' && method === 'get') {
    return ok(config, {
      data: {
        stats: { teamSize: db.employees.length, openRequests: db.managerRequests.length, upcomingMeetings: db.managerMeetings.length },
        recentActivities: db.managerMessages,
        notifications: db.managerNotifications
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
    if (path.endsWith('/check-in') && method === 'post') return ok(config, { message: 'Checked in', data: { ...db.attendance[0], checkIn: new Date().toISOString() } })
    if (path.endsWith('/check-out') && method === 'post') return ok(config, { message: 'Checked out', data: { ...db.attendance[0], checkOut: new Date().toISOString() } })
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
    return ok(config, { totals: { employees: db.employees.length, departments: db.departments.length, attendanceToday: db.attendance.length, payrollProcessed: db.payroll.length }, recentEmployees: db.employees })
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
    return ok(config, { data: { companies: db.companies.length, subscriptions: db.subscriptions.length, users: db.globalUsers.length } })
  }
  if (path === '/super-admin/dashboard/overview' && method === 'get') {
    return ok(config, { data: db.platformOverview })
  }
  if (path === '/super-admin/dashboard/system-health' && method === 'get') {
    return ok(config, { data: { api: 'healthy', db: 'healthy', queue: 'healthy' } })
  }
  if (path === '/super-admin/dashboard/recent-activities' && method === 'get') {
    return ok(config, { data: db.auditLogs })
  }
  if (path === '/super-admin/dashboard/platform-overview' && method === 'get') {
    return ok(config, { items: db.platformOverview, data: db.platformOverview })
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
  if (path === '/super-admin/global-users' && method === 'get') {
    const items = db.globalUsers.map((u, idx) => ({
      _id: u._id || u.id || `gu-${idx + 1}`,
      name: u.name || `Global User ${idx + 1}`,
      email: u.email || `user${idx + 1}@demo.com`,
      phone: u.phone || '+91-9000000000',
      company: { companyName: u.company?.companyName || 'Acme Corp' },
      role: u.role || 'EMPLOYEE',
      status: u.status || 'active',
      lastLogin: u.lastLogin || new Date().toISOString()
    }))
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
  if (path === '/super-admin/global-users/login-history' && method === 'get') {
    const items = db.globalUsers.slice(0, 20).map((u, idx) => ({
      _id: `lh-${idx + 1}`,
      user: { name: u.name, email: u.email },
      email: u.email,
      ipAddress: `192.168.0.${(idx % 20) + 10}`,
      device: idx % 2 === 0 ? 'Chrome / Windows' : 'Safari / iOS',
      success: idx % 4 !== 0,
      dateTime: new Date(Date.now() - (idx * 3600000)).toISOString()
    }))
    return ok(config, { items })
  }
  if (path === '/super-admin/global-users/active-sessions' && method === 'get') {
    const items = db.globalUsers.slice(0, 12).map((u, idx) => ({
      _id: `ses-${idx + 1}`,
      user: { name: u.name, email: u.email },
      ipAddress: `10.0.0.${(idx % 20) + 20}`,
      device: idx % 2 === 0 ? 'Windows Chrome' : 'Android App',
      active: true,
      loggedInAt: new Date(Date.now() - (idx * 5400000)).toISOString()
    }))
    return ok(config, { items })
  }
  if (path === '/super-admin/global-users/failed-attempts' && method === 'get') {
    const items = db.globalUsers.slice(0, 8).map((u, idx) => ({
      _id: `fa-${idx + 1}`,
      user: { name: u.name, email: u.email },
      email: u.email,
      ipAddress: `172.16.0.${(idx % 20) + 30}`,
      device: 'Unknown',
      success: false,
      dateTime: new Date(Date.now() - (idx * 7200000)).toISOString()
    }))
    return ok(config, { items })
  }
  if (path === '/super-admin/global-users/device-tracking' && method === 'get') {
    const items = db.globalUsers.slice(0, 15).map((u, idx) => ({
      _id: `dt-${idx + 1}`,
      user: { name: u.name, email: u.email },
      deviceType: idx % 2 === 0 ? 'Desktop' : 'Mobile',
      os: idx % 2 === 0 ? 'Windows 11' : 'Android',
      browser: idx % 2 === 0 ? 'Chrome' : 'Edge',
      ipAddress: `100.64.0.${(idx % 20) + 40}`,
      dateTime: new Date(Date.now() - (idx * 1800000)).toISOString()
    }))
    return ok(config, { items })
  }
  if (path === '/super-admin/global-users/bulk-export' && method === 'get') {
    return ok(config, { message: 'Bulk export generated', items: db.globalUsers })
  }
  if (path === '/super-admin/global-users/bulk-import' && method === 'post') {
    const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
    const users = Array.isArray(body.users) ? body.users : []
    users.forEach((u, idx) => {
      db.globalUsers.push({
        _id: `gu-import-${Date.now()}-${idx}`,
        name: u.name || `Imported User ${idx + 1}`,
        email: u.email || `import${idx + 1}@demo.com`,
        phone: u.phone || '',
        company: { companyName: 'Imported Co' },
        role: u.role || 'EMPLOYEE',
        status: u.status || 'active',
        lastLogin: new Date().toISOString()
      })
    })
    saveDb(db)
    return created(config, { message: 'Bulk import completed', count: users.length })
  }
  if (/^\/super-admin\/global-users\/[^/]+$/.test(path) && (method === 'put' || method === 'patch')) {
    return ok(config, { message: method === 'patch' ? 'User status updated' : 'User updated' })
  }
  if (/^\/super-admin\/global-users\/[^/]+\/(status|force-logout)$/.test(path) && method === 'patch') {
    return ok(config, { message: path.endsWith('/force-logout') ? 'User logged out from all sessions' : 'User status updated' })
  }
  if (path === '/super-admin/global-users' && method === 'post') {
    const body = typeof config.data === 'string' ? safeParse(config.data, {}) : (config.data || {})
    const next = {
      _id: `gu-${Date.now()}`,
      name: body.name || 'New User',
      email: body.email || 'new@demo.com',
      phone: body.phone || '',
      company: { companyName: 'Acme Corp' },
      role: body.role || 'EMPLOYEE',
      status: body.status || 'active',
      lastLogin: new Date().toISOString()
    }
    db.globalUsers.unshift(next)
    saveDb(db)
    return created(config, { item: next, message: 'User created' })
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

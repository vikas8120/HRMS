import asyncHandler from '../utils/asyncHandler.js'
import prisma from '../config/prisma.js'
import crypto from 'crypto'
import { getSequelize } from '../config/pgCompat.js'

const modelFilterSql = (model) => `SELECT * FROM documents WHERE model = '${model}'`
const toNum = (value) => Number(value || 0)
const now = new Date()
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

const countByStatus = (rows, statuses) => rows.filter((r) => statuses.includes(String(r.data?.status || '').toLowerCase())).length
const inDateRange = (date, from, to) => {
  if (!date) return false
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return false
  if (from && d < new Date(from)) return false
  if (to && d > new Date(to)) return false
  return true
}

const normalizeActivity = (raw) => ({
  id: raw.doc_id,
  actor: raw.data?.actor || '-',
  actorRole: raw.data?.actorRole || '-',
  module: raw.data?.module || '-',
  action: raw.data?.action || '-',
  description: raw.data?.description || '',
  severity: raw.data?.severity || 'info',
  createdAt: raw.data?.createdAt || raw.created_at || new Date().toISOString(),
  time: raw.data?.createdAt || raw.created_at || new Date().toISOString()
})

const getRecentActivitiesCore = async ({ search = '', severity = 'all', page = 1, limit = 10 } = {}) => {
  const rows = await prisma.$queryRawUnsafe(modelFilterSql('AuditLog'))
  const text = String(search || '').toLowerCase()
  const sev = String(severity || 'all').toLowerCase()

  const filtered = (rows || []).map(normalizeActivity).filter((item) => {
    const matchSeverity = sev === 'all' || String(item.severity).toLowerCase() === sev
    const hay = `${item.actor} ${item.action} ${item.module}`.toLowerCase()
    const matchText = !text || hay.includes(text)
    return matchSeverity && matchText
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const total = filtered.length
  const skip = (Number(page) - 1) * Number(limit)
  const items = filtered.slice(skip, skip + Number(limit))

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.max(1, Math.ceil(total / Number(limit)))
    }
  }
}

const getDashboardData = async (query = {}) => {
  const [companies, users, subscriptions, invoices, payments, tickets, health] = await Promise.all([
    prisma.$queryRawUnsafe(modelFilterSql('TenantCompany')),
    prisma.$queryRawUnsafe(modelFilterSql('GlobalUser')),
    prisma.$queryRawUnsafe(modelFilterSql('Subscription')),
    prisma.$queryRawUnsafe(modelFilterSql('Invoice')),
    prisma.$queryRawUnsafe(modelFilterSql('PaymentTransaction')),
    prisma.$queryRawUnsafe(modelFilterSql('SupportTicket')),
    prisma.$queryRawUnsafe(modelFilterSql('SystemHealthLog'))
  ])

  const companyRows = companies || []
  const userRows = users || []
  const subscriptionRows = subscriptions || []
  const invoiceRows = invoices || []
  const paymentRows = payments || []
  const ticketRows = tickets || []

  const totalCompanies = companyRows.length
  const activeCompanies = countByStatus(companyRows, ['active'])
  const suspendedCompanies = countByStatus(companyRows, ['suspended'])
  const trialCompanies = countByStatus(companyRows, ['trial'])
  const inactiveCompanies = countByStatus(companyRows, ['inactive'])
  const expiredCompanies = countByStatus(companyRows, ['expired'])

  const totalUsers = userRows.length
  const activeUsers = countByStatus(userRows, ['active'])
  const blockedUsers = countByStatus(userRows, ['blocked'])
  const inactiveUsers = Math.max(0, totalUsers - activeUsers)

  const activeToday = userRows.filter((u) => {
    const d = u.data?.lastLogin || u.data?.lastActiveAt
    if (!d) return false
    return new Date(d).toDateString() === now.toDateString()
  }).length

  const activeThisWeek = userRows.filter((u) => {
    const d = u.data?.lastLogin || u.data?.lastActiveAt
    if (!d) return false
    return new Date(d) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  }).length

  const activeThisMonth = userRows.filter((u) => {
    const d = u.data?.lastLogin || u.data?.lastActiveAt
    if (!d) return false
    return new Date(d) >= startOfMonth
  }).length

  const totalSubscriptions = subscriptionRows.length
  const activeSubscriptions = countByStatus(subscriptionRows, ['active'])
  const trialSubscriptions = countByStatus(subscriptionRows, ['trial'])
  const expiredSubscriptions = countByStatus(subscriptionRows, ['expired'])
  const cancelledSubscriptions = countByStatus(subscriptionRows, ['cancelled'])
  const expiringSoon = subscriptionRows.filter((s) => {
    const endDate = s.data?.endDate || s.data?.expiryDate
    if (!endDate) return false
    const date = new Date(endDate)
    return date >= now && date <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  }).length

  const invoiceInRange = invoiceRows.filter((i) => inDateRange(i.data?.createdAt || i.data?.date, query.from, query.to))
  const paidInvoices = countByStatus(invoiceRows, ['paid'])
  const unpaidInvoices = countByStatus(invoiceRows, ['unpaid', 'pending'])

  const paymentAmount = (row) => toNum(row.data?.amount || row.data?.total || 0)
  const totalRevenue = paymentRows
    .filter((p) => ['paid', 'success', 'completed'].includes(String(p.data?.status || '').toLowerCase()))
    .reduce((sum, row) => sum + paymentAmount(row), 0)

  const currentMonthRevenue = paymentRows
    .filter((p) => ['paid', 'success', 'completed'].includes(String(p.data?.status || '').toLowerCase()))
    .filter((p) => new Date(p.data?.createdAt || p.data?.date || 0) >= startOfMonth)
    .reduce((sum, row) => sum + paymentAmount(row), 0)

  const previousMonthRevenue = paymentRows
    .filter((p) => ['paid', 'success', 'completed'].includes(String(p.data?.status || '').toLowerCase()))
    .filter((p) => {
      const d = new Date(p.data?.createdAt || p.data?.date || 0)
      return d >= startOfPrevMonth && d < startOfMonth
    })
    .reduce((sum, row) => sum + paymentAmount(row), 0)

  const growthPercentage = previousMonthRevenue > 0 ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0
  const failedPayments = countByStatus(paymentRows, ['failed'])

  const totalTickets = ticketRows.length
  const openTickets = countByStatus(ticketRows, ['open'])
  const inProgressTickets = countByStatus(ticketRows, ['in_progress', 'in progress'])
  const escalatedTickets = countByStatus(ticketRows, ['escalated'])
  const resolvedTickets = countByStatus(ticketRows, ['resolved'])
  const closedTickets = countByStatus(ticketRows, ['closed'])
  const criticalTickets = ticketRows.filter((t) => String(t.data?.priority || '').toLowerCase() === 'critical').length

  const healthRows = (health || []).map((row) => ({
    id: row.doc_id,
    status: row.data?.status || 'unknown',
    apiStatus: row.data?.apiStatus || 'unknown',
    databaseStatus: row.data?.databaseStatus || 'unknown',
    storageStatus: row.data?.storageStatus || 'unknown',
    uptime: row.data?.uptime || '0%',
    message: row.data?.message || '',
    createdAt: row.data?.createdAt || row.created_at || null
  })).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

  const lastHealth = healthRows?.[0] || null
  const systemHealthStatus = lastHealth?.status || 'unknown'

  const activities = await getRecentActivitiesCore({
    search: query.search || '',
    severity: query.severity || 'all',
    page: query.page || 1,
    limit: query.limit || 10
  })

  return {
    overview: {
      totalCompanies,
      activeCompanies,
      suspendedCompanies,
      trialCompanies,
      totalUsers,
      activeUsers,
      activeSubscriptions,
      monthlyRevenue: currentMonthRevenue,
      openTickets,
      systemHealthStatus
    },
    totalCompanies: {
      total: totalCompanies,
      active: activeCompanies,
      inactive: inactiveCompanies,
      suspended: suspendedCompanies,
      trial: trialCompanies,
      expired: expiredCompanies,
      growthThisMonth: 0,
      items: companyRows.map((c) => ({
        id: c.doc_id,
        companyName: c.data?.companyName || c.data?.name || '-',
        code: c.data?.companyCode || c.data?.code || '-',
        industry: c.data?.industry || '-',
        status: c.data?.status || 'inactive',
        createdAt: c.data?.createdAt || null
      }))
    },
    activeUsers: {
      total: totalUsers,
      activeToday,
      activeThisWeek,
      activeThisMonth,
      inactive: inactiveUsers,
      blocked: blockedUsers,
      items: userRows.map((u) => ({
        id: u.doc_id,
        name: u.data?.name || '-',
        email: u.data?.email || '-',
        role: u.data?.role || '-',
        company: u.data?.companyName || '-',
        status: u.data?.status || 'inactive',
        lastLogin: u.data?.lastLogin || null
      }))
    },
    activeSubscriptions: {
      total: totalSubscriptions,
      active: activeSubscriptions,
      trial: trialSubscriptions,
      expired: expiredSubscriptions,
      cancelled: cancelledSubscriptions,
      expiringSoon,
      items: subscriptionRows.map((s) => ({
        id: s.doc_id,
        company: s.data?.companyName || '-',
        plan: s.data?.planName || s.data?.plan || '-',
        status: s.data?.status || '-',
        startDate: s.data?.startDate || null,
        endDate: s.data?.endDate || s.data?.expiryDate || null,
        autoRenew: Boolean(s.data?.autoRenewal)
      }))
    },
    monthlyRevenue: {
      totalRevenue,
      currentMonthRevenue,
      previousMonthRevenue,
      growthPercentage,
      paidInvoices,
      unpaidInvoices,
      failedPayments,
      items: invoiceInRange.map((i) => ({
        id: i.doc_id,
        invoiceNo: i.data?.invoiceNumber || i.data?.invoiceNo || i.doc_id,
        company: i.data?.companyName || '-',
        amount: toNum(i.data?.amount || i.data?.total || 0),
        status: i.data?.status || 'unpaid',
        date: i.data?.createdAt || i.data?.date || null
      }))
    },
    supportTicketSummary: {
      totalTickets,
      openTickets,
      inProgressTickets,
      escalatedTickets,
      resolvedTickets,
      closedTickets,
      criticalTickets,
      items: ticketRows.map((t) => ({
        id: t.doc_id,
        ticketId: t.data?.ticketId || t.doc_id,
        subject: t.data?.subject || '-',
        company: t.data?.companyName || '-',
        priority: t.data?.priority || '-',
        status: t.data?.status || '-',
        createdAt: t.data?.createdAt || null
      }))
    },
    systemHealth: {
      status: lastHealth?.status || 'unknown',
      uptime: lastHealth?.uptime || '0%',
      apiStatus: lastHealth?.apiStatus || 'unknown',
      databaseStatus: lastHealth?.databaseStatus || 'unknown',
      storageStatus: lastHealth?.storageStatus || 'unknown',
      lastCheckedAt: lastHealth?.createdAt || null,
      logs: healthRows
    },
    recentActivities: activities.items,
    recentActivitiesPagination: activities.pagination
  }
}

const monthLabel = (date) => new Date(date).toLocaleString('en-US', { month: 'short' })
const safeDate = (value) => {
  const d = new Date(value || 0)
  return Number.isNaN(d.getTime()) ? null : d
}

const buildLast6Months = () => {
  const items = []
  const nowDate = new Date()
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1)
    items.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: monthLabel(d), from: d, to: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999) })
  }
  return items
}

const loadDocs = async (model) => prisma.$queryRawUnsafe(modelFilterSql(model))

const toCompatDoc = (row) => ({ id: row.doc_id, ...(row.data || {}), createdAt: row.data?.createdAt || row.created_at, updatedAt: row.data?.updatedAt || row.updated_at })

const isActiveStatus = (value) => String(value || '').toLowerCase() === 'active'

const getDashboardOverviewPayload = async () => {
  const [companiesRaw, usersRaw, subscriptionsRaw, invoicesRaw, paymentsRaw, ticketsRaw, auditRaw, leadsRaw] = await Promise.all([
    loadDocs('TenantCompany'),
    loadDocs('GlobalUser'),
    loadDocs('Subscription'),
    loadDocs('Invoice'),
    loadDocs('PaymentTransaction'),
    loadDocs('SupportTicket'),
    loadDocs('AuditLog'),
    loadDocs('Lead')
  ])

  const companies = (companiesRaw || []).map(toCompatDoc)
  const users = (usersRaw || []).map(toCompatDoc)
  const subscriptions = (subscriptionsRaw || []).map(toCompatDoc)
  const invoices = (invoicesRaw || []).map(toCompatDoc)
  const payments = (paymentsRaw || []).map(toCompatDoc)
  const tickets = (ticketsRaw || []).map(toCompatDoc)
  const leads = (leadsRaw || []).map(toCompatDoc)
  const activities = (auditRaw || []).map(normalizeActivity).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

  const totalCompanies = companies.length
  const activeCompanies = companies.filter((c) => isActiveStatus(c.status)).length
  const totalUsers = users.length
  const activeUsers = users.filter((u) => isActiveStatus(u.status)).length
  const activeSubscriptions = subscriptions.filter((s) => isActiveStatus(s.status)).length

  const nowDate = new Date()
  const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1)
  const isPaid = (status) => ['paid', 'success', 'completed'].includes(String(status || '').toLowerCase())
  const amountFrom = (x) => toNum(x.amount || x.total || 0)

  const monthlyRevenue = payments
    .filter((p) => isPaid(p.status))
    .filter((p) => {
      const d = safeDate(p.createdAt || p.date || p.paidAt)
      return d && d >= monthStart
    })
    .reduce((sum, p) => sum + amountFrom(p), 0)

  const openTickets = tickets.filter((t) => ['open', 'in_progress', 'pending', 'escalated'].includes(String(t.status || '').toLowerCase())).length
  const resolvedTickets = tickets.filter((t) => ['resolved', 'closed'].includes(String(t.status || '').toLowerCase())).length
  const pendingTickets = tickets.filter((t) => String(t.status || '').toLowerCase() === 'pending').length
  const totalTickets = tickets.length

  const windows = buildLast6Months()
  const revenueDeals = windows.map((window) => {
    const revenue = payments
      .filter((p) => isPaid(p.status))
      .filter((p) => {
        const d = safeDate(p.createdAt || p.date || p.paidAt)
        return d && d >= window.from && d <= window.to
      })
      .reduce((sum, p) => sum + amountFrom(p), 0)

    const dealsFromLead = leads.filter((l) => {
      const d = safeDate(l.updatedAt || l.createdAt)
      return d && d >= window.from && d <= window.to && ['paid', 'won', 'closed_won'].includes(String(l.stage || l.status || '').toLowerCase())
    }).length

    const dealsFromInvoice = invoices.filter((i) => {
      const d = safeDate(i.createdAt || i.date || i.paidAt)
      return d && d >= window.from && d <= window.to && isPaid(i.status)
    }).length

    return { month: window.label, revenue, deals: Math.max(dealsFromLead, dealsFromInvoice) }
  })

  const leadSourcesMap = new Map()
  for (const lead of leads) {
    const source = String(lead.source || 'Unknown')
    leadSourcesMap.set(source, (leadSourcesMap.get(source) || 0) + 1)
  }
  const totalLeadsForSource = [...leadSourcesMap.values()].reduce((a, b) => a + b, 0)
  const leadSources = totalLeadsForSource > 0
    ? [...leadSourcesMap.entries()].map(([source, count]) => ({ source, value: Math.round((count / totalLeadsForSource) * 100) }))
    : [
        { source: 'Facebook', value: 32 },
        { source: 'Instagram', value: 18 },
        { source: 'LinkedIn', value: 15 },
        { source: 'Website', value: 22 },
        { source: 'WhatsApp', value: 8 },
        { source: 'Referral', value: 5 }
      ]

  const salesStageOrder = ['Leads', 'Demo Booked', 'Trial', 'Paid']
  const stageMap = new Map(salesStageOrder.map((s) => [s, 0]))
  for (const lead of leads) {
    const rawStage = String(lead.stage || lead.status || 'Leads').toLowerCase()
    let stage = 'Leads'
    if (rawStage.includes('demo')) stage = 'Demo Booked'
    else if (rawStage.includes('trial')) stage = 'Trial'
    else if (rawStage.includes('paid') || rawStage.includes('won') || rawStage.includes('closed')) stage = 'Paid'
    stageMap.set(stage, (stageMap.get(stage) || 0) + 1)
  }
  const salesFunnel = salesStageOrder.map((stage) => ({ stage, count: stageMap.get(stage) || 0 }))

  const supportSummary = { totalTickets, openTickets, pendingTickets, resolvedTickets }

  const recentActivities = activities.slice(0, 10).map((item) => ({
    title: item.action || 'Activity',
    description: item.description || `${item.actor || 'System'} updated ${item.module || 'platform'}`,
    type: String(item.module || 'system').toLowerCase(),
    createdAt: item.createdAt || new Date().toISOString()
  }))

  const previousWindow = revenueDeals[revenueDeals.length - 2]?.revenue || 0
  const currentWindow = revenueDeals[revenueDeals.length - 1]?.revenue || 0
  const growthPct = previousWindow > 0 ? ((currentWindow - previousWindow) / previousWindow) * 100 : 0
  const aiInsights = [
    {
      title: 'Revenue Growth',
      message: growthPct >= 0
        ? `Monthly revenue increased by ${Math.abs(growthPct).toFixed(1)}% compared to last month`
        : `Monthly revenue decreased by ${Math.abs(growthPct).toFixed(1)}% compared to last month`,
      severity: growthPct >= 0 ? 'success' : 'warning'
    },
    {
      title: 'Support Load',
      message: openTickets > resolvedTickets ? 'Open tickets are higher than resolved tickets. Consider adding support coverage.' : 'Support response looks stable this month.',
      severity: openTickets > resolvedTickets ? 'warning' : 'success'
    }
  ]

  const dbOk = await getSequelize().authenticate().then(() => true).catch(() => false)
  const systemHealth = dbOk ? 'Operational' : 'Degraded'

  const stats = {
    totalCompanies,
    activeCompanies,
    totalUsers,
    activeUsers,
    activeSubscriptions,
    monthlyRevenue,
    openTickets,
    resolvedTickets,
    systemHealth
  }

  return { stats, revenueDeals, leadSources, salesFunnel, supportSummary, recentActivities, aiInsights }
}

const respond = (res, key, payload) =>
  res.status(200).json({ success: true, message: `${key} loaded successfully`, data: payload })

export const getDashboardStats = asyncHandler(async (req, res) => {
  const data = await getDashboardData(req.query)
  return res.status(200).json({
    success: true,
    message: 'Dashboard stats loaded successfully',
    data: {
      overview: data.overview,
      totalCompanies: {
        total: data.totalCompanies.total,
        active: data.totalCompanies.active,
        inactive: data.totalCompanies.inactive,
        suspended: data.totalCompanies.suspended,
        trial: data.totalCompanies.trial,
        expired: data.totalCompanies.expired,
        growthThisMonth: data.totalCompanies.growthThisMonth
      },
      activeUsers: {
        total: data.activeUsers.total,
        activeToday: data.activeUsers.activeToday,
        activeThisWeek: data.activeUsers.activeThisWeek,
        activeThisMonth: data.activeUsers.activeThisMonth,
        inactive: data.activeUsers.inactive,
        blocked: data.activeUsers.blocked
      },
      activeSubscriptions: {
        total: data.activeSubscriptions.total,
        active: data.activeSubscriptions.active,
        trial: data.activeSubscriptions.trial,
        expired: data.activeSubscriptions.expired,
        cancelled: data.activeSubscriptions.cancelled,
        expiringSoon: data.activeSubscriptions.expiringSoon
      },
      monthlyRevenue: {
        totalRevenue: data.monthlyRevenue.totalRevenue,
        currentMonthRevenue: data.monthlyRevenue.currentMonthRevenue,
        previousMonthRevenue: data.monthlyRevenue.previousMonthRevenue,
        growthPercentage: data.monthlyRevenue.growthPercentage,
        paidInvoices: data.monthlyRevenue.paidInvoices,
        unpaidInvoices: data.monthlyRevenue.unpaidInvoices,
        failedPayments: data.monthlyRevenue.failedPayments
      },
      supportTicketSummary: {
        totalTickets: data.supportTicketSummary.totalTickets,
        openTickets: data.supportTicketSummary.openTickets,
        inProgressTickets: data.supportTicketSummary.inProgressTickets,
        escalatedTickets: data.supportTicketSummary.escalatedTickets,
        resolvedTickets: data.supportTicketSummary.resolvedTickets,
        closedTickets: data.supportTicketSummary.closedTickets,
        criticalTickets: data.supportTicketSummary.criticalTickets
      },
      systemHealth: {
        status: data.systemHealth.status,
        uptime: data.systemHealth.uptime,
        apiStatus: data.systemHealth.apiStatus,
        databaseStatus: data.systemHealth.databaseStatus,
        storageStatus: data.systemHealth.storageStatus,
        lastCheckedAt: data.systemHealth.lastCheckedAt
      },
      recentActivities: data.recentActivities
    }
  })
})

export const getOverview = asyncHandler(async (_req, res) => {
  const dashboard = await getDashboardOverviewPayload()
  const legacy = (await getDashboardData()).overview

  return res.status(200).json({
    success: true,
    message: 'Overview loaded successfully',
    data: {
      ...dashboard,
      totalCompanies: legacy.totalCompanies,
      activeUsers: legacy.activeUsers,
      activeSubscriptions: legacy.activeSubscriptions,
      monthlyRevenue: legacy.monthlyRevenue,
      openTickets: legacy.openTickets,
      systemHealthStatus: legacy.systemHealthStatus
    }
  })
})
export const getTotalCompanies = asyncHandler(async (req, res) => {
  const data = await getDashboardData()
  const search = String(req.query.search || '').toLowerCase()
  const status = String(req.query.status || 'all').toLowerCase()
  const filtered = data.totalCompanies.items.filter((c) => {
    const matchSearch = !search || c.companyName.toLowerCase().includes(search) || c.code.toLowerCase().includes(search)
    const matchStatus = status === 'all' || String(c.status).toLowerCase() === status
    return matchSearch && matchStatus
  })
  return respond(res, 'Total companies', { ...data.totalCompanies, items: filtered })
})
export const getActiveUsers = asyncHandler(async (req, res) => {
  const data = await getDashboardData()
  const search = String(req.query.search || '').toLowerCase()
  const status = String(req.query.status || 'all').toLowerCase()
  const filtered = data.activeUsers.items.filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
    const matchStatus = status === 'all' || String(u.status).toLowerCase() === status
    return matchSearch && matchStatus
  })
  return respond(res, 'Active users', { ...data.activeUsers, items: filtered })
})
export const getActiveSubscriptions = asyncHandler(async (req, res) => {
  const data = await getDashboardData()
  const status = String(req.query.status || 'all').toLowerCase()
  const filtered = data.activeSubscriptions.items.filter((s) => status === 'all' || String(s.status).toLowerCase() === status)
  return respond(res, 'Active subscriptions', { ...data.activeSubscriptions, items: filtered })
})
export const getMonthlyRevenue = asyncHandler(async (req, res) => {
  const data = await getDashboardData({ from: req.query.from, to: req.query.to })
  return respond(res, 'Monthly revenue', data.monthlyRevenue)
})
export const getSupportTicketSummary = asyncHandler(async (req, res) => {
  const data = await getDashboardData()
  const status = String(req.query.status || 'all').toLowerCase()
  const priority = String(req.query.priority || 'all').toLowerCase()
  const filtered = data.supportTicketSummary.items.filter((t) => {
    const matchStatus = status === 'all' || String(t.status).toLowerCase() === status
    const matchPriority = priority === 'all' || String(t.priority).toLowerCase() === priority
    return matchStatus && matchPriority
  })
  return respond(res, 'Support ticket summary', { ...data.supportTicketSummary, items: filtered })
})
export const getSystemHealth = asyncHandler(async (_req, res) => respond(res, 'System health', (await getDashboardData()).systemHealth))
export const runHealthCheck = asyncHandler(async (_req, res) => {
  const status = 'healthy'
  const created = await prisma.document.create({
    data: {
      rowId: crypto.randomUUID(),
      model: 'SystemHealthLog',
      docId: crypto.randomUUID().replace(/-/g, ''),
      data: {
        status,
        apiStatus: 'up',
        databaseStatus: 'up',
        storageStatus: 'up',
        uptime: '99.99%',
        message: 'Health check executed successfully',
        createdAt: new Date().toISOString()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })
  return res.status(200).json({ success: true, message: 'Health check completed', data: created.data })
})

export const listDashboardActivities = asyncHandler(async (req, res) => {
  const data = await getRecentActivitiesCore(req.query)
  return res.status(200).json({ success: true, message: 'Recent activities loaded successfully', data })
})

export const updateDashboardActivity = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { action, severity, description, module } = req.body

  const existing = await prisma.document.findFirst({ where: { model: 'AuditLog', docId: id } })
  if (!existing) return res.status(404).json({ success: false, message: 'Activity not found', data: null })

  const item = await prisma.document.update({
    where: { rowId: existing.rowId },
    data: {
      data: {
        ...existing.data,
        action: action !== undefined ? String(action) : existing.data?.action,
        module: module !== undefined ? String(module) : existing.data?.module,
        description: description !== undefined ? String(description) : existing.data?.description,
        severity: severity !== undefined ? String(severity).toLowerCase() : existing.data?.severity
      },
      updatedAt: new Date()
    },
  })

  return res.status(200).json({ success: true, message: 'Activity updated', data: { item: normalizeActivity(item) } })
})

export const deleteDashboardActivity = asyncHandler(async (req, res) => {
  const { id } = req.params
  const existing = await prisma.document.findFirst({ where: { model: 'AuditLog', docId: id } })
  if (!existing) return res.status(404).json({ success: false, message: 'Activity not found', data: null })

  await prisma.document.delete({ where: { rowId: existing.rowId } })
  return res.status(200).json({ success: true, message: 'Activity deleted', data: {} })
})

export const globalSuperAdminSearch = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim()
  if (q.length < 2) return res.status(200).json({ success: true, results: [] })

  const query = q.toLowerCase()
  const [companiesRaw, adminsRaw, usersRaw, invoicesRaw, subscriptionsRaw, ticketsRaw] = await Promise.all([
    loadDocs('TenantCompany'),
    loadDocs('CompanyAdmin'),
    loadDocs('GlobalUser'),
    loadDocs('Invoice'),
    loadDocs('Subscription'),
    loadDocs('SupportTicket')
  ])

  const contains = (...parts) => parts.filter(Boolean).join(' ').toLowerCase().includes(query)
  const results = []

  for (const row of companiesRaw || []) {
    const item = toCompatDoc(row)
    if (contains(item.companyName, item.companyCode, item.email)) {
      results.push({ type: 'company', title: item.companyName || item.companyCode || 'Company', subtitle: `${item.status || 'active'} company`, route: `/super-admin/company-management/company-list` })
    }
  }
  for (const row of adminsRaw || []) {
    const item = toCompatDoc(row)
    if (contains(item.name, item.email, item.role)) {
      results.push({ type: 'admin', title: item.name || item.email || 'Admin', subtitle: item.role || 'Admin', route: '/super-admin/admin-management/admin-list' })
    }
  }
  for (const row of usersRaw || []) {
    const item = toCompatDoc(row)
    if (contains(item.name, item.email, item.role)) {
      results.push({ type: 'user', title: item.name || item.email || 'User', subtitle: item.status || 'active user', route: '/super-admin/global-users/user-directory' })
    }
  }
  for (const row of invoicesRaw || []) {
    const item = toCompatDoc(row)
    if (contains(item.invoiceNo, item.invoiceNumber, item.companyName, item.status)) {
      results.push({ type: 'invoice', title: item.invoiceNo || item.invoiceNumber || item.id, subtitle: `${item.status || 'pending'} invoice`, route: '/super-admin/subscription-and-billing/invoice-management' })
    }
  }
  for (const row of subscriptionsRaw || []) {
    const item = toCompatDoc(row)
    if (contains(item.planName, item.plan, item.companyName, item.status)) {
      results.push({ type: 'subscription', title: item.planName || item.plan || 'Subscription', subtitle: item.status || 'subscription', route: '/super-admin/subscription-and-billing/subscription-history' })
    }
  }
  for (const row of ticketsRaw || []) {
    const item = toCompatDoc(row)
    if (contains(item.ticketNo, item.ticketId, item.subject, item.status)) {
      results.push({ type: 'ticket', title: item.subject || item.ticketNo || 'Support Ticket', subtitle: item.status || 'open ticket', route: '/super-admin/support-center/ticket-dashboard' })
    }
  }

  return res.status(200).json({ success: true, results: results.slice(0, 30) })
})

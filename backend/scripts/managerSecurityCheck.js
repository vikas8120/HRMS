import fs from 'fs'
import path from 'path'

const API_BASE = process.env.API_BASE || 'http://localhost:5001/api'
const routesFile = path.resolve(process.cwd(), 'routes', 'managerRoutes.js')

const managerEndpoints = [
  ['GET', '/manager/dashboard'],
  ['GET', '/manager/dashboard/recent-activities'],
  ['GET', '/manager/team'],
  ['GET', '/manager/team/sample-id'],
  ['GET', '/manager/team/sample-id/details'],
  ['GET', '/manager/leaves'],
  ['GET', '/manager/leaves/pending'],
  ['GET', '/manager/leaves/sample-id'],
  ['PUT', '/manager/leaves/sample-id/approve'],
  ['PUT', '/manager/leaves/sample-id/reject'],
  ['GET', '/manager/attendance'],
  ['GET', '/manager/attendance/today'],
  ['GET', '/manager/attendance/reports'],
  ['GET', '/manager/attendance/alerts'],
  ['GET', '/manager/attendance/sample-id'],
  ['POST', '/manager/tasks'],
  ['GET', '/manager/tasks'],
  ['GET', '/manager/tasks/sample-id'],
  ['PUT', '/manager/tasks/sample-id'],
  ['DELETE', '/manager/tasks/sample-id'],
  ['POST', '/manager/tasks/sample-id/comments'],
  ['PUT', '/manager/tasks/sample-id/status'],
  ['PUT', '/manager/tasks/sample-id/reassign'],
  ['POST', '/manager/performance'],
  ['GET', '/manager/performance'],
  ['GET', '/manager/performance/dashboard'],
  ['GET', '/manager/performance/sample-id'],
  ['PUT', '/manager/performance/sample-id'],
  ['DELETE', '/manager/performance/sample-id'],
  ['GET', '/manager/reports/attendance'],
  ['GET', '/manager/reports/leaves'],
  ['GET', '/manager/reports/tasks'],
  ['GET', '/manager/reports/performance'],
  ['POST', '/manager/reports/custom'],
  ['GET', '/manager/reports/export/pdf'],
  ['GET', '/manager/reports/export/excel'],
  ['POST', '/manager/requests'],
  ['GET', '/manager/requests'],
  ['GET', '/manager/requests/sample-id'],
  ['PUT', '/manager/requests/sample-id'],
  ['DELETE', '/manager/requests/sample-id'],
  ['POST', '/manager/requests/sample-id/comments'],
  ['POST', '/manager/requests/sample-id/upload'],
  ['PUT', '/manager/requests/sample-id/close'],
  ['GET', '/manager/notifications'],
  ['PUT', '/manager/notifications/mark-all-read'],
  ['PUT', '/manager/notifications/sample-id/read'],
  ['DELETE', '/manager/notifications/sample-id'],
  ['POST', '/manager/meetings'],
  ['GET', '/manager/meetings'],
  ['GET', '/manager/meetings/sample-id'],
  ['PUT', '/manager/meetings/sample-id'],
  ['DELETE', '/manager/meetings/sample-id'],
  ['POST', '/manager/meetings/sample-id/notes'],
  ['GET', '/manager/payroll/team-summary'],
  ['GET', '/manager/payroll/status'],
  ['POST', '/manager/payroll/bonus-recommendation'],
  ['GET', '/manager/documents'],
  ['POST', '/manager/documents/upload'],
  ['POST', '/manager/documents/request'],
  ['GET', '/manager/documents/requests'],
  ['GET', '/manager/documents/sample-id'],
  ['DELETE', '/manager/documents/sample-id'],
  ['POST', '/manager/messages'],
  ['GET', '/manager/messages'],
  ['POST', '/manager/messages/sample-id/reply'],
  ['GET', '/manager/messages/sample-id'],
  ['DELETE', '/manager/messages/sample-id'],
  ['POST', '/manager/announcements'],
  ['GET', '/manager/announcements'],
  ['PUT', '/manager/announcements/sample-id'],
  ['DELETE', '/manager/announcements/sample-id'],
  ['GET', '/manager/profile'],
  ['PUT', '/manager/profile'],
  ['PUT', '/manager/profile/change-password'],
  ['GET', '/manager/profile/login-activity'],
  ['POST', '/manager/profile/logout-other-devices'],
  ['POST', '/manager/support/tickets'],
  ['GET', '/manager/support/tickets'],
  ['GET', '/manager/support/tickets/sample-id'],
  ['POST', '/manager/support/tickets/sample-id/reply'],
  ['PUT', '/manager/support/tickets/sample-id/close'],
  ['GET', '/manager/support/faqs']
]

const isBackendReachable = async () => {
  try {
    const res = await fetch(`${API_BASE}/health`)
    return res.ok
  } catch {
    return false
  }
}

const request = async (method, url, token = '') => {
  const headers = {}
  if (token) headers.authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${url}`, { method, headers })
  let json = null
  try { json = await res.json() } catch {}
  return { status: res.status, ok: res.ok, json }
}

const run = async () => {
  const raw = fs.readFileSync(routesFile, 'utf8')
  const mustHave = "router.use(protectCompanyUser, requireRole('manager'), requireCompanyScope)"
  if (!raw.includes(mustHave)) {
    throw new Error(`Route guard missing in managerRoutes: ${mustHave}`)
  }

  const forbiddenRouteFragments = [
    '/payroll/:id',
    '/employees/:id',
    '/hr',
    '/managers',
    '/companies'
  ]
  const foundForbidden = forbiddenRouteFragments.filter((frag) => raw.includes(frag))
  if (foundForbidden.length) {
    throw new Error(`Forbidden manager route fragments found: ${foundForbidden.join(', ')}`)
  }

  const reachable = await isBackendReachable()
  if (!reachable) {
    console.log('Static guard validation passed.')
    console.log(`Backend not reachable at ${API_BASE}; skipped runtime API checks.`)
    return
  }

  const failures = []
  for (const [method, url] of managerEndpoints) {
    const res = await request(method, url, '')
    if (res.status !== 401) {
      failures.push(`${method} ${url} expected 401 without token, got ${res.status}`)
    }
  }

  const invalidToken = 'invalid.token.here'
  for (const [method, url] of managerEndpoints) {
    const res = await request(method, url, invalidToken)
    if (res.status !== 401) {
      failures.push(`${method} ${url} expected 401 with invalid token, got ${res.status}`)
    }
  }

  if (failures.length) {
    throw new Error(`Manager API security check failed:\n${failures.join('\n')}`)
  }

  console.log(`Manager security check passed for ${managerEndpoints.length} endpoints.`)
}

run().catch((err) => {
  console.error(err.message)
  process.exit(1)
})

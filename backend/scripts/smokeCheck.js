const base = process.env.API_BASE || 'http://localhost:5001/api'

const request = async (method, path, token, body) => {
  const res = await fetch(base + path, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  })
  let json
  try { json = await res.json() } catch { json = null }
  return { ok: res.ok, status: res.status, json }
}

const run = async () => {
  const loginRes = await fetch(base + '/super-admin/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@hrms.com', password: 'Admin@123' })
  })

  const loginBody = await loginRes.json()
  if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginBody)}`)
  const token = loginBody.token

  const now = Date.now()
  const results = []
  const record = async (name, method, path, body) => {
    const r = await request(method, path, token, body)
    results.push({ name, status: r.status, ok: r.ok })
    return r
  }

  const c = await record('company:create', 'POST', '/super-admin/companies', {
    companyName: `Smoke ${now}`,
    companyCode: `SM${now}`,
    industry: 'IT',
    email: `smoke${now}@x.com`,
    phone: '9999999999',
    plan: 'Starter'
  })
  const companyId = c.json?.item?.id || c.json?.item?._id

  const p = await record('plan:create', 'POST', '/super-admin/subscription-plans', {
    name: `SmokePlan-${now}`,
    type: 'standard',
    monthlyPrice: 10,
    yearlyPrice: 100,
    userLimit: 10,
    storageLimit: 5
  })
  const planId = p.json?.item?._id || p.json?.item?.id

  await record('subscription:create', 'POST', '/super-admin/subscriptions', {
    company: companyId,
    plan: planId,
    billingCycle: 'monthly',
    status: 'active'
  })

  await record('global-users:create', 'POST', '/super-admin/global-users', {
    name: 'Smoke User',
    email: `user${now}@x.com`,
    company: companyId,
    status: 'active'
  })

  await record('support:categories', 'GET', '/super-admin/support/categories')
  await record('integrations:list', 'GET', '/super-admin/integrations')
  await record('audit:list', 'GET', '/super-admin/audit-security/logs')
  await record('reports:list', 'GET', '/super-admin/reports')
  await record('ai:settings', 'GET', '/super-admin/ai/settings')
  await record('backup:list', 'GET', '/super-admin/backup/logs')

  const failed = results.filter((r) => !r.ok)
  console.table(results)

  if (failed.length) {
    process.exitCode = 1
    throw new Error(`Smoke failed for: ${failed.map((f) => f.name).join(', ')}`)
  }

  console.log('Smoke check passed for major module routes.')
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})

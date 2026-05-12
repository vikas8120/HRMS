import dotenv from 'dotenv'
import connectDB from '../config/db.js'
import { getSequelize } from '../config/pgCompat.js'
import TenantCompany from '../models/TenantCompany.js'
import GlobalUser from '../models/GlobalUser.js'
import Subscription from '../models/Subscription.js'
import Invoice from '../models/Invoice.js'
import PaymentTransaction from '../models/PaymentTransaction.js'
import SupportTicket from '../models/SupportTicket.js'
import AuditLog from '../models/AuditLog.js'
import Lead from '../models/Lead.js'

dotenv.config()

const monthsBackDate = (monthsBack, day = 10) => {
  const d = new Date()
  d.setDate(day)
  d.setMonth(d.getMonth() - monthsBack)
  return d.toISOString()
}

const upsertBy = async (Model, query, payload) => {
  const found = await Model.findOne(query)
  if (found) return found
  return Model.create(payload)
}

const run = async () => {
  try {
    await connectDB()

    const companies = [
      { companyName: 'ABC Pvt Ltd', companyCode: 'ABC', industry: 'Technology', email: 'ops@abcpvt.com', phone: '9000000001', plan: 'Enterprise', status: 'active' },
      { companyName: 'Nimbus Labs', companyCode: 'NMB', industry: 'SaaS', email: 'hello@nimbus.io', phone: '9000000002', plan: 'Growth', status: 'active' },
      { companyName: 'Vertex Retail', companyCode: 'VTX', industry: 'Retail', email: 'admin@vertexretail.com', phone: '9000000003', plan: 'Starter', status: 'trial' }
    ]

    const companyDocs = []
    for (const item of companies) {
      // eslint-disable-next-line no-await-in-loop
      const doc = await upsertBy(TenantCompany, { companyCode: item.companyCode }, item)
      companyDocs.push(doc)
    }

    const users = [
      { name: 'Ramesh Patel', email: 'ramesh@abcpvt.com', role: 'HR_ADMIN', company: companyDocs[0]._id, companyName: companyDocs[0].companyName, status: 'active' },
      { name: 'Divya Nair', email: 'divya@nimbus.io', role: 'EMPLOYEE', company: companyDocs[1]._id, companyName: companyDocs[1].companyName, status: 'active' },
      { name: 'Priya Singh', email: 'priya@vertexretail.com', role: 'EMPLOYEE', company: companyDocs[2]._id, companyName: companyDocs[2].companyName, status: 'inactive' }
    ]
    for (const item of users) {
      // eslint-disable-next-line no-await-in-loop
      await upsertBy(GlobalUser, { email: item.email }, { ...item, lastLogin: new Date().toISOString() })
    }

    const subscriptions = [
      { company: companyDocs[0]._id, companyName: companyDocs[0].companyName, planName: 'Enterprise', status: 'active', startDate: monthsBackDate(4), endDate: monthsBackDate(-8) },
      { company: companyDocs[1]._id, companyName: companyDocs[1].companyName, planName: 'Growth', status: 'active', startDate: monthsBackDate(3), endDate: monthsBackDate(-6) },
      { company: companyDocs[2]._id, companyName: companyDocs[2].companyName, planName: 'Starter', status: 'trial', startDate: monthsBackDate(1), endDate: monthsBackDate(1) }
    ]
    for (const item of subscriptions) {
      // eslint-disable-next-line no-await-in-loop
      await upsertBy(Subscription, { companyName: item.companyName, planName: item.planName }, item)
    }

    const invoices = []
    for (let i = 0; i < 6; i += 1) {
      invoices.push({
        invoiceNo: `INV-${1200 + i}`,
        companyName: companyDocs[i % companyDocs.length].companyName,
        status: 'paid',
        amount: 80000 + i * 12000,
        createdAt: monthsBackDate(5 - i, 12)
      })
    }
    for (const item of invoices) {
      // eslint-disable-next-line no-await-in-loop
      await upsertBy(Invoice, { invoiceNo: item.invoiceNo }, item)
      // eslint-disable-next-line no-await-in-loop
      await upsertBy(PaymentTransaction, { referenceNo: `PAY-${item.invoiceNo}` }, {
        referenceNo: `PAY-${item.invoiceNo}`,
        companyName: item.companyName,
        amount: item.amount,
        status: 'paid',
        method: 'bank_transfer',
        createdAt: item.createdAt
      })
    }

    const leads = [
      { name: 'HCL Tech Package', source: 'Facebook', stage: 'Leads', dealValue: 120000 },
      { name: 'Wipro Cloud Suite', source: 'LinkedIn', stage: 'Demo Booked', dealValue: 98000 },
      { name: 'Bajaj Finserv', source: 'Website', stage: 'Trial', dealValue: 175000 },
      { name: 'Mindtree Platform', source: 'Instagram', stage: 'Paid', dealValue: 210000 },
      { name: 'Infosys Suite', source: 'Referral', stage: 'Leads', dealValue: 65000 },
      { name: 'Zensar HR Core', source: 'WhatsApp', stage: 'Demo Booked', dealValue: 48000 }
    ]
    for (const item of leads) {
      // eslint-disable-next-line no-await-in-loop
      await upsertBy(Lead, { name: item.name }, item)
    }

    const tickets = [
      { ticketNo: 'TKT-1001', subject: 'Payroll sync issue', companyName: companyDocs[0].companyName, status: 'open', priority: 'high' },
      { ticketNo: 'TKT-1002', subject: 'User invite failure', companyName: companyDocs[1].companyName, status: 'pending', priority: 'medium' },
      { ticketNo: 'TKT-1003', subject: 'Shift policy bug', companyName: companyDocs[2].companyName, status: 'resolved', priority: 'low' }
    ]
    for (const item of tickets) {
      // eslint-disable-next-line no-await-in-loop
      await upsertBy(SupportTicket, { ticketNo: item.ticketNo }, item)
    }

    const logs = [
      { actorName: 'System', module: 'company', action: 'New company registered', description: 'ABC Pvt Ltd joined platform', severity: 'success' },
      { actorName: 'Rahul M.', module: 'sales', action: 'Deal moved to proposal', description: 'Wipro Cloud Suite moved to proposal', severity: 'info' },
      { actorName: 'AI Engine', module: 'ai', action: 'High score lead', description: 'AI scored HCL Tech Package as hot', severity: 'warning' }
    ]
    for (const item of logs) {
      // eslint-disable-next-line no-await-in-loop
      await upsertBy(AuditLog, { action: item.action, description: item.description }, { ...item, dateTime: new Date().toISOString(), createdAt: new Date().toISOString(), actor: item.actorName })
    }

    console.log('Super Admin dashboard seed completed.')
    await getSequelize().close()
    process.exit(0)
  } catch (error) {
    console.error(`Dashboard seed failed: ${error.message}`)
    try {
      await getSequelize().close()
    } catch (_e) {}
    process.exit(1)
  }
}

run()

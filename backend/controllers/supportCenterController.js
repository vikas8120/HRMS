import asyncHandler from '../utils/asyncHandler.js'
import crypto from 'crypto'
import SupportTicket from '../models/SupportTicket.js'
import TicketMessage from '../models/TicketMessage.js'
import TicketCategory from '../models/TicketCategory.js'
import SupportAgent from '../models/SupportAgent.js'
import AuditLog from '../models/AuditLog.js'
const respond = (res, status, message, payload = {}) => res.status(status).json({ success: status < 400, message, data: payload, ...payload })

const generateTicketNo = async () => {
  while (true) {
    const ticketNo = `TKT-${crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`
    const exists = await SupportTicket.findOne({ ticketNo })
    if (!exists) return ticketNo
  }
}

const writeAudit = async (req, action, description, metadata = {}) => {
  await AuditLog.create({
    actorType: 'super_admin',
    actorName: req.user?.name || req.user?.email || 'Super Admin',
    module: 'support',
    action,
    description,
    ipAddress: req.ip || '',
    device: req.get('user-agent') || '',
    metadata,
    severity: 'info',
    createdAt: new Date().toISOString()
  })
}

export const listTickets = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1)
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 200)
  const search = String(req.query.search || '')
  const status = String(req.query.status || 'all')
  const query = {}
  if (search) query.$or = [{ ticketNo: { $regex: search, $options: 'i' } }, { subject: { $regex: search, $options: 'i' } }]
  if (status !== 'all') query.status = status
  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    SupportTicket.find(query).populate('company', 'companyName').populate('raisedBy', 'name email').populate('assignedAgent', 'name email').populate('category', 'name slaHours').sort({ createdAt: -1 }).skip(skip).limit(limit),
    SupportTicket.countDocuments(query)
  ])
  respond(res, 200, 'Support tickets fetched successfully', { data: items, items, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } })
})

export const createTicket = asyncHandler(async (req, res) => {
  const { subject } = req.body
  if (!subject) return respond(res, 400, 'subject is required')
  const ticketNo = await generateTicketNo()
  const ticket = await SupportTicket.create({ ...req.body, ticketNo })
  await writeAudit(req, 'CREATE_TICKET', `Support ticket ${ticketNo} created`, { ticketId: ticket._id, ticketNo })
  respond(res, 201, 'Support ticket created successfully', { data: ticket, item: ticket })
})

export const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!ticket) return respond(res, 404, 'Ticket not found')
  respond(res, 200, 'Support ticket updated successfully', { data: ticket, item: ticket })
})

export const assignTicket = asyncHandler(async (req, res) => {
  const { assignedAgent } = req.body
  const ticket = await SupportTicket.findById(req.params.id)
  if (!ticket) return respond(res, 404, 'Ticket not found')
  ticket.assignedAgent = assignedAgent || null
  await ticket.save()
  respond(res, 200, 'Ticket assignment updated successfully', { data: ticket, item: ticket })
})

export const setTicketPriority = asyncHandler(async (req, res) => {
  const { priority } = req.body
  const valid = ['low', 'medium', 'high', 'critical']
  if (!valid.includes(priority)) return respond(res, 400, 'Invalid priority')
  const ticket = await SupportTicket.findById(req.params.id)
  if (!ticket) return respond(res, 404, 'Ticket not found')
  ticket.priority = priority
  await ticket.save()
  respond(res, 200, 'Ticket priority updated successfully', { data: ticket, item: ticket })
})

export const setTicketSla = asyncHandler(async (req, res) => {
  const { slaDueAt } = req.body
  const ticket = await SupportTicket.findById(req.params.id)
  if (!ticket) return respond(res, 404, 'Ticket not found')
  ticket.slaDueAt = slaDueAt ? new Date(slaDueAt) : null
  await ticket.save()
  respond(res, 200, 'Ticket SLA updated successfully', { data: ticket, item: ticket })
})

export const addTicketMessage = asyncHandler(async (req, res) => {
  const { senderType, senderName, message, attachmentUrl = '' } = req.body
  if (!senderType || !message) return respond(res, 400, 'senderType and message required')
  const exists = await SupportTicket.findById(req.params.id)
  if (!exists) return respond(res, 404, 'Ticket not found')
  const item = await TicketMessage.create({ ticket: req.params.id, senderType, senderName, message, attachmentUrl })
  respond(res, 201, 'Ticket message added successfully', { data: item, item })
})

export const getTicketMessages = asyncHandler(async (req, res) => {
  const items = await TicketMessage.find({ ticket: req.params.id }).sort({ createdAt: 1 })
  respond(res, 200, 'Ticket messages fetched successfully', { data: items, items })
})

export const addInternalNote = asyncHandler(async (req, res) => {
  const { note, by = 'Super Admin' } = req.body
  if (!note) return respond(res, 400, 'note is required')
  const ticket = await SupportTicket.findById(req.params.id)
  if (!ticket) return respond(res, 404, 'Ticket not found')
  ticket.internalNotes.push({ note, by })
  await ticket.save()
  respond(res, 200, 'Internal note added successfully', { data: ticket, item: ticket })
})

export const resolveTicket = asyncHandler(async (req, res) => {
  const { resolution } = req.body
  const ticket = await SupportTicket.findById(req.params.id)
  if (!ticket) return respond(res, 404, 'Ticket not found')
  ticket.status = 'closed'
  ticket.resolution = resolution || ticket.resolution
  await ticket.save()
  respond(res, 200, 'Ticket resolved successfully', { data: ticket, item: ticket })
})

export const listCategories = asyncHandler(async (_req, res) => {
  let items = await TicketCategory.find().sort({ name: 1 })
  if (items.length === 0) {
    items = await TicketCategory.insertMany([
      { name: 'Payroll', description: 'Payroll issues', slaHours: 24 },
      { name: 'Attendance', description: 'Attendance issues', slaHours: 12 },
      { name: 'Access', description: 'Login and access', slaHours: 6 }
    ])
  }
  respond(res, 200, 'Support categories fetched successfully', { data: items, items })
})

export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body
  if (!name) return respond(res, 400, 'name is required')
  const item = await TicketCategory.create(req.body)
  respond(res, 201, 'Support category created successfully', { data: item, item })
})

export const listAgents = asyncHandler(async (_req, res) => {
  let items = await SupportAgent.find().sort({ name: 1 })
  if (items.length === 0) {
    items = await SupportAgent.insertMany([
      { name: 'Aman Support', email: 'aman.support@hrms.com', level: 'L1' },
      { name: 'Riya Escalation', email: 'riya.escalation@hrms.com', level: 'L2' }
    ])
  }
  respond(res, 200, 'Support agents fetched successfully', { data: items, items })
})

export const createAgent = asyncHandler(async (req, res) => {
  const { name, email } = req.body
  if (!name || !email) return respond(res, 400, 'name and email required')
  const item = await SupportAgent.create(req.body)
  respond(res, 201, 'Support agent created successfully', { data: item, item })
})


import asyncHandler from '../utils/asyncHandler.js'
import SupportTicket from '../models/SupportTicket.js'
import TicketMessage from '../models/TicketMessage.js'
import TicketCategory from '../models/TicketCategory.js'
import User from '../models/User.js'

const validPriority = new Set(['low', 'medium', 'high', 'critical'])
const validStatus = new Set(['open', 'pending', 'resolved', 'closed'])

const buildTicketNo = () => `EMP-${Date.now().toString(36).toUpperCase()}`

const normalizeStatus = (value) => {
  const v = String(value || '').trim().toLowerCase()
  if (v === 'in-progress') return 'pending'
  if (v === 'resolved') return 'resolved'
  return v
}

const serializeTicket = (item) => ({
  id: item._id,
  ticketNo: item.ticketNo || '',
  subject: item.subject || '',
  description: item.description || '',
  category: item.category || null,
  priority: item.priority || 'medium',
  status: normalizeStatus(item.status || 'open'),
  screenshotUrl: item.screenshotUrl || '',
  attachmentUrl: item.attachmentUrl || '',
  raisedBy: item.raisedBy || null,
  assignedAgent: item.assignedAgent || null,
  resolution: item.resolution || '',
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null
})

const serializeMessage = (item) => ({
  id: item._id,
  ticketId: item.ticket || null,
  senderType: item.senderType || '',
  senderName: item.senderName || '',
  message: item.message || '',
  attachmentUrl: item.attachmentUrl || '',
  createdAt: item.createdAt || null
})

const getEmployeeScope = async (req) => {
  const companyId = String(req.user.companyId)
  const userId = String(req.user.id)
  const employee = await User.findOne({ _id: userId, companyId, role: 'employee', status: 'active' }).select('_id name email')
  if (!employee) return null
  return {
    companyId,
    userId,
    name: employee.name || 'Employee'
  }
}

const scopedTicketQuery = (scope) => ({ company: scope.companyId, raisedBy: scope.userId })

export const getEmployeeTickets = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: [] })

  const view = String(req.query.view || 'all').trim().toLowerCase()
  const category = String(req.query.category || 'all').trim()

  const query = scopedTicketQuery(scope)
  if (view !== 'all') {
    const mapped = normalizeStatus(view)
    if (validStatus.has(mapped)) query.status = mapped
  }
  if (category !== 'all') query.category = category

  const rows = await SupportTicket.find(query).sort({ createdAt: -1 })

  return res.status(200).json({
    success: true,
    message: 'Tickets fetched successfully',
    data: rows.map(serializeTicket)
  })
})

export const createEmployeeTicket = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const subject = String(req.body?.subject || '').trim()
  const description = String(req.body?.description || '').trim()
  const category = String(req.body?.category || '').trim()
  const priority = String(req.body?.priority || 'medium').trim().toLowerCase()

  if (!subject) return res.status(400).json({ success: false, message: 'subject is required', data: null })
  if (!description) return res.status(400).json({ success: false, message: 'description is required', data: null })
  if (!category) return res.status(400).json({ success: false, message: 'category is required', data: null })
  if (!validPriority.has(priority)) return res.status(400).json({ success: false, message: 'Invalid priority', data: null })

  const attachmentUrl = req.file ? `/uploads/documents/${req.file.filename}` : String(req.body?.attachmentUrl || '').trim()

  const ticket = await SupportTicket.create({
    ticketNo: buildTicketNo(),
    company: scope.companyId,
    raisedBy: scope.userId,
    subject,
    description,
    category,
    priority,
    status: 'open',
    attachmentUrl,
    screenshotUrl: attachmentUrl,
    resolution: ''
  })

  return res.status(201).json({
    success: true,
    message: 'Ticket created successfully',
    data: serializeTicket(ticket)
  })
})

export const getEmployeeTicketById = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const ticket = await SupportTicket.findOne({ _id: req.params.id, ...scopedTicketQuery(scope) })
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found', data: null })

  const messages = await TicketMessage.find({ ticket: String(ticket._id) }).sort({ createdAt: 1 })

  return res.status(200).json({
    success: true,
    message: 'Ticket details fetched successfully',
    data: { ...serializeTicket(ticket), messages: messages.map(serializeMessage) }
  })
})

export const addEmployeeTicketMessage = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const ticket = await SupportTicket.findOne({ _id: req.params.id, ...scopedTicketQuery(scope) })
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found', data: null })
  if (normalizeStatus(ticket.status) === 'closed') return res.status(400).json({ success: false, message: 'Cannot reply to closed ticket', data: null })

  const message = String(req.body?.message || '').trim()
  if (!message) return res.status(400).json({ success: false, message: 'message is required', data: null })
  const attachmentUrl = req.file ? `/uploads/documents/${req.file.filename}` : String(req.body?.attachmentUrl || '').trim()

  const item = await TicketMessage.create({
    ticket: String(ticket._id),
    senderType: 'employee',
    senderName: scope.name,
    message,
    attachmentUrl
  })

  if (normalizeStatus(ticket.status) === 'resolved') ticket.status = 'pending'
  if (normalizeStatus(ticket.status) === 'open') ticket.status = 'pending'
  await ticket.save()

  return res.status(201).json({
    success: true,
    message: 'Ticket message added successfully',
    data: serializeMessage(item)
  })
})

export const closeEmployeeTicket = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const ticket = await SupportTicket.findOne({ _id: req.params.id, ...scopedTicketQuery(scope) })
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found', data: null })

  ticket.status = 'closed'
  await ticket.save()

  return res.status(200).json({
    success: true,
    message: 'Ticket closed successfully',
    data: serializeTicket(ticket)
  })
})

export const reopenEmployeeTicket = asyncHandler(async (req, res) => {
  const scope = await getEmployeeScope(req)
  if (!scope) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const ticket = await SupportTicket.findOne({ _id: req.params.id, ...scopedTicketQuery(scope) })
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found', data: null })
  if (normalizeStatus(ticket.status) !== 'closed') {
    return res.status(400).json({ success: false, message: 'Only closed ticket can be reopened', data: null })
  }

  ticket.status = 'open'
  await ticket.save()

  return res.status(200).json({
    success: true,
    message: 'Ticket reopened successfully',
    data: serializeTicket(ticket)
  })
})

export const getEmployeeTicketCategories = asyncHandler(async (_req, res) => {
  const rows = await TicketCategory.find().sort({ name: 1 })
  return res.status(200).json({
    success: true,
    message: 'Ticket categories fetched successfully',
    data: rows.map((x) => ({ id: x._id, name: x.name || '', description: x.description || '', slaHours: x.slaHours || 24 }))
  })
})

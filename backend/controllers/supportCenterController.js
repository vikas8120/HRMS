import asyncHandler from '../utils/asyncHandler.js'
import SupportTicket from '../models/SupportTicket.js'
import TicketMessage from '../models/TicketMessage.js'
import TicketCategory from '../models/TicketCategory.js'
import SupportAgent from '../models/SupportAgent.js'

export const listTickets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', status = 'all' } = req.query
  const query = {}
  if (search) query.$or = [{ ticketNo: { $regex: search, $options: 'i' } }, { subject: { $regex: search, $options: 'i' } }]
  if (status !== 'all') query.status = status
  const skip = (Number(page) - 1) * Number(limit)
  const [items, total] = await Promise.all([
    SupportTicket.find(query).populate('company', 'companyName').populate('raisedBy', 'name email').populate('assignedAgent', 'name email').populate('category', 'name slaHours').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    SupportTicket.countDocuments(query)
  ])
  res.status(200).json({ items, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } })
})

export const createTicket = asyncHandler(async (req, res) => {
  const { subject } = req.body
  if (!subject) return res.status(400).json({ message: 'subject is required' })
  const count = await SupportTicket.countDocuments()
  const ticket = await SupportTicket.create({ ...req.body, ticketNo: `TKT-${String(count + 1).padStart(5, '0')}` })
  res.status(201).json({ item: ticket })
})

export const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
  res.status(200).json({ item: ticket })
})

export const assignTicket = asyncHandler(async (req, res) => {
  const { assignedAgent } = req.body
  const ticket = await SupportTicket.findById(req.params.id)
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
  ticket.assignedAgent = assignedAgent || null
  await ticket.save()
  res.status(200).json({ item: ticket })
})

export const setTicketPriority = asyncHandler(async (req, res) => {
  const { priority } = req.body
  const valid = ['low', 'medium', 'high', 'critical']
  if (!valid.includes(priority)) return res.status(400).json({ message: 'Invalid priority' })
  const ticket = await SupportTicket.findById(req.params.id)
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
  ticket.priority = priority
  await ticket.save()
  res.status(200).json({ item: ticket })
})

export const setTicketSla = asyncHandler(async (req, res) => {
  const { slaDueAt } = req.body
  const ticket = await SupportTicket.findById(req.params.id)
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
  ticket.slaDueAt = slaDueAt ? new Date(slaDueAt) : null
  await ticket.save()
  res.status(200).json({ item: ticket })
})

export const addTicketMessage = asyncHandler(async (req, res) => {
  const { senderType, senderName, message, attachmentUrl = '' } = req.body
  if (!senderType || !message) return res.status(400).json({ message: 'senderType and message required' })
  const exists = await SupportTicket.findById(req.params.id)
  if (!exists) return res.status(404).json({ message: 'Ticket not found' })
  const item = await TicketMessage.create({ ticket: req.params.id, senderType, senderName, message, attachmentUrl })
  res.status(201).json({ item })
})

export const getTicketMessages = asyncHandler(async (req, res) => {
  const items = await TicketMessage.find({ ticket: req.params.id }).sort({ createdAt: 1 })
  res.status(200).json({ items })
})

export const addInternalNote = asyncHandler(async (req, res) => {
  const { note, by = 'Super Admin' } = req.body
  if (!note) return res.status(400).json({ message: 'note is required' })
  const ticket = await SupportTicket.findById(req.params.id)
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
  ticket.internalNotes.push({ note, by })
  await ticket.save()
  res.status(200).json({ item: ticket })
})

export const resolveTicket = asyncHandler(async (req, res) => {
  const { resolution } = req.body
  const ticket = await SupportTicket.findById(req.params.id)
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
  ticket.status = 'closed'
  ticket.resolution = resolution || ticket.resolution
  await ticket.save()
  res.status(200).json({ item: ticket })
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
  res.status(200).json({ items })
})

export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ message: 'name is required' })
  const item = await TicketCategory.create(req.body)
  res.status(201).json({ item })
})

export const listAgents = asyncHandler(async (_req, res) => {
  let items = await SupportAgent.find().sort({ name: 1 })
  if (items.length === 0) {
    items = await SupportAgent.insertMany([
      { name: 'Aman Support', email: 'aman.support@hrms.com', level: 'L1' },
      { name: 'Riya Escalation', email: 'riya.escalation@hrms.com', level: 'L2' }
    ])
  }
  res.status(200).json({ items })
})

export const createAgent = asyncHandler(async (req, res) => {
  const { name, email } = req.body
  if (!name || !email) return res.status(400).json({ message: 'name and email required' })
  const item = await SupportAgent.create(req.body)
  res.status(201).json({ item })
})

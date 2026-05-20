import asyncHandler from '../utils/asyncHandler.js'
import SupportTicket from '../models/SupportTicket.js'
import TicketMessage from '../models/TicketMessage.js'
import TicketCategory from '../models/TicketCategory.js'
import ActivityLog from '../models/ActivityLog.js'

const serializeTicket = (item) => ({
  id: item._id,
  ticketNo: item.ticketNo || '',
  subject: item.subject || '',
  description: item.description || '',
  category: item.category || null,
  priority: item.priority || 'medium',
  status: item.status || 'open',
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

const buildTicketNo = () => `MGR-${Date.now().toString(36).toUpperCase()}`

const scopedTicketQuery = (req) => ({
  company: String(req.user.companyId),
  raisedBy: String(req.user.id)
})

export const createManagerSupportTicket = asyncHandler(async (req, res) => {
  const { subject = '', description = '', category = null, priority = 'medium' } = req.body || {}
  if (!String(subject).trim()) return res.status(400).json({ success: false, message: 'subject is required' })
  if (!String(description).trim()) return res.status(400).json({ success: false, message: 'description is required' })

  const attachmentUrl = req.file ? `/uploads/documents/${req.file.filename}` : String(req.body?.attachmentUrl || '').trim()
  const ticket = await SupportTicket.create({
    ticketNo: buildTicketNo(),
    company: String(req.user.companyId),
    raisedBy: String(req.user.id),
    subject: String(subject).trim(),
    description: String(description).trim(),
    category: category || null,
    priority: String(priority || 'medium').toLowerCase(),
    status: 'open',
    attachmentUrl,
    screenshotUrl: attachmentUrl
  })

  await ActivityLog.create({
    companyId: req.user.companyId,
    userId: req.user.id,
    module: 'manager_support',
    action: 'ticket_created',
    message: `Manager created support ticket ${ticket.ticketNo}`,
    metadata: { ticketId: ticket._id }
  })

  return res.status(201).json({ success: true, message: 'Support ticket submitted successfully', data: serializeTicket(ticket) })
})

export const getManagerSupportTickets = asyncHandler(async (req, res) => {
  const status = String(req.query.status || 'all').trim().toLowerCase()
  const search = String(req.query.search || '').trim().toLowerCase()
  const query = scopedTicketQuery(req)
  if (status !== 'all') query.status = status

  const rows = await SupportTicket.find(query).sort({ createdAt: -1 })
  let data = rows.map(serializeTicket)
  if (search) {
    data = data.filter((x) => `${x.ticketNo} ${x.subject} ${x.description}`.toLowerCase().includes(search))
  }
  return res.status(200).json({ success: true, data })
})

export const getManagerSupportTicketById = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findOne({ _id: req.params.ticketId, ...scopedTicketQuery(req) })
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' })
  const messages = await TicketMessage.find({ ticket: String(ticket._id) }).sort({ createdAt: 1 })
  return res.status(200).json({ success: true, data: { ...serializeTicket(ticket), messages: messages.map(serializeMessage) } })
})

export const replyManagerSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findOne({ _id: req.params.ticketId, ...scopedTicketQuery(req) })
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' })
  if (String(ticket.status || '').toLowerCase() === 'closed') {
    return res.status(400).json({ success: false, message: 'Cannot reply to closed ticket' })
  }

  const message = String(req.body?.message || '').trim()
  if (!message) return res.status(400).json({ success: false, message: 'message is required' })
  const attachmentUrl = req.file ? `/uploads/documents/${req.file.filename}` : String(req.body?.attachmentUrl || '').trim()

  const msg = await TicketMessage.create({
    ticket: String(ticket._id),
    senderType: 'manager',
    senderName: req.user.name || 'Manager',
    message,
    attachmentUrl
  })

  ticket.status = 'in-progress'
  await ticket.save()

  await ActivityLog.create({
    companyId: req.user.companyId,
    userId: req.user.id,
    module: 'manager_support',
    action: 'ticket_replied',
    message: `Manager replied to ticket ${ticket.ticketNo}`,
    metadata: { ticketId: ticket._id, messageId: msg._id }
  })

  return res.status(201).json({ success: true, message: 'Reply added successfully', data: serializeMessage(msg) })
})

export const closeManagerSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findOne({ _id: req.params.ticketId, ...scopedTicketQuery(req) })
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' })
  ticket.status = 'closed'
  await ticket.save()

  await ActivityLog.create({
    companyId: req.user.companyId,
    userId: req.user.id,
    module: 'manager_support',
    action: 'ticket_closed',
    message: `Manager closed ticket ${ticket.ticketNo}`,
    metadata: { ticketId: ticket._id }
  })

  return res.status(200).json({ success: true, message: 'Ticket closed successfully', data: serializeTicket(ticket) })
})

export const getManagerSupportFaqs = asyncHandler(async (_req, res) => {
  const categories = await TicketCategory.find().sort({ name: 1 })
  const fallback = [
    { id: 'faq-1', question: 'How do I raise a support ticket?', answer: 'Open Create Support Ticket tab and submit subject and description.', category: 'General' },
    { id: 'faq-2', question: 'Can I attach screenshot?', answer: 'Yes, use Attach Screenshot while creating or replying to ticket.', category: 'General' },
    { id: 'faq-3', question: 'How do I track my ticket?', answer: 'Open My Tickets and click View to track status and replies.', category: 'Tickets' }
  ]

  const categoryFaqs = categories.map((x) => ({
    id: `cat-${x._id}`,
    question: `What is covered in ${x.name}?`,
    answer: x.description || `${x.name} related support issues are handled here.`,
    category: x.name || 'General'
  }))

  return res.status(200).json({ success: true, data: [...fallback, ...categoryFaqs] })
})

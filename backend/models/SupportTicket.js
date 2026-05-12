import { createCompatModel } from '../config/pgCompat.js'

const SupportTicket = createCompatModel('SupportTicket', { refs: { company: 'TenantCompany', raisedBy: 'GlobalUser', category: 'TicketCategory', assignedAgent: 'SupportAgent' }, defaults: () => ({ description: '', assignedAgent: null, status: 'open', priority: 'medium', slaDueAt: null, resolution: '', internalNotes: [] }) })

export default SupportTicket

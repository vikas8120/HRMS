import { createCompatModel } from '../config/pgCompat.js'

const TicketMessage = createCompatModel('TicketMessage', { refs: { ticket: 'SupportTicket' }, defaults: () => ({ senderName: '', attachmentUrl: '' }) })

export default TicketMessage

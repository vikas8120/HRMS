import { createCompatModel } from '../config/pgCompat.js'

const TicketCategory = createCompatModel('TicketCategory', { defaults: () => ({ description: '', slaHours: 24 }) })

export default TicketCategory

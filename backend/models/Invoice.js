import { createCompatModel } from '../config/pgCompat.js'

const Invoice = createCompatModel('Invoice', { refs: { company: 'TenantCompany', subscription: 'Subscription' }, defaults: () => ({ status: 'pending' }) })

export default Invoice

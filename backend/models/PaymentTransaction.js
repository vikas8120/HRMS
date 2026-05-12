import { createCompatModel } from '../config/pgCompat.js'

const PaymentTransaction = createCompatModel('PaymentTransaction', { refs: { invoice: 'Invoice', company: 'TenantCompany' }, defaults: () => ({ method: 'card', status: 'pending' }) })

export default PaymentTransaction

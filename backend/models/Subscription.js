import { createCompatModel } from '../config/pgCompat.js'

const Subscription = createCompatModel('Subscription', { refs: { company: 'TenantCompany', plan: 'SubscriptionPlan' }, defaults: () => ({ billingCycle: 'monthly', status: 'active', startDate: new Date().toISOString(), autoRenewal: true }) })

export default Subscription

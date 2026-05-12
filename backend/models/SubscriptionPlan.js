import { createCompatModel } from '../config/pgCompat.js'

const SubscriptionPlan = createCompatModel('SubscriptionPlan', { defaults: () => ({ type: 'standard', monthlyPrice: 0, yearlyPrice: 0, userLimit: 10, storageLimit: 5, features: [], autoRenewalEnabled: true, status: 'active' }) })

export default SubscriptionPlan

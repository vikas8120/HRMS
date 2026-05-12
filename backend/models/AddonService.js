import { createCompatModel } from '../config/pgCompat.js'

const AddonService = createCompatModel('AddonService', { defaults: () => ({ description: '', priceMonthly: 0, priceYearly: 0, active: true }) })

export default AddonService

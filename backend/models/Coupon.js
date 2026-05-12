import { createCompatModel } from '../config/pgCompat.js'

const Coupon = createCompatModel('Coupon', { defaults: () => ({ discountType: 'percent', active: true }) })

export default Coupon

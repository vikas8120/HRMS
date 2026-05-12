import { createCompatModel } from '../config/pgCompat.js'

const PlatformOverview = createCompatModel('PlatformOverview', {
  defaults: () => ({
    name: '',
    status: 'Active',
    owner: 'Platform Team'
  })
})

export default PlatformOverview

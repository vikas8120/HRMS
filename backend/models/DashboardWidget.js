import { createCompatModel } from '../config/pgCompat.js'

const DashboardWidget = createCompatModel('DashboardWidget', {
  defaults: () => ({
    sectionKey: 'platform-overview',
    name: '',
    status: 'Active',
    owner: 'Platform Team'
  })
})

export default DashboardWidget

import { createCompatModel } from '../config/pgCompat.js'

const Lead = createCompatModel('Lead', {
  refs: { company: 'TenantCompany' },
  defaults: () => ({
    source: 'Website',
    stage: 'Leads',
    status: 'open',
    dealValue: 0,
    isClosed: false,
    owner: '',
    notes: ''
  })
})

export default Lead

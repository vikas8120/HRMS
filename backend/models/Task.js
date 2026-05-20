import { createCompatModel } from '../config/pgCompat.js'

const Task = createCompatModel('Task', {
  refs: {
    companyId: 'TenantCompany',
    employeeId: 'User',
    assignedBy: 'User'
  },
  defaults: () => ({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    startDate: null,
    deadline: null,
    dueDate: null,
    attachments: [],
    comments: [],
    isDraft: false,
    completedAt: null,
    assignedBy: null
  })
})

export default Task

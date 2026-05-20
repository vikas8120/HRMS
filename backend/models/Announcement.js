import { createCompatModel } from '../config/pgCompat.js'

const Announcement = createCompatModel('Announcement', {
  defaults: () => ({
    title: '',
    message: '',
    audience: 'all',
    priority: 'normal',
    pinned: false,
    publishAt: null,
    status: 'published',
    archived: false,
    createdBy: '',
    acknowledgements: []
  })
})

export default Announcement

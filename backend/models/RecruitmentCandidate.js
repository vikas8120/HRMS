import { createCompatModel } from '../config/pgCompat.js'

const RecruitmentCandidate = createCompatModel('RecruitmentCandidate', {
  refs: {
    companyId: 'TenantCompany',
    ownerId: 'User',
    assignedRecruiterId: 'User'
  },
  defaults: () => ({
    fullName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    source: 'direct',
    stage: 'applied',
    experienceYears: 0,
    expectedCtc: '',
    noticePeriodDays: 0,
    location: '',
    resumeUrl: '',
    notes: '',
    interviewDate: null,
    joinedDate: null,
    archived: false,
    ownerId: null,
    assignedRecruiterId: null
  })
})

export default RecruitmentCandidate

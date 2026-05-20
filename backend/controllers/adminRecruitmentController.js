import asyncHandler from '../utils/asyncHandler.js'
import RecruitmentCandidate from '../models/RecruitmentCandidate.js'
import User from '../models/User.js'

const ALLOWED_STAGE = new Set(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'])
const ALLOWED_SOURCE = new Set(['direct', 'referral', 'job-portal', 'agency', 'campus'])

const toNum = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const serialize = (item, usersById = new Map()) => ({
  id: item._id,
  fullName: item.fullName || '',
  email: item.email || '',
  phone: item.phone || '',
  position: item.position || '',
  department: item.department || '',
  source: item.source || 'direct',
  stage: item.stage || 'applied',
  experienceYears: toNum(item.experienceYears),
  expectedCtc: item.expectedCtc || '',
  noticePeriodDays: toNum(item.noticePeriodDays),
  location: item.location || '',
  resumeUrl: item.resumeUrl || '',
  notes: item.notes || '',
  interviewDate: item.interviewDate || null,
  joinedDate: item.joinedDate || null,
  archived: Boolean(item.archived),
  assignedRecruiterId: item.assignedRecruiterId || null,
  assignedRecruiterName: usersById.get(String(item.assignedRecruiterId))?.name || '-',
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null
})

export const listRecruitmentCandidates = asyncHandler(async (req, res) => {
  const { search = '', stage = 'all', source = 'all', position = 'all', archived = 'false' } = req.query
  const query = { companyId: req.user.companyId, archived: String(archived) === 'true' }
  if (stage !== 'all') query.stage = String(stage)
  if (source !== 'all') query.source = String(source)
  if (position !== 'all') query.position = String(position)

  const [items, rawUsers] = await Promise.all([
    RecruitmentCandidate.find(query).sort({ createdAt: -1 }),
    User.find({ companyId: req.user.companyId }).select('_id name role')
  ])
  const users = rawUsers.filter((u) => ['admin', 'hr', 'manager'].includes(String(u.role || '').toLowerCase()))
  const usersById = new Map(users.map((u) => [String(u._id), u]))

  const filtered = items.filter((x) => {
    if (!search) return true
    const s = String(search).toLowerCase()
    return [x.fullName, x.email, x.phone, x.position, x.department, x.location].some((f) => String(f || '').toLowerCase().includes(s))
  })

  res.status(200).json({
    success: true,
    message: 'Recruitment candidates fetched successfully',
    items: filtered.map((x) => serialize(x, usersById)),
    recruiters: users.map((u) => ({ id: u._id, name: u.name || 'Unnamed' }))
  })
})

export const createRecruitmentCandidate = asyncHandler(async (req, res) => {
  const payload = req.body || {}
  if (!payload.fullName || !payload.email || !payload.position) {
    return res.status(400).json({ success: false, message: 'fullName, email and position are required' })
  }
  if (payload.stage && !ALLOWED_STAGE.has(String(payload.stage))) {
    return res.status(400).json({ success: false, message: 'Invalid stage value' })
  }
  if (payload.source && !ALLOWED_SOURCE.has(String(payload.source))) {
    return res.status(400).json({ success: false, message: 'Invalid source value' })
  }

  const item = await RecruitmentCandidate.create({
    companyId: req.user.companyId,
    fullName: String(payload.fullName).trim(),
    email: String(payload.email).trim(),
    phone: String(payload.phone || '').trim(),
    position: String(payload.position).trim(),
    department: String(payload.department || '').trim(),
    source: String(payload.source || 'direct'),
    stage: String(payload.stage || 'applied'),
    experienceYears: toNum(payload.experienceYears),
    expectedCtc: String(payload.expectedCtc || '').trim(),
    noticePeriodDays: toNum(payload.noticePeriodDays),
    location: String(payload.location || '').trim(),
    resumeUrl: String(payload.resumeUrl || '').trim(),
    notes: String(payload.notes || '').trim(),
    interviewDate: payload.interviewDate || null,
    joinedDate: payload.joinedDate || null,
    assignedRecruiterId: payload.assignedRecruiterId || null,
    ownerId: req.user.id,
    archived: false
  })

  res.status(201).json({ success: true, message: 'Candidate added successfully', item: serialize(item) })
})

export const updateRecruitmentCandidate = asyncHandler(async (req, res) => {
  const item = await RecruitmentCandidate.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Candidate not found' })

  const payload = req.body || {}
  if (payload.stage !== undefined && !ALLOWED_STAGE.has(String(payload.stage))) {
    return res.status(400).json({ success: false, message: 'Invalid stage value' })
  }
  if (payload.source !== undefined && !ALLOWED_SOURCE.has(String(payload.source))) {
    return res.status(400).json({ success: false, message: 'Invalid source value' })
  }

  const fields = ['fullName', 'email', 'phone', 'position', 'department', 'source', 'stage', 'expectedCtc', 'location', 'resumeUrl', 'notes', 'interviewDate', 'joinedDate', 'assignedRecruiterId']
  for (const key of fields) {
    if (payload[key] !== undefined) item[key] = payload[key] || (['interviewDate', 'joinedDate', 'assignedRecruiterId'].includes(key) ? null : '')
  }
  if (payload.experienceYears !== undefined) item.experienceYears = toNum(payload.experienceYears)
  if (payload.noticePeriodDays !== undefined) item.noticePeriodDays = toNum(payload.noticePeriodDays)

  await item.save()
  res.status(200).json({ success: true, message: 'Candidate updated successfully', item: serialize(item) })
})

export const deleteRecruitmentCandidate = asyncHandler(async (req, res) => {
  const result = await RecruitmentCandidate.deleteOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Candidate not found' })
  res.status(200).json({ success: true, message: 'Candidate deleted successfully' })
})

export const archiveRecruitmentCandidate = asyncHandler(async (req, res) => {
  const item = await RecruitmentCandidate.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Candidate not found' })
  item.archived = true
  await item.save()
  res.status(200).json({ success: true, message: 'Candidate archived successfully', item: serialize(item) })
})

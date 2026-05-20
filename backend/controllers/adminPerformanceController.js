import asyncHandler from '../utils/asyncHandler.js'
import PerformanceReview from '../models/PerformanceReview.js'
import User from '../models/User.js'

const ALLOWED_STATUS = new Set(['draft', 'in-progress', 'submitted', 'finalized'])

const scoreNum = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(5, n))
}

const serialize = (item, usersById = new Map()) => ({
  id: item._id,
  cycle: item.cycle || '',
  employeeId: item.employeeId || '',
  employeeName: usersById.get(String(item.employeeId))?.name || '-',
  reviewerId: item.reviewerId || '',
  reviewerName: usersById.get(String(item.reviewerId))?.name || '-',
  goal: item.goal || '',
  selfScore: Number(item.selfScore || 0),
  managerScore: Number(item.managerScore || 0),
  finalScore: Number(item.finalScore || 0),
  status: item.status || 'draft',
  feedback: item.feedback || '',
  reviewDate: item.reviewDate || null,
  archived: Boolean(item.archived),
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null
})

export const listPerformanceReviews = asyncHandler(async (req, res) => {
  const { search = '', cycle = 'all', status = 'all', employeeId = 'all', archived = 'false' } = req.query
  const query = { companyId: req.user.companyId, archived: String(archived) === 'true' }
  if (cycle !== 'all') query.cycle = String(cycle)
  if (status !== 'all') query.status = String(status)
  if (employeeId !== 'all') query.employeeId = String(employeeId)

  const [items, rawUsers] = await Promise.all([
    PerformanceReview.find(query).sort({ createdAt: -1 }),
    User.find({ companyId: req.user.companyId }).select('_id name email role')
  ])
  const users = rawUsers.filter((u) => ['hr', 'manager', 'employee'].includes(String(u.role || '').toLowerCase()))
  const usersById = new Map(users.map((u) => [String(u._id), u]))
  const filtered = items.filter((x) => {
    if (!search) return true
    const s = String(search).toLowerCase()
    return String(x.goal || '').toLowerCase().includes(s) || String(x.cycle || '').toLowerCase().includes(s) || String(usersById.get(String(x.employeeId))?.name || '').toLowerCase().includes(s)
  })

  res.status(200).json({
    success: true,
    message: 'Performance reviews fetched successfully',
    items: filtered.map((x) => serialize(x, usersById)),
    users: users.map((u) => ({ id: u._id, name: u.name || 'Unnamed', role: u.role || '' }))
  })
})

export const createPerformanceReview = asyncHandler(async (req, res) => {
  const { cycle, employeeId, reviewerId = null, goal, selfScore = 0, managerScore = 0, status = 'draft', feedback = '', reviewDate = null } = req.body || {}

  if (!cycle || !employeeId || !goal) return res.status(400).json({ success: false, message: 'cycle, employeeId and goal are required' })
  if (!ALLOWED_STATUS.has(String(status))) return res.status(400).json({ success: false, message: 'Invalid status value' })

  const employee = await User.findOne({ _id: employeeId, companyId: req.user.companyId })
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' })

  let reviewer = null
  if (reviewerId) {
    reviewer = await User.findOne({ _id: reviewerId, companyId: req.user.companyId })
    if (!reviewer) return res.status(404).json({ success: false, message: 'Reviewer not found' })
  }

  const sScore = scoreNum(selfScore)
  const mScore = scoreNum(managerScore)
  const finalScore = Number(((sScore + mScore) / 2).toFixed(2))

  const item = await PerformanceReview.create({
    companyId: req.user.companyId,
    cycle: String(cycle).trim(),
    employeeId: String(employeeId),
    reviewerId: reviewer ? String(reviewer._id) : null,
    goal: String(goal).trim(),
    selfScore: sScore,
    managerScore: mScore,
    finalScore,
    status: String(status),
    feedback: String(feedback || '').trim(),
    reviewDate: reviewDate || null,
    archived: false,
    createdBy: req.user.id
  })

  const usersById = new Map([[String(employee._id), employee]])
  if (reviewer) usersById.set(String(reviewer._id), reviewer)
  res.status(201).json({ success: true, message: 'Performance review created successfully', item: serialize(item, usersById) })
})

export const updatePerformanceReview = asyncHandler(async (req, res) => {
  const item = await PerformanceReview.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Performance review not found' })

  const { cycle, employeeId, reviewerId, goal, selfScore, managerScore, status, feedback, reviewDate } = req.body || {}
  if (status !== undefined && !ALLOWED_STATUS.has(String(status))) return res.status(400).json({ success: false, message: 'Invalid status value' })

  if (employeeId !== undefined) {
    const employee = await User.findOne({ _id: employeeId, companyId: req.user.companyId })
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' })
    item.employeeId = String(employeeId)
  }

  if (reviewerId !== undefined) {
    if (!reviewerId) {
      item.reviewerId = null
    } else {
      const reviewer = await User.findOne({ _id: reviewerId, companyId: req.user.companyId })
      if (!reviewer) return res.status(404).json({ success: false, message: 'Reviewer not found' })
      item.reviewerId = String(reviewerId)
    }
  }

  if (cycle !== undefined) item.cycle = String(cycle).trim()
  if (goal !== undefined) item.goal = String(goal).trim()
  if (feedback !== undefined) item.feedback = String(feedback || '').trim()
  if (reviewDate !== undefined) item.reviewDate = reviewDate || null
  if (status !== undefined) item.status = String(status)
  if (selfScore !== undefined) item.selfScore = scoreNum(selfScore)
  if (managerScore !== undefined) item.managerScore = scoreNum(managerScore)
  item.finalScore = Number((((item.selfScore || 0) + (item.managerScore || 0)) / 2).toFixed(2))

  await item.save()

  const users = await User.find({ companyId: req.user.companyId }).select('_id name')
  const usersById = new Map(users.map((u) => [String(u._id), u]))
  res.status(200).json({ success: true, message: 'Performance review updated successfully', item: serialize(item, usersById) })
})

export const deletePerformanceReview = asyncHandler(async (req, res) => {
  const result = await PerformanceReview.deleteOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Performance review not found' })
  res.status(200).json({ success: true, message: 'Performance review deleted successfully' })
})

export const archivePerformanceReview = asyncHandler(async (req, res) => {
  const item = await PerformanceReview.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Performance review not found' })
  item.archived = true
  await item.save()
  res.status(200).json({ success: true, message: 'Performance review archived successfully', item: serialize(item) })
})

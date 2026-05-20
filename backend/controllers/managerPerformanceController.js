import asyncHandler from '../utils/asyncHandler.js'
import PerformanceReview from '../models/PerformanceReview.js'
import User from '../models/User.js'
import ActivityLog from '../models/ActivityLog.js'

const ALLOWED_PERIOD = new Set(['monthly', 'quarterly', 'yearly'])
const ALLOWED_STATUS = new Set(['draft', 'submitted', 'finalized'])

const scoreNum = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(5, n))
}

const buildTeamScope = async (req) => {
  const companyId = String(req.user.companyId)
  const managerId = String(req.user.id)
  const team = await User.find({ companyId, role: 'employee', managerId }).select('_id employeeId name email designation departmentId')

  const keySet = new Set()
  const map = {}
  for (const emp of team) {
    const base = {
      id: String(emp._id),
      employeeId: String(emp.employeeId || emp._id),
      name: emp.name || '-',
      email: emp.email || '-',
      designation: emp.designation || '-',
      departmentId: emp.departmentId || null
    }
    keySet.add(base.id)
    keySet.add(base.employeeId)
    map[base.id] = base
    map[base.employeeId] = base
  }
  return { companyId, managerId, keySet, map, team }
}

const toReviewPayload = (item, employeeMap = {}) => {
  const employee = employeeMap[String(item.employeeId || '')] || {}
  const rating = Number(item.finalScore || 0)
  return {
    id: item._id,
    employeeId: employee.employeeId || item.employeeId || null,
    employeeName: employee.name || '-',
    reviewPeriod: item.reviewPeriod || item.cycle || 'monthly',
    rating,
    taskScore: Number(item.taskScore ?? 0),
    attendanceScore: Number(item.attendanceScore ?? 0),
    behaviourScore: Number(item.behaviourScore ?? 0),
    productivityScore: Number(item.productivityScore ?? 0),
    strengths: item.strengths || '',
    improvements: item.improvements || '',
    managerFeedback: item.managerFeedback || item.feedback || '',
    finalRemarks: item.finalRemarks || '',
    status: item.status || 'draft',
    isDraft: Boolean(item.isDraft),
    reviewDate: item.reviewDate || null,
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null
  }
}

const getScopedReview = async (req, reviewId) => {
  const { companyId, managerId, keySet } = await buildTeamScope(req)
  const review = await PerformanceReview.findOne({ _id: reviewId, companyId, reviewerId: managerId, archived: false })
  if (!review) return null
  if (!keySet.has(String(review.employeeId || ''))) return null
  return review
}

export const createManagerPerformanceReview = asyncHandler(async (req, res) => {
  const { companyId, managerId, keySet, map } = await buildTeamScope(req)
  const {
    employeeId,
    reviewPeriod = 'monthly',
    rating = 0,
    taskScore = 0,
    attendanceScore = 0,
    behaviourScore = 0,
    productivityScore = 0,
    strengths = '',
    improvements = '',
    managerFeedback = '',
    finalRemarks = '',
    status = 'submitted',
    isDraft = false,
    reviewDate = null
  } = req.body || {}

  if (!employeeId || !keySet.has(String(employeeId))) {
    return res.status(403).json({ success: false, message: 'Manager can review only assigned employees' })
  }
  const normalizedPeriod = String(reviewPeriod || '').toLowerCase()
  if (!ALLOWED_PERIOD.has(normalizedPeriod)) {
    return res.status(400).json({ success: false, message: 'Invalid reviewPeriod value' })
  }
  const normalizedStatus = String(status || 'submitted').toLowerCase()
  if (!ALLOWED_STATUS.has(normalizedStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' })
  }

  const normalizedTask = scoreNum(taskScore)
  const normalizedAttendance = scoreNum(attendanceScore)
  const normalizedBehaviour = scoreNum(behaviourScore)
  const normalizedProductivity = scoreNum(productivityScore)
  const normalizedRating = scoreNum(rating)
  const finalScore = Number(((normalizedTask + normalizedAttendance + normalizedBehaviour + normalizedProductivity + normalizedRating) / 5).toFixed(2))

  const row = await PerformanceReview.create({
    companyId,
    employeeId: String(employeeId),
    reviewerId: managerId,
    createdBy: managerId,
    cycle: normalizedPeriod,
    reviewPeriod: normalizedPeriod,
    goal: 'Manager Review',
    taskScore: normalizedTask,
    attendanceScore: normalizedAttendance,
    behaviourScore: normalizedBehaviour,
    productivityScore: normalizedProductivity,
    selfScore: normalizedRating,
    managerScore: finalScore,
    finalScore,
    strengths: String(strengths || '').trim(),
    improvements: String(improvements || '').trim(),
    managerFeedback: String(managerFeedback || '').trim(),
    finalRemarks: String(finalRemarks || '').trim(),
    feedback: String(managerFeedback || '').trim(),
    status: isDraft ? 'draft' : normalizedStatus,
    isDraft: Boolean(isDraft),
    reviewDate: reviewDate || null,
    archived: false
  })

  await ActivityLog.create({
    companyId,
    userId: managerId,
    module: 'manager_performance',
    action: 'review_created',
    message: `Performance review ${row._id} created`,
    metadata: { reviewId: row._id, employeeId: row.employeeId }
  })

  return res.status(201).json({ success: true, message: 'Review created successfully', data: toReviewPayload(row, map) })
})

export const getManagerPerformanceReviews = asyncHandler(async (req, res) => {
  const { companyId, managerId, keySet, map } = await buildTeamScope(req)
  const period = String(req.query.reviewPeriod || 'all').toLowerCase()
  const status = String(req.query.status || 'all').toLowerCase()
  const employeeId = String(req.query.employeeId || 'all').trim()
  const search = String(req.query.search || '').trim().toLowerCase()

  const query = { companyId, reviewerId: managerId, archived: false }
  if (period !== 'all' && ALLOWED_PERIOD.has(period)) query.reviewPeriod = period
  if (status !== 'all') query.status = status
  if (employeeId !== 'all') query.employeeId = employeeId

  const rows = await PerformanceReview.find(query).sort({ createdAt: -1 })
  let records = rows
    .filter((row) => keySet.has(String(row.employeeId || '')))
    .map((row) => toReviewPayload(row, map))

  if (search) {
    records = records.filter((x) => (`${x.employeeName} ${x.reviewPeriod} ${x.managerFeedback}`).toLowerCase().includes(search))
  }

  return res.status(200).json({ success: true, data: records })
})

export const getManagerPerformanceByEmployee = asyncHandler(async (req, res) => {
  const { companyId, managerId, keySet, map } = await buildTeamScope(req)
  const employeeId = String(req.params.employeeId || '').trim()
  if (!employeeId || !keySet.has(employeeId)) {
    return res.status(404).json({ success: false, message: 'Employee not found in your team scope' })
  }

  const rows = await PerformanceReview.find({
    companyId,
    reviewerId: managerId,
    employeeId,
    archived: false
  }).sort({ createdAt: -1 })

  const records = rows.map((row) => toReviewPayload(row, map))
  const averageRating = records.length
    ? Number((records.reduce((sum, row) => sum + Number(row.rating || 0), 0) / records.length).toFixed(2))
    : 0

  return res.status(200).json({ success: true, data: records, averageRating })
})

export const updateManagerPerformanceReview = asyncHandler(async (req, res) => {
  const { map } = await buildTeamScope(req)
  const row = await getScopedReview(req, req.params.reviewId)
  if (!row) return res.status(404).json({ success: false, message: 'Review not found in your scope' })

  const payload = req.body || {}
  if (payload.reviewPeriod !== undefined) {
    const period = String(payload.reviewPeriod).toLowerCase()
    if (!ALLOWED_PERIOD.has(period)) return res.status(400).json({ success: false, message: 'Invalid reviewPeriod value' })
    row.reviewPeriod = period
    row.cycle = period
  }
  if (payload.status !== undefined) {
    const status = String(payload.status).toLowerCase()
    if (!ALLOWED_STATUS.has(status)) return res.status(400).json({ success: false, message: 'Invalid status value' })
    row.status = status
  }
  if (payload.rating !== undefined) row.selfScore = scoreNum(payload.rating)
  if (payload.taskScore !== undefined) row.taskScore = scoreNum(payload.taskScore)
  if (payload.attendanceScore !== undefined) row.attendanceScore = scoreNum(payload.attendanceScore)
  if (payload.behaviourScore !== undefined) row.behaviourScore = scoreNum(payload.behaviourScore)
  if (payload.productivityScore !== undefined) row.productivityScore = scoreNum(payload.productivityScore)
  if (payload.strengths !== undefined) row.strengths = String(payload.strengths || '').trim()
  if (payload.improvements !== undefined) row.improvements = String(payload.improvements || '').trim()
  if (payload.managerFeedback !== undefined) {
    row.managerFeedback = String(payload.managerFeedback || '').trim()
    row.feedback = String(payload.managerFeedback || '').trim()
  }
  if (payload.finalRemarks !== undefined) row.finalRemarks = String(payload.finalRemarks || '').trim()
  if (payload.reviewDate !== undefined) row.reviewDate = payload.reviewDate || null
  if (payload.isDraft !== undefined) row.isDraft = Boolean(payload.isDraft)

  row.finalScore = Number((((Number(row.taskScore || 0) + Number(row.attendanceScore || 0) + Number(row.behaviourScore || 0) + Number(row.productivityScore || 0) + Number(row.selfScore || 0)) / 5)).toFixed(2))
  row.managerScore = row.finalScore
  await row.save()

  return res.status(200).json({ success: true, message: 'Review updated successfully', data: toReviewPayload(row, map) })
})

export const deleteManagerPerformanceReview = asyncHandler(async (req, res) => {
  const row = await getScopedReview(req, req.params.reviewId)
  if (!row) return res.status(404).json({ success: false, message: 'Review not found in your scope' })
  await PerformanceReview.deleteOne({ _id: row._id, companyId: row.companyId })
  return res.status(200).json({ success: true, message: 'Review deleted successfully' })
})

export const getManagerPerformanceDashboard = asyncHandler(async (req, res) => {
  const { companyId, managerId, keySet, map } = await buildTeamScope(req)
  const rows = await PerformanceReview.find({ companyId, reviewerId: managerId, archived: false }).sort({ createdAt: -1 })
  const records = rows
    .filter((row) => keySet.has(String(row.employeeId || '')))
    .map((row) => toReviewPayload(row, map))

  const averageRating = records.length
    ? Number((records.reduce((sum, row) => sum + Number(row.rating || 0), 0) / records.length).toFixed(2))
    : 0

  const byEmployee = records.reduce((acc, row) => {
    const key = String(row.employeeId || '')
    if (!acc[key]) acc[key] = { employeeId: row.employeeId, employeeName: row.employeeName, total: 0, count: 0, trend: [] }
    acc[key].total += Number(row.rating || 0)
    acc[key].count += 1
    acc[key].trend.push({ date: row.reviewDate || row.createdAt, rating: Number(row.rating || 0), period: row.reviewPeriod })
    return acc
  }, {})

  const employeeAverages = Object.values(byEmployee).map((x) => ({
    employeeId: x.employeeId,
    employeeName: x.employeeName,
    averageRating: Number((x.total / Math.max(x.count, 1)).toFixed(2)),
    reviews: x.count,
    trend: x.trend
  }))

  const sorted = [...employeeAverages].sort((a, b) => b.averageRating - a.averageRating)
  const topPerformers = sorted.slice(0, 5)
  const lowPerformers = [...sorted].reverse().slice(0, 5)

  return res.status(200).json({
    success: true,
    data: {
      averageRating,
      totalReviews: records.length,
      topPerformers,
      lowPerformers,
      teamComparison: sorted,
      performanceTrend: employeeAverages.flatMap((x) => x.trend.map((t) => ({ employeeId: x.employeeId, employeeName: x.employeeName, ...t })))
    }
  })
})

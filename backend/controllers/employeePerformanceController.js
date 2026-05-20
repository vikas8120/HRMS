import asyncHandler from '../utils/asyncHandler.js'
import PerformanceReview from '../models/PerformanceReview.js'

const clampProgress = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

const scoreNum = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(5, Number(n.toFixed(2))))
}

const normalizeStatus = (value) => String(value || '').trim().toLowerCase()

const toGoal = (item) => ({
  id: String(item._id),
  goal: item.goal || 'Performance Goal',
  cycle: item.reviewPeriod || item.cycle || 'monthly',
  status: item.status || 'draft',
  progress: clampProgress(item.goalProgress ?? 0),
  selfScore: Number(item.selfScore || 0),
  managerScore: Number(item.managerScore || 0),
  finalScore: Number(item.finalScore || 0),
  feedback: item.feedback || item.managerFeedback || '',
  strengths: item.strengths || '',
  improvements: item.improvements || '',
  reviewDate: item.reviewDate || null,
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null
})

const getEmployeeScope = (req) => ({
  companyId: String(req.user.companyId),
  employeeId: String(req.user.id)
})

const scopedQuery = (scope) => ({
  companyId: scope.companyId,
  employeeId: scope.employeeId,
  archived: { $ne: true }
})

export const getEmployeePerformanceOverview = asyncHandler(async (req, res) => {
  const scope = getEmployeeScope(req)
  const rows = await PerformanceReview.find(scopedQuery(scope)).sort({ createdAt: -1 })

  const goals = rows.map(toGoal)
  const averageScore = goals.length
    ? Number((goals.reduce((sum, row) => sum + Number(row.finalScore || 0), 0) / goals.length).toFixed(2))
    : 0

  const completedGoals = goals.filter((x) => normalizeStatus(x.status) === 'finalized' || x.progress >= 100).length
  const pendingGoals = goals.length - completedGoals

  return res.status(200).json({
    success: true,
    message: 'Performance overview fetched successfully',
    data: {
      summary: {
        totalGoals: goals.length,
        completedGoals,
        pendingGoals,
        averageScore
      },
      latestGoal: goals[0] || null,
      managerFeedback: goals.filter((x) => x.feedback).slice(0, 5),
      appraisalHistory: goals
    }
  })
})

export const getEmployeePerformanceGoals = asyncHandler(async (req, res) => {
  const scope = getEmployeeScope(req)
  const rows = await PerformanceReview.find(scopedQuery(scope)).sort({ createdAt: -1 })
  return res.status(200).json({
    success: true,
    message: 'Assigned goals fetched successfully',
    data: rows.map(toGoal)
  })
})

export const getEmployeePerformanceGoalById = asyncHandler(async (req, res) => {
  const scope = getEmployeeScope(req)
  const row = await PerformanceReview.findOne({ ...scopedQuery(scope), _id: req.params.id })

  if (!row) {
    return res.status(404).json({ success: false, message: 'Goal not found', data: null })
  }

  return res.status(200).json({
    success: true,
    message: 'Goal details fetched successfully',
    data: toGoal(row)
  })
})

export const updateEmployeePerformanceGoalProgress = asyncHandler(async (req, res) => {
  const scope = getEmployeeScope(req)
  const row = await PerformanceReview.findOne({ ...scopedQuery(scope), _id: req.params.id })

  if (!row) {
    return res.status(404).json({ success: false, message: 'Goal not found', data: null })
  }

  if (normalizeStatus(row.status) === 'finalized') {
    return res.status(400).json({ success: false, message: 'Goal progress cannot be updated after finalization', data: null })
  }

  const progress = clampProgress(req.body?.progress)
  row.goalProgress = progress
  if (progress >= 100 && normalizeStatus(row.status) === 'draft') row.status = 'submitted'
  await row.save()

  return res.status(200).json({
    success: true,
    message: 'Goal progress updated successfully',
    data: toGoal(row)
  })
})

export const getEmployeePerformanceFeedback = asyncHandler(async (req, res) => {
  const scope = getEmployeeScope(req)
  const rows = await PerformanceReview.find(scopedQuery(scope)).sort({ createdAt: -1 })

  const feedback = rows
    .filter((row) => String(row.feedback || row.managerFeedback || '').trim())
    .map((row) => ({
      id: String(row._id),
      cycle: row.reviewPeriod || row.cycle || 'monthly',
      managerFeedback: row.managerFeedback || row.feedback || '',
      finalRemarks: row.finalRemarks || '',
      reviewDate: row.reviewDate || null,
      status: row.status || 'draft'
    }))

  return res.status(200).json({
    success: true,
    message: 'Manager feedback fetched successfully',
    data: feedback
  })
})

export const getEmployeeAppraisalHistory = asyncHandler(async (req, res) => {
  const scope = getEmployeeScope(req)
  const rows = await PerformanceReview.find(scopedQuery(scope)).sort({ createdAt: -1 })

  return res.status(200).json({
    success: true,
    message: 'Appraisal history fetched successfully',
    data: rows.map((row) => ({
      id: String(row._id),
      cycle: row.reviewPeriod || row.cycle || 'monthly',
      selfScore: Number(row.selfScore || 0),
      managerScore: Number(row.managerScore || 0),
      finalScore: Number(row.finalScore || 0),
      status: row.status || 'draft',
      reviewDate: row.reviewDate || null,
      createdAt: row.createdAt || null
    }))
  })
})

export const submitEmployeeSelfReview = asyncHandler(async (req, res) => {
  const scope = getEmployeeScope(req)
  const {
    cycle = 'monthly',
    goal = 'Self Review',
    selfScore = 0,
    strengths = '',
    improvements = '',
    selfReview = '',
    reviewDate = null
  } = req.body || {}

  const normalizedCycle = String(cycle || 'monthly').trim().toLowerCase()
  if (!normalizedCycle) {
    return res.status(400).json({ success: false, message: 'cycle is required', data: null })
  }

  const normalizedGoal = String(goal || '').trim()
  if (!normalizedGoal) {
    return res.status(400).json({ success: false, message: 'goal is required', data: null })
  }

  const reviewText = String(selfReview || '').trim()
  if (!reviewText) {
    return res.status(400).json({ success: false, message: 'selfReview is required', data: null })
  }

  const row = await PerformanceReview.create({
    companyId: scope.companyId,
    employeeId: scope.employeeId,
    reviewerId: null,
    createdBy: scope.employeeId,
    cycle: normalizedCycle,
    reviewPeriod: normalizedCycle,
    goal: normalizedGoal,
    selfScore: scoreNum(selfScore),
    managerScore: 0,
    finalScore: scoreNum(selfScore),
    strengths: String(strengths || '').trim(),
    improvements: String(improvements || '').trim(),
    feedback: reviewText,
    managerFeedback: '',
    finalRemarks: '',
    status: 'submitted',
    isDraft: false,
    goalProgress: 100,
    reviewDate: reviewDate || new Date().toISOString(),
    archived: false
  })

  return res.status(201).json({
    success: true,
    message: 'Self review submitted successfully',
    data: toGoal(row)
  })
})

export const downloadEmployeePerformanceReport = asyncHandler(async (req, res) => {
  const scope = getEmployeeScope(req)
  const rows = await PerformanceReview.find(scopedQuery(scope)).sort({ createdAt: -1 })
  const goals = rows.map(toGoal)

  const report = {
    generatedAt: new Date().toISOString(),
    employeeId: scope.employeeId,
    companyId: scope.companyId,
    totalGoals: goals.length,
    averageScore: goals.length
      ? Number((goals.reduce((sum, row) => sum + Number(row.finalScore || 0), 0) / goals.length).toFixed(2))
      : 0,
    goals
  }

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', `attachment; filename="employee-performance-report-${new Date().toISOString().slice(0, 10)}.json"`)

  return res.status(200).send(JSON.stringify(report, null, 2))
})

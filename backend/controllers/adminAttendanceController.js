import asyncHandler from '../utils/asyncHandler.js'
import Attendance from '../models/Attendance.js'
import User from '../models/User.js'

const ALLOWED_STATUS = new Set(['present', 'absent', 'half-day', 'late', 'leave'])

const toDateKey = (value) => String(value || '').slice(0, 10)

const getHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0
  const inTime = new Date(checkIn).getTime()
  const outTime = new Date(checkOut).getTime()
  if (!Number.isFinite(inTime) || !Number.isFinite(outTime) || outTime <= inTime) return 0
  return Number(((outTime - inTime) / (1000 * 60 * 60)).toFixed(2))
}

const serializeAttendance = (item, employeeMap = {}) => ({
  id: item._id,
  employeeId: item.employeeId || item.userId || null,
  employeeName: employeeMap[String(item.employeeId || item.userId || '')]?.name || '-',
  departmentId: employeeMap[String(item.employeeId || item.userId || '')]?.departmentId || null,
  companyId: item.companyId,
  date: item.date || null,
  checkIn: item.checkIn || null,
  checkOut: item.checkOut || null,
  workingHours: Number(item.workingHours || getHours(item.checkIn, item.checkOut)),
  status: item.status || 'present',
  markedBy: item.markedBy || null,
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null
})

const buildBaseFilters = (req) => {
  const companyId = req.user.companyId
  const employeeId = String(req.query.employeeId || '').trim()
  const departmentId = String(req.query.departmentId || '').trim()
  const rawDate = String(req.query.date || '').trim()
  const date = rawDate ? toDateKey(rawDate) : ''
  const status = String(req.query.status || '').trim().toLowerCase()

  const query = { companyId }

  if (employeeId && employeeId !== 'all') {
    query.employeeId = employeeId
  }

  if (date) {
    query.date = date
  }

  if (status && ALLOWED_STATUS.has(status)) {
    query.status = status
  }

  return { companyId, employeeId, departmentId, date, status, query }
}

const normalizeDescriptor = (value) => {
  if (!Array.isArray(value)) return null
  const numeric = value.map((n) => Number(n)).filter((n) => Number.isFinite(n))
  if (numeric.length < 32) return null
  return numeric
}

const cosineSimilarity = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return 0
  let dot = 0
  let magA = 0
  let magB = 0
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  if (!magA || !magB) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

const FACE_MATCH_THRESHOLD = 0.94

const verifyFaceOrThrow = (userDoc, incomingDescriptor) => {
  const enrolled = normalizeDescriptor(userDoc?.faceDescriptor)
  const incoming = normalizeDescriptor(incomingDescriptor)
  if (!enrolled) {
    const error = new Error('Face not enrolled. Please enroll your face first.')
    error.statusCode = 400
    throw error
  }
  if (!incoming) {
    const error = new Error('faceDescriptor is required for face verification')
    error.statusCode = 400
    throw error
  }
  const score = cosineSimilarity(enrolled, incoming)
  if (score < FACE_MATCH_THRESHOLD) {
    const error = new Error('Face verification failed. Please try again in good lighting.')
    error.statusCode = 403
    throw error
  }
  return score
}

const attachDepartmentFilter = async (query, companyId, departmentId) => {
  if (!departmentId || departmentId === 'all') return query

  const employees = await User.find({ companyId, role: 'employee', departmentId }).select('_id employeeId departmentId name')
  const employeeIds = employees.map((emp) => String(emp.employeeId || emp._id))
  if (query.employeeId && typeof query.employeeId === 'string') {
    query.employeeId = employeeIds.includes(String(query.employeeId)) ? String(query.employeeId) : { $in: [] }
  } else {
    query.employeeId = { $in: employeeIds }
  }
  return query
}

const getEmployeeMap = async (companyId) => {
  const employees = await User.find({ companyId, role: 'employee' }).select('_id employeeId name departmentId')
  return Object.fromEntries(
    employees.map((emp) => [String(emp.employeeId || emp._id), { name: emp.name || '-', departmentId: emp.departmentId || null }])
  )
}

const getSelfAttendanceIdentifiers = (userDoc) => {
  const employeeId = String(userDoc?.employeeId || userDoc?._id || '')
  const userId = String(userDoc?._id || '')
  return { employeeId, userId }
}

export const listAttendance = asyncHandler(async (req, res) => {
  const { companyId, departmentId, query } = buildBaseFilters(req)
  await attachDepartmentFilter(query, companyId, departmentId)

  const items = await Attendance.find(query).sort({ date: -1, createdAt: -1 })
  const employeeMap = await getEmployeeMap(companyId)

  return res.status(200).json({
    success: true,
    message: 'Attendance fetched successfully',
    data: items.map((item) => serializeAttendance(item, employeeMap))
  })
})

export const getTodayAttendance = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10)
  const { companyId, departmentId, query } = buildBaseFilters(req)
  query.date = today
  await attachDepartmentFilter(query, companyId, departmentId)

  const items = await Attendance.find(query).sort({ createdAt: -1 })
  const employeeMap = await getEmployeeMap(companyId)
  const records = items.map((item) => serializeAttendance(item, employeeMap))
  const summary = {
    total: records.length,
    present: records.filter((row) => row.status === 'present').length,
    absent: records.filter((row) => row.status === 'absent').length,
    halfDay: records.filter((row) => row.status === 'half-day').length,
    late: records.filter((row) => row.status === 'late').length,
    leave: records.filter((row) => row.status === 'leave').length
  }

  return res.status(200).json({
    success: true,
    message: "Today's attendance fetched successfully",
    data: records,
    summary
  })
})

export const getMonthlyAttendance = asyncHandler(async (req, res) => {
  const now = new Date()
  const month = String(req.query.month || String(now.getUTCMonth() + 1).padStart(2, '0')).padStart(2, '0')
  const year = String(req.query.year || now.getUTCFullYear())

  const { companyId, departmentId, query } = buildBaseFilters(req)
  await attachDepartmentFilter(query, companyId, departmentId)

  const items = await Attendance.find(query).sort({ date: -1, createdAt: -1 })
  const employeeMap = await getEmployeeMap(companyId)

  const monthly = items.filter((item) => {
    const d = toDateKey(item.date)
    return d.startsWith(`${year}-${month}`)
  })

  const summary = {
    total: monthly.length,
    present: monthly.filter((row) => row.status === 'present').length,
    absent: monthly.filter((row) => row.status === 'absent').length,
    halfDay: monthly.filter((row) => row.status === 'half-day').length,
    late: monthly.filter((row) => row.status === 'late').length,
    leave: monthly.filter((row) => row.status === 'leave').length
  }

  return res.status(200).json({
    success: true,
    message: 'Monthly attendance fetched successfully',
    data: {
      month,
      year,
      summary,
      records: monthly.map((item) => serializeAttendance(item, employeeMap))
    }
  })
})

export const markManualAttendance = asyncHandler(async (req, res) => {
  const { employeeId, date, checkIn = null, checkOut = null, status = 'present' } = req.body
  if (!employeeId || !date) {
    return res.status(400).json({ success: false, message: 'employeeId and date are required' })
  }

  const normalizedStatus = String(status).toLowerCase()
  if (!ALLOWED_STATUS.has(normalizedStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid attendance status' })
  }

  const employee = await User.findOne({ companyId: req.user.companyId, role: 'employee', $or: [{ employeeId: String(employeeId) }, { _id: String(employeeId) }] })
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found for this company' })
  }

  const resolvedEmployeeId = String(employee.employeeId || employee._id)
  const normalizedDate = toDateKey(date)

  const existing = await Attendance.findOne({ companyId: req.user.companyId, employeeId: resolvedEmployeeId, date: normalizedDate })
  if (existing) {
    return res.status(409).json({ success: false, message: 'Attendance already marked for this employee on this date' })
  }

  const workingHours = getHours(checkIn, checkOut)

  const item = await Attendance.create({
    companyId: req.user.companyId,
    employeeId: resolvedEmployeeId,
    userId: String(employee._id),
    date: normalizedDate,
    checkIn,
    checkOut,
    workingHours,
    status: normalizedStatus,
    markedBy: req.user.id
  })

  const employeeMap = await getEmployeeMap(req.user.companyId)

  return res.status(201).json({
    success: true,
    message: 'Manual attendance marked successfully',
    data: serializeAttendance(item, employeeMap)
  })
})

export const updateAttendance = asyncHandler(async (req, res) => {
  const item = await Attendance.findOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!item) return res.status(404).json({ success: false, message: 'Attendance record not found' })

  const { checkIn, checkOut, status, date } = req.body
  const nextDate = date !== undefined ? toDateKey(String(date)) : toDateKey(String(item.date))
  const duplicate = await Attendance.findOne({
    _id: { $ne: item._id },
    companyId: req.user.companyId,
    employeeId: item.employeeId,
    date: nextDate
  })
  if (duplicate) {
    return res.status(409).json({ success: false, message: 'Attendance already exists for this employee on this date' })
  }

  if (date !== undefined) item.date = nextDate
  if (checkIn !== undefined) item.checkIn = checkIn
  if (checkOut !== undefined) item.checkOut = checkOut

  if (status !== undefined) {
    const normalizedStatus = String(status).toLowerCase()
    if (!ALLOWED_STATUS.has(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid attendance status' })
    }
    item.status = normalizedStatus
  }

  item.workingHours = getHours(item.checkIn, item.checkOut)
  item.markedBy = req.user.id
  await item.save()

  const employeeMap = await getEmployeeMap(req.user.companyId)

  return res.status(200).json({
    success: true,
    message: 'Attendance updated successfully',
    data: serializeAttendance(item, employeeMap)
  })
})

export const exportAttendance = asyncHandler(async (req, res) => {
  const { companyId, departmentId, query } = buildBaseFilters(req)
  await attachDepartmentFilter(query, companyId, departmentId)

  const items = await Attendance.find(query).sort({ date: -1 })
  const employeeMap = await getEmployeeMap(companyId)
  const records = items.map((item) => serializeAttendance(item, employeeMap))

  const headers = ['Employee ID', 'Employee Name', 'Department ID', 'Date', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Marked By']
  const rows = records.map((row) => [
    row.employeeId || '',
    row.employeeName || '',
    row.departmentId || '',
    row.date || '',
    row.checkIn || '',
    row.checkOut || '',
    row.workingHours || 0,
    row.status || '',
    row.markedBy || ''
  ])

  const csv = [headers, ...rows]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename=attendance-${new Date().toISOString().slice(0, 10)}.csv`)
  return res.status(200).send(csv)
})

export const getMyAttendanceToday = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10)
  const userDoc = await User.findOne({ _id: req.user.id, companyId: req.user.companyId })
  if (!userDoc) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  const { employeeId } = getSelfAttendanceIdentifiers(userDoc)
  const item = await Attendance.findOne({ companyId: req.user.companyId, employeeId, date: today })

  if (!item) {
    return res.status(200).json({
      success: true,
      message: 'No attendance marked for today',
      data: {
        employeeId,
        date: today,
        checkIn: null,
        checkOut: null,
        workingHours: 0,
        status: 'not-marked'
      },
      faceEnrolled: Boolean(normalizeDescriptor(userDoc?.faceDescriptor))
    })
  }

  return res.status(200).json({
    success: true,
    message: "Today's attendance fetched successfully",
    data: {
      ...serializeAttendance(item),
      faceEnrolled: Boolean(normalizeDescriptor(userDoc?.faceDescriptor))
    }
  })
})

export const enrollAttendanceFace = asyncHandler(async (req, res) => {
  const userDoc = await User.findOne({ _id: req.user.id, companyId: req.user.companyId })
  if (!userDoc) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }
  const descriptor = normalizeDescriptor(req.body?.faceDescriptor)
  if (!descriptor) {
    return res.status(400).json({ success: false, message: 'Valid faceDescriptor is required for enrollment' })
  }
  userDoc.faceDescriptor = descriptor
  userDoc.faceEnrolledAt = new Date().toISOString()
  await userDoc.save()
  return res.status(200).json({
    success: true,
    message: 'Face enrolled for attendance successfully',
    data: { faceEnrolled: true, faceEnrolledAt: userDoc.faceEnrolledAt }
  })
})

export const punchInAttendance = asyncHandler(async (req, res) => {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const userDoc = await User.findOne({ _id: req.user.id, companyId: req.user.companyId })
  if (!userDoc) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }
  verifyFaceOrThrow(userDoc, req.body?.faceDescriptor)

  const { employeeId, userId } = getSelfAttendanceIdentifiers(userDoc)
  let item = await Attendance.findOne({ companyId: req.user.companyId, employeeId, date: today })

  if (item?.checkIn) {
    return res.status(409).json({ success: false, message: 'Already punched in for today' })
  }

  const checkIn = now.toISOString()
  if (!item) {
    item = await Attendance.create({
      companyId: req.user.companyId,
      employeeId,
      userId,
      date: today,
      checkIn,
      checkOut: null,
      workingHours: 0,
      status: 'present',
      markedBy: req.user.id
    })
  } else {
    item.checkIn = checkIn
    item.status = item.status === 'absent' ? 'present' : item.status
    item.markedBy = req.user.id
    await item.save()
  }

  return res.status(200).json({
    success: true,
    message: 'Punch in recorded successfully',
    data: serializeAttendance(item)
  })
})

export const punchOutAttendance = asyncHandler(async (req, res) => {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const userDoc = await User.findOne({ _id: req.user.id, companyId: req.user.companyId })
  if (!userDoc) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }
  verifyFaceOrThrow(userDoc, req.body?.faceDescriptor)

  const { employeeId } = getSelfAttendanceIdentifiers(userDoc)
  const item = await Attendance.findOne({ companyId: req.user.companyId, employeeId, date: today })
  if (!item || !item.checkIn) {
    return res.status(409).json({ success: false, message: 'Punch in first before punch out' })
  }
  if (item.checkOut) {
    return res.status(409).json({ success: false, message: 'Already punched out for today' })
  }

  item.checkOut = now.toISOString()
  item.workingHours = getHours(item.checkIn, item.checkOut)
  item.markedBy = req.user.id
  await item.save()

  return res.status(200).json({
    success: true,
    message: 'Punch out recorded successfully',
    data: serializeAttendance(item)
  })
})

// Backward compatibility aliases
export const createAttendance = markManualAttendance
export const deleteAttendance = asyncHandler(async (req, res) => {
  const result = await Attendance.deleteOne({ _id: req.params.id, companyId: req.user.companyId })
  if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Attendance record not found' })
  return res.status(200).json({ success: true, message: 'Attendance deleted successfully' })
})

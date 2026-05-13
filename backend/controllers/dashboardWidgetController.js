import asyncHandler from '../utils/asyncHandler.js'
import DashboardWidget from '../models/DashboardWidget.js'
const respond = (res, status, message, payload = {}) => res.status(status).json({ success: status < 400, message, data: payload, ...payload })

const serialize = (item) => ({
  id: item._id,
  _id: item._id,
  sectionKey: item.sectionKey,
  name: item.name,
  status: item.status,
  owner: item.owner,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt
})

export const listDashboardWidgets = asyncHandler(async (req, res) => {
  const { sectionKey } = req.params
  const { page = 1, limit = 10, search = '', status = 'all' } = req.query

  const query = { sectionKey }
  if (search) query.name = { $regex: search, $options: 'i' }
  if (status && status !== 'all') query.status = status

  const skip = (Number(page) - 1) * Number(limit)
  const [items, total] = await Promise.all([
    DashboardWidget.find(query).sort({ updatedAt: -1 }).skip(skip).limit(Number(limit)),
    DashboardWidget.countDocuments(query)
  ])

  const data = items.map(serialize)
  respond(res, 200, 'Dashboard widgets fetched successfully', {
    data,
    items: data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  })
})

export const createDashboardWidget = asyncHandler(async (req, res) => {
  const { sectionKey } = req.params
  const { name, status = 'Active', owner = 'Platform Team' } = req.body
  if (!name?.trim()) return respond(res, 400, 'name is required')

  const item = await DashboardWidget.create({ sectionKey, name: name.trim(), status, owner })
  const data = serialize(item)
  respond(res, 201, 'Dashboard widget created successfully', { data, item: data })
})

export const getDashboardWidgetById = asyncHandler(async (req, res) => {
  const { sectionKey, id } = req.params
  const item = await DashboardWidget.findById(id)
  if (!item || item.sectionKey !== sectionKey) return respond(res, 404, 'Record not found')
  const data = serialize(item)
  respond(res, 200, 'Dashboard widget fetched successfully', { data, item: data })
})

export const updateDashboardWidget = asyncHandler(async (req, res) => {
  const { sectionKey, id } = req.params
  const item = await DashboardWidget.findById(id)
  if (!item || item.sectionKey !== sectionKey) return respond(res, 404, 'Record not found')

  if (req.body.name !== undefined) item.name = String(req.body.name).trim()
  if (req.body.status !== undefined) item.status = req.body.status
  if (req.body.owner !== undefined) item.owner = req.body.owner

  if (!item.name) return respond(res, 400, 'name is required')

  await item.save()
  const data = serialize(item)
  respond(res, 200, 'Dashboard widget updated successfully', { data, item: data })
})

export const deleteDashboardWidget = asyncHandler(async (req, res) => {
  const { sectionKey, id } = req.params
  const item = await DashboardWidget.findById(id)
  if (!item || item.sectionKey !== sectionKey) return respond(res, 404, 'Record not found')

  await DashboardWidget.deleteOne({ _id: item._id })
  respond(res, 200, 'Deleted successfully')
})

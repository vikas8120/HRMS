import asyncHandler from '../utils/asyncHandler.js'
import PlatformOverview from '../models/PlatformOverview.js'
const respond = (res, status, message, payload = {}) => res.status(status).json({ success: status < 400, message, data: payload, ...payload })

const serialize = (item) => ({
  id: item._id,
  _id: item._id,
  name: item.name,
  status: item.status,
  owner: item.owner,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt
})

export const listPlatformOverview = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1)
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 200)
  const search = String(req.query.search || '')
  const status = String(req.query.status || 'all')

  const query = {}
  if (search) query.name = { $regex: search, $options: 'i' }
  if (status && status !== 'all') query.status = status

  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    PlatformOverview.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    PlatformOverview.countDocuments(query)
  ])

  const data = items.map(serialize)
  respond(res, 200, 'Platform overview fetched successfully', {
    data,
    items: data,
    pagination: {
      page: Number(page),
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  })
})

export const createPlatformOverview = asyncHandler(async (req, res) => {
  const { name, status = 'Active', owner = 'Platform Team' } = req.body
  if (!name?.trim()) return respond(res, 400, 'name is required')

  const item = await PlatformOverview.create({ name: name.trim(), status, owner })
  const data = serialize(item)
  respond(res, 201, 'Platform overview created successfully', { data, item: data })
})

export const getPlatformOverviewById = asyncHandler(async (req, res) => {
  const item = await PlatformOverview.findById(req.params.id)
  if (!item) return respond(res, 404, 'Record not found')
  const data = serialize(item)
  respond(res, 200, 'Platform overview fetched successfully', { data, item: data })
})

export const updatePlatformOverview = asyncHandler(async (req, res) => {
  const item = await PlatformOverview.findById(req.params.id)
  if (!item) return respond(res, 404, 'Record not found')

  if (req.body.name !== undefined) item.name = String(req.body.name).trim()
  if (req.body.status !== undefined) item.status = req.body.status
  if (req.body.owner !== undefined) item.owner = req.body.owner

  if (!item.name) return respond(res, 400, 'name is required')

  await item.save()
  const data = serialize(item)
  respond(res, 200, 'Platform overview updated successfully', { data, item: data })
})

export const deletePlatformOverview = asyncHandler(async (req, res) => {
  const item = await PlatformOverview.findById(req.params.id)
  if (!item) return respond(res, 404, 'Record not found')

  await PlatformOverview.deleteOne({ _id: item._id })
  respond(res, 200, 'Deleted successfully')
})

import asyncHandler from '../utils/asyncHandler.js'
import PlatformOverview from '../models/PlatformOverview.js'

const defaultItems = [
  { name: 'Platform Overview Item 1', status: 'Active', owner: 'Platform Team' },
  { name: 'Platform Overview Item 2', status: 'Pending', owner: 'Finance Team' },
  { name: 'Platform Overview Item 3', status: 'Active', owner: 'Security Team' },
  { name: 'Platform Overview Item 4', status: 'Pending', owner: 'Platform Team' },
  { name: 'Platform Overview Item 5', status: 'Active', owner: 'Finance Team' }
]

const serialize = (item) => ({
  id: item._id,
  _id: item._id,
  name: item.name,
  status: item.status,
  owner: item.owner,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt
})

const ensureSeed = async () => {
  const count = await PlatformOverview.countDocuments()
  if (count === 0) {
    await PlatformOverview.insertMany(defaultItems)
  }
}

export const listPlatformOverview = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', status = 'all' } = req.query
  await ensureSeed()

  const query = {}
  if (search) query.name = { $regex: search, $options: 'i' }
  if (status && status !== 'all') query.status = status

  const skip = (Number(page) - 1) * Number(limit)
  const [items, total] = await Promise.all([
    PlatformOverview.find(query).sort({ updatedAt: -1 }).skip(skip).limit(Number(limit)),
    PlatformOverview.countDocuments(query)
  ])

  res.status(200).json({
    items: items.map(serialize),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  })
})

export const createPlatformOverview = asyncHandler(async (req, res) => {
  const { name, status = 'Active', owner = 'Platform Team' } = req.body
  if (!name?.trim()) return res.status(400).json({ message: 'name is required' })

  const item = await PlatformOverview.create({ name: name.trim(), status, owner })
  res.status(201).json({ item: serialize(item) })
})

export const getPlatformOverviewById = asyncHandler(async (req, res) => {
  const item = await PlatformOverview.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Record not found' })
  res.status(200).json({ item: serialize(item) })
})

export const updatePlatformOverview = asyncHandler(async (req, res) => {
  const item = await PlatformOverview.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Record not found' })

  if (req.body.name !== undefined) item.name = String(req.body.name).trim()
  if (req.body.status !== undefined) item.status = req.body.status
  if (req.body.owner !== undefined) item.owner = req.body.owner

  if (!item.name) return res.status(400).json({ message: 'name is required' })

  await item.save()
  res.status(200).json({ item: serialize(item) })
})

export const deletePlatformOverview = asyncHandler(async (req, res) => {
  const item = await PlatformOverview.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Record not found' })

  await PlatformOverview.deleteOne({ _id: item._id })
  res.status(200).json({ message: 'Deleted successfully' })
})

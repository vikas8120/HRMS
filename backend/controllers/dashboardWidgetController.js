import asyncHandler from '../utils/asyncHandler.js'
import DashboardWidget from '../models/DashboardWidget.js'

const defaultBySection = {
  'platform-overview': [
    { name: 'Platform Overview Item 1', status: 'Active', owner: 'Platform Team' },
    { name: 'Platform Overview Item 2', status: 'Pending', owner: 'Finance Team' },
    { name: 'Platform Overview Item 3', status: 'Active', owner: 'Security Team' }
  ],
  'total-companies': [
    { name: 'Total Companies Item 1', status: 'Active', owner: 'Platform Team' },
    { name: 'Total Companies Item 2', status: 'Pending', owner: 'Finance Team' },
    { name: 'Total Companies Item 3', status: 'Active', owner: 'Security Team' }
  ],
  'active-users': [
    { name: 'Active Users Item 1', status: 'Active', owner: 'Platform Team' },
    { name: 'Active Users Item 2', status: 'Pending', owner: 'Finance Team' },
    { name: 'Active Users Item 3', status: 'Active', owner: 'Security Team' }
  ]
}

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

const ensureSeed = async (sectionKey) => {
  const count = await DashboardWidget.countDocuments({ sectionKey })
  if (count === 0) {
    const seed = defaultBySection[sectionKey] || []
    if (seed.length) {
      await DashboardWidget.insertMany(seed.map((entry) => ({ ...entry, sectionKey })))
    }
  }
}

export const listDashboardWidgets = asyncHandler(async (req, res) => {
  const { sectionKey } = req.params
  const { page = 1, limit = 10, search = '', status = 'all' } = req.query

  await ensureSeed(sectionKey)

  const query = { sectionKey }
  if (search) query.name = { $regex: search, $options: 'i' }
  if (status && status !== 'all') query.status = status

  const skip = (Number(page) - 1) * Number(limit)
  const [items, total] = await Promise.all([
    DashboardWidget.find(query).sort({ updatedAt: -1 }).skip(skip).limit(Number(limit)),
    DashboardWidget.countDocuments(query)
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

export const createDashboardWidget = asyncHandler(async (req, res) => {
  const { sectionKey } = req.params
  const { name, status = 'Active', owner = 'Platform Team' } = req.body
  if (!name?.trim()) return res.status(400).json({ message: 'name is required' })

  const item = await DashboardWidget.create({ sectionKey, name: name.trim(), status, owner })
  res.status(201).json({ item: serialize(item) })
})

export const getDashboardWidgetById = asyncHandler(async (req, res) => {
  const { sectionKey, id } = req.params
  const item = await DashboardWidget.findById(id)
  if (!item || item.sectionKey !== sectionKey) return res.status(404).json({ message: 'Record not found' })
  res.status(200).json({ item: serialize(item) })
})

export const updateDashboardWidget = asyncHandler(async (req, res) => {
  const { sectionKey, id } = req.params
  const item = await DashboardWidget.findById(id)
  if (!item || item.sectionKey !== sectionKey) return res.status(404).json({ message: 'Record not found' })

  if (req.body.name !== undefined) item.name = String(req.body.name).trim()
  if (req.body.status !== undefined) item.status = req.body.status
  if (req.body.owner !== undefined) item.owner = req.body.owner

  if (!item.name) return res.status(400).json({ message: 'name is required' })

  await item.save()
  res.status(200).json({ item: serialize(item) })
})

export const deleteDashboardWidget = asyncHandler(async (req, res) => {
  const { sectionKey, id } = req.params
  const item = await DashboardWidget.findById(id)
  if (!item || item.sectionKey !== sectionKey) return res.status(404).json({ message: 'Record not found' })

  await DashboardWidget.deleteOne({ _id: item._id })
  res.status(200).json({ message: 'Deleted successfully' })
})

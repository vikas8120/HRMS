import AdminAccessLog from '../models/AdminAccessLog.js'
import AdminActivityLog from '../models/AdminActivityLog.js'
import Role from '../models/Role.js'
import Permission from '../models/Permission.js'
import CompanyAdmin from '../models/CompanyAdmin.js'
import asyncHandler from '../utils/asyncHandler.js'
import { createAdminActivityLog } from '../utils/adminAudit.js'

export const getAdminAccessLogs = asyncHandler(async (_req, res) => {
  const items = await AdminAccessLog.find()
    .populate('admin', 'name email')
    .sort({ dateTime: -1 })
    .limit(300)

  return res.status(200).json({ items })
})

export const getAdminActivityLogs = asyncHandler(async (_req, res) => {
  const items = await AdminActivityLog.find()
    .populate('admin', 'name email')
    .sort({ dateTime: -1 })
    .limit(500)

  return res.status(200).json({ items })
})

export const getRoles = asyncHandler(async (_req, res) => {
  const items = await Role.find().sort({ name: 1 })
  return res.status(200).json({ items })
})

export const createRole = asyncHandler(async (req, res) => {
  const { name, description = '', permissions = [] } = req.body
  if (!name) return res.status(400).json({ message: 'Role name is required' })

  const exists = await Role.findOne({ name: name.trim() })
  if (exists) return res.status(400).json({ message: 'Role already exists' })

  const item = await Role.create({ name: name.trim(), description, permissions })
  return res.status(201).json({ item })
})

export const updateRolePermissions = asyncHandler(async (req, res) => {
  const { permissions = [] } = req.body
  const role = await Role.findById(req.params.id)
  if (!role) return res.status(404).json({ message: 'Role not found' })

  role.permissions = permissions
  await role.save()

  await Permission.deleteMany({ role: role._id })
  if (permissions.length > 0) {
    await Permission.insertMany(
      permissions.map((entry) => ({
        role: role._id,
        module: entry.module,
        view: Boolean(entry.view),
        create: Boolean(entry.create),
        edit: Boolean(entry.edit),
        delete: Boolean(entry.delete),
        approve: Boolean(entry.approve),
        export: Boolean(entry.export)
      }))
    )
  }

  return res.status(200).json({ item: role })
})

export const assignRoleToAdmin = asyncHandler(async (req, res) => {
  const { adminId, role } = req.body
  if (!adminId || !role) return res.status(400).json({ message: 'adminId and role are required' })

  const admin = await CompanyAdmin.findById(adminId)
  if (!admin) return res.status(404).json({ message: 'Admin not found' })

  admin.role = role
  await admin.save()

  await createAdminActivityLog({
    adminId: admin._id,
    module: 'Admin Management',
    action: 'ROLE_ASSIGNMENT',
    description: `Role ${role} assigned to ${admin.email}`,
    performedBy: req.user?._id
  })

  return res.status(200).json({ message: 'Role assigned successfully' })
})

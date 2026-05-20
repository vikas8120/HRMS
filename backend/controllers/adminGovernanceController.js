import AdminAccessLog from '../models/AdminAccessLog.js'
import AdminActivityLog from '../models/AdminActivityLog.js'
import Role from '../models/Role.js'
import Permission from '../models/Permission.js'
import CompanyAdmin from '../models/CompanyAdmin.js'
import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'
import { createAdminActivityLog } from '../utils/adminAudit.js'
const respond = (res, status, message, payload = {}) => res.status(status).json({ success: status < 400, message, data: payload, ...payload })
const defaultPermissions = [
  { module: 'Admin Management', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { module: 'Company Management', view: true, create: false, edit: false, delete: false, approve: false, export: false },
  { module: 'Support Center', view: true, create: false, edit: false, delete: false, approve: false, export: false }
]
const defaultRoles = [
  { name: 'COMPANY_ADMIN', description: 'Default company admin role', permissions: defaultPermissions },
  { name: 'HR_ADMIN', description: 'Default HR admin role', permissions: defaultPermissions },
  { name: 'OPERATIONS_ADMIN', description: 'Default operations admin role', permissions: defaultPermissions }
]

export const getAdminAccessLogs = asyncHandler(async (_req, res) => {
  const items = await AdminAccessLog.find()
    .populate('admin', 'name email')
    .sort({ dateTime: -1 })
    .limit(300)

  const enriched = await Promise.all(items.map(async (item) => {
    if (item.admin?.name) return item

    if (item.admin) {
      const fallback = await User.findById(item.admin).select('name email')
      if (fallback) {
        return {
          ...item,
          admin: {
            _id: fallback._id,
            name: fallback.name,
            email: fallback.email
          }
        }
      }
    }

    if (item.adminName || item.adminEmail) {
      return {
        ...item,
        admin: {
          _id: null,
          name: item.adminName || 'Admin',
          email: item.adminEmail || ''
        }
      }
    }

    return item
  }))

  return respond(res, 200, 'Admin access logs fetched successfully', { data: enriched, items: enriched })
})

export const getAdminActivityLogs = asyncHandler(async (_req, res) => {
  const items = await AdminActivityLog.find()
    .populate('admin', 'name email')
    .sort({ dateTime: -1 })
    .limit(500)

  const enriched = await Promise.all(items.map(async (item) => {
    if (item.admin?.name) return item

    if (item.admin) {
      const fallback = await User.findById(item.admin).select('name email')
      if (fallback) {
        return {
          ...item,
          admin: {
            _id: fallback._id,
            name: fallback.name,
            email: fallback.email
          }
        }
      }
    }

    if (item.adminName || item.adminEmail) {
      return {
        ...item,
        admin: {
          _id: null,
          name: item.adminName || 'Admin',
          email: item.adminEmail || ''
        }
      }
    }

    return item
  }))

  return respond(res, 200, 'Admin activity logs fetched successfully', { data: enriched, items: enriched })
})

export const getRoles = asyncHandler(async (_req, res) => {
  let items = await Role.find().sort({ name: 1 })
  if (items.length === 0) {
    await Role.insertMany(defaultRoles)
    items = await Role.find().sort({ name: 1 })
  }
  return respond(res, 200, 'Roles fetched successfully', { data: items, items })
})

export const createRole = asyncHandler(async (req, res) => {
  const { name, description = '', permissions = [] } = req.body
  if (!name) return respond(res, 400, 'Role name is required')

  const exists = await Role.findOne({ name: name.trim() })
  if (exists) return respond(res, 400, 'Role already exists')

  const item = await Role.create({ name: name.trim(), description, permissions })
  return respond(res, 201, 'Role created successfully', { data: item, item })
})

export const updateRolePermissions = asyncHandler(async (req, res) => {
  const { permissions = [] } = req.body
  const role = await Role.findById(req.params.id)
  if (!role) return respond(res, 404, 'Role not found')

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

  return respond(res, 200, 'Role permissions updated successfully', { data: role, item: role })
})

export const assignRoleToAdmin = asyncHandler(async (req, res) => {
  const { adminId, role } = req.body
  if (!adminId || !role) return respond(res, 400, 'adminId and role are required')

  const companyAdmin = await CompanyAdmin.findById(adminId)
  if (companyAdmin) {
    companyAdmin.role = role
    await companyAdmin.save()

    await createAdminActivityLog({
      adminId: companyAdmin._id,
      module: 'Admin Management',
      action: 'ROLE_ASSIGNMENT',
      description: `Role ${role} assigned to ${companyAdmin.email}`,
      performedBy: req.user?._id
    })

    return respond(res, 200, 'Role assigned successfully')
  }

  const userAdmin = await User.findOne({ _id: adminId, role: 'admin' })
  if (!userAdmin) return respond(res, 404, 'Admin not found')

  userAdmin.role = role
  await userAdmin.save()

  await createAdminActivityLog({
    adminId: userAdmin._id,
    module: 'Admin Management',
    action: 'ROLE_ASSIGNMENT',
    description: `Role ${role} assigned to ${userAdmin.email}`,
    performedBy: req.user?._id
  })

  return respond(res, 200, 'Role assigned successfully')
})

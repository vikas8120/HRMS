import AdminActivityLog from '../models/AdminActivityLog.js'

export const createAdminActivityLog = async ({ adminId, module, action, description, performedBy }) => {
  if (!adminId) return

  await AdminActivityLog.create({
    admin: adminId,
    module,
    action,
    description,
    performedBy
  })
}

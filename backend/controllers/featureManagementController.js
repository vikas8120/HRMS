import asyncHandler from '../utils/asyncHandler.js'
import SystemSetting from '../models/SystemSetting.js'
import AuditLog from '../models/AuditLog.js'

const FEATURE_GROUP = 'Feature Management'
const FEATURE_KEY = 'feature_flags'

const defaultFlags = {
  moduleEnableDisable: true,
  featureFlags: true,
  betaFeatures: false,
  tenantWiseFeatures: true,
  planWiseFeatures: true,
  apiFeatureAccess: true,
  usageLimits: true,
  mobileAppAccess: true,
  whiteLabelControl: true,
  aiFeatureAccess: true
}

const normalizeFlags = (value) => {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const out = { ...defaultFlags }
  for (const key of Object.keys(defaultFlags)) {
    if (raw[key] !== undefined) out[key] = Boolean(raw[key])
  }
  return out
}

export const getFeatureFlags = asyncHandler(async (_req, res) => {
  let row = await SystemSetting.findOne({ key: FEATURE_KEY })
  if (!row) {
    row = await SystemSetting.create({
      key: FEATURE_KEY,
      group: FEATURE_GROUP,
      value: defaultFlags,
      description: 'Platform feature enablement controls'
    })
  }

  return res.status(200).json({
    success: true,
    message: 'Feature flags fetched successfully',
    data: {
      key: FEATURE_KEY,
      group: FEATURE_GROUP,
      value: normalizeFlags(row.value)
    }
  })
})

export const updateFeatureFlags = asyncHandler(async (req, res) => {
  const flags = normalizeFlags(req.body?.value)
  const row = await SystemSetting.findOneAndUpdate(
    { key: FEATURE_KEY },
    {
      key: FEATURE_KEY,
      group: FEATURE_GROUP,
      value: flags,
      description: 'Platform feature enablement controls'
    },
    { upsert: true, new: true, runValidators: true }
  )

  await AuditLog.create({
    category: 'Configuration Changes',
    actorType: 'super_admin',
    actorName: req.user?.name || req.user?.email || 'Super Admin',
    module: FEATURE_GROUP,
    action: 'UPDATE_FEATURE_FLAGS',
    description: 'Updated feature management flags',
    ipAddress: req.ip || '',
    device: req.get('user-agent') || '',
    metadata: { key: FEATURE_KEY, flags }
  })

  return res.status(200).json({
    success: true,
    message: 'Feature flags saved successfully',
    data: {
      key: FEATURE_KEY,
      group: FEATURE_GROUP,
      value: normalizeFlags(row.value)
    }
  })
})


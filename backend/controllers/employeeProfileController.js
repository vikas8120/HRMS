import bcrypt from 'bcryptjs'
import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/User.js'

const serializeProfile = (user) => ({
  id: user._id,
  employeeId: user.employeeId || '',
  role: user.role || 'employee',
  status: user.status || 'active',
  companyId: user.companyId || null,
  personalInformation: {
    name: user.name || '',
    gender: user.gender || '',
    dateOfBirth: user.dateOfBirth || null,
    profileImage: user.profileImage || user.avatar || ''
  },
  contactInformation: {
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || ''
  },
  jobInformation: {
    designation: user.designation || '',
    departmentId: user.departmentId || null,
    joiningDate: user.joiningDate || null,
    managerId: user.managerId || null
  },
  bankDetails: {
    accountHolderName: user.bankAccountHolderName || '',
    accountNumber: user.bankAccountNumber || '',
    ifscCode: user.bankIfscCode || '',
    bankName: user.bankName || ''
  },
  emergencyContact: {
    name: user.emergencyContactName || '',
    relation: user.emergencyContactRelation || '',
    phone: user.emergencyContactPhone || ''
  }
})

const getEmployeeRow = async (req) => (
  User.findOne({
    _id: req.user.id,
    companyId: req.user.companyId,
    role: 'employee'
  })
)

export const getEmployeeProfile = asyncHandler(async (req, res) => {
  const user = await getEmployeeRow(req)
  if (!user) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  return res.status(200).json({
    success: true,
    message: 'Employee profile fetched successfully',
    data: serializeProfile(user)
  })
})

export const updateEmployeeProfile = asyncHandler(async (req, res) => {
  const user = await getEmployeeRow(req)
  if (!user) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const {
    personalInformation = {},
    contactInformation = {},
    bankDetails = {},
    emergencyContact = {}
  } = req.body || {}

  if (personalInformation.name !== undefined) user.name = String(personalInformation.name || '').trim()
  if (personalInformation.gender !== undefined) user.gender = String(personalInformation.gender || '').trim()
  if (contactInformation.phone !== undefined) user.phone = String(contactInformation.phone || '').trim()
  if (contactInformation.address !== undefined) user.address = String(contactInformation.address || '').trim()

  if (bankDetails.accountHolderName !== undefined) user.bankAccountHolderName = String(bankDetails.accountHolderName || '').trim()
  if (bankDetails.accountNumber !== undefined) user.bankAccountNumber = String(bankDetails.accountNumber || '').trim()
  if (bankDetails.ifscCode !== undefined) user.bankIfscCode = String(bankDetails.ifscCode || '').trim()
  if (bankDetails.bankName !== undefined) user.bankName = String(bankDetails.bankName || '').trim()

  if (emergencyContact.name !== undefined) user.emergencyContactName = String(emergencyContact.name || '').trim()
  if (emergencyContact.relation !== undefined) user.emergencyContactRelation = String(emergencyContact.relation || '').trim()
  if (emergencyContact.phone !== undefined) user.emergencyContactPhone = String(emergencyContact.phone || '').trim()

  if (!String(user.name || '').trim()) {
    return res.status(400).json({ success: false, message: 'Name is required', data: null })
  }

  await user.save()

  return res.status(200).json({
    success: true,
    message: 'Employee profile updated successfully',
    data: serializeProfile(user)
  })
})

export const changeEmployeePassword = asyncHandler(async (req, res) => {
  const user = await getEmployeeRow(req)
  if (!user) return res.status(404).json({ success: false, message: 'Employee profile not found', data: null })

  const { currentPassword = '', newPassword = '', confirmPassword = '' } = req.body || {}

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'currentPassword, newPassword, and confirmPassword are required', data: null })
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'New password and confirm password do not match', data: null })
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ success: false, message: 'New password must be different from current password', data: null })
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long', data: null })
  }
  if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return res.status(400).json({ success: false, message: 'Password must include uppercase, lowercase, and number', data: null })
  }

  const storedPassword = String(user.password || '')
  const passOk = storedPassword.startsWith('$2') ? await bcrypt.compare(currentPassword, storedPassword) : false
  if (!passOk) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect', data: null })
  }

  user.password = await bcrypt.hash(newPassword, 10)
  await user.save()

  return res.status(200).json({ success: true, message: 'Password updated successfully', data: null })
})

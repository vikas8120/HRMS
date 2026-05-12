import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import connectDB from '../config/db.js'
import { getSequelize } from '../config/pgCompat.js'
import TenantCompany from '../models/TenantCompany.js'
import User from '../models/User.js'
import Department from '../models/Department.js'
import Attendance from '../models/Attendance.js'
import Leave from '../models/Leave.js'
import Payroll from '../models/Payroll.js'
import CompanySettings from '../models/CompanySettings.js'

dotenv.config()

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr) => arr[rand(0, arr.length - 1)]
const toDate = (date) => new Date(date).toISOString().slice(0, 10)

const departmentSeeds = [
  { name: 'Engineering', description: 'Product and platform engineering' },
  { name: 'Human Resources', description: 'People operations and talent' },
  { name: 'Finance', description: 'Payroll, compliance, and accounting' },
  { name: 'Sales', description: 'Business growth and client relationships' },
  { name: 'Operations', description: 'Internal operations and execution' }
]

const holidaySeeds = [
  { name: 'New Year', date: '2026-01-01', type: 'public', description: 'New Year holiday' },
  { name: 'Republic Day', date: '2026-01-26', type: 'public', description: 'National holiday' },
  { name: 'Labour Day', date: '2026-05-01', type: 'public', description: 'Labour Day' }
]

const generateEmployeeId = (index) => `EMP-${String(index + 1).padStart(4, '0')}`

const seedCompanyAdminModule = async () => {
  try {
    await connectDB()

    const existingAdmin = await User.findOne({ email: 'admin@demo.com' })
    if (existingAdmin) {
      console.log('Company admin seed already exists (admin@demo.com). No changes made.')
      await getSequelize().close()
      process.exit(0)
    }

    const passwordHash = await bcrypt.hash('Admin@123', 10)
    const defaultUserPassword = await bcrypt.hash('User@123', 10)

    const company = await TenantCompany.create({
      companyName: 'Demo Company Pvt Ltd',
      industry: 'Software',
      email: 'contact@demo-company.com',
      phone: '+91-9000000001',
      address: 'Demo Business Park, Bengaluru',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      plan: 'Growth',
      employeeLimit: 500,
      employees: 39,
      status: 'active'
    })

    const companyId = company._id

    const adminUser = await User.create({
      name: 'Demo Company Admin',
      email: 'admin@demo.com',
      phone: '+91-9000000000',
      password: passwordHash,
      role: 'admin',
      status: 'active',
      companyId
    })

    const departments = await Department.insertMany(
      departmentSeeds.map((dept, index) => ({
        ...dept,
        companyId,
        status: 'active',
        code: `DPT-${String(index + 1).padStart(2, '0')}`
      }))
    )

    const hrUsers = await User.insertMany(
      Array.from({ length: 3 }).map((_, index) => ({
        name: `HR User ${index + 1}`,
        email: `hr${index + 1}@demo.com`,
        phone: `+91-91000000${index + 1}`,
        password: defaultUserPassword,
        role: 'hr',
        status: 'active',
        companyId,
        departmentId: departments[1]?._id || departments[0]?._id || null
      }))
    )

    const managers = await User.insertMany(
      Array.from({ length: 5 }).map((_, index) => {
        const dept = departments[index % departments.length]
        return {
          name: `Manager ${index + 1}`,
          email: `manager${index + 1}@demo.com`,
          phone: `+91-92000000${index + 1}`,
          password: defaultUserPassword,
          role: 'manager',
          status: 'active',
          companyId,
          departmentId: dept?._id || null
        }
      })
    )

    const employees = await User.insertMany(
      Array.from({ length: 30 }).map((_, index) => {
        const dept = departments[index % departments.length]
        const manager = managers[index % managers.length]
        const hr = hrUsers[index % hrUsers.length]
        const joinDate = new Date()
        joinDate.setDate(joinDate.getDate() - rand(10, 240))

        return {
          employeeId: generateEmployeeId(index),
          name: `Employee ${index + 1}`,
          email: `employee${index + 1}@demo.com`,
          phone: `+91-930000${String(index + 1).padStart(4, '0')}`,
          password: defaultUserPassword,
          role: 'employee',
          status: 'active',
          companyId,
          departmentId: dept?._id || null,
          managerId: manager?._id || null,
          hrId: hr?._id || null,
          designation: pick(['Software Engineer', 'Analyst', 'Executive', 'Specialist']),
          salary: rand(30000, 90000),
          joiningDate: joinDate.toISOString(),
          gender: pick(['male', 'female']),
          address: `Demo Address ${index + 1}`
        }
      })
    )

    const attendanceRows = []
    for (const employee of employees) {
      for (let dayOffset = 0; dayOffset < 20; dayOffset += 1) {
        const day = new Date()
        day.setDate(day.getDate() - dayOffset)
        const date = toDate(day)
        const status = pick(['present', 'present', 'present', 'late', 'absent', 'leave'])
        const checkIn = status === 'absent' || status === 'leave' ? null : `${date}T09:${String(rand(0, 45)).padStart(2, '0')}:00.000Z`
        const checkOut = status === 'absent' || status === 'leave' ? null : `${date}T18:${String(rand(0, 30)).padStart(2, '0')}:00.000Z`
        attendanceRows.push({
          companyId,
          employeeId: employee.employeeId || employee._id,
          userId: employee._id,
          date,
          checkIn,
          checkOut,
          workingHours: status === 'absent' || status === 'leave' ? 0 : Number((7.5 + Math.random() * 1.5).toFixed(2)),
          status,
          markedBy: adminUser._id
        })
      }
    }
    await Attendance.insertMany(attendanceRows)

    const leaveRows = Array.from({ length: 20 }).map((_, index) => {
      const employee = employees[index % employees.length]
      const start = new Date()
      start.setDate(start.getDate() - rand(0, 30))
      const totalDays = rand(1, 4)
      const end = new Date(start)
      end.setDate(start.getDate() + (totalDays - 1))
      const status = pick(['pending', 'approved', 'rejected'])
      return {
        companyId,
        employeeId: employee.employeeId || employee._id,
        leaveType: pick(['casual', 'sick', 'earned']),
        startDate: toDate(start),
        endDate: toDate(end),
        totalDays,
        reason: `Leave request ${index + 1}`,
        status,
        approvedBy: status === 'pending' ? null : adminUser._id,
        rejectionReason: status === 'rejected' ? 'Workload overlap' : ''
      }
    })
    await Leave.insertMany(leaveRows)

    const now = new Date()
    const months = [
      { month: String(now.getMonth() + 1).padStart(2, '0'), year: now.getFullYear() },
      { month: String(now.getMonth() === 0 ? 12 : now.getMonth()).padStart(2, '0'), year: now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear() }
    ]

    const payrollRows = []
    for (const employee of employees) {
      for (const m of months) {
        const basicSalary = Number(employee.salary || rand(30000, 90000))
        const hra = Math.round(basicSalary * 0.2)
        const allowances = rand(1500, 6000)
        const bonus = rand(0, 3000)
        const deductions = rand(1000, 5000)
        const tax = Math.round(basicSalary * 0.08)
        const netSalary = basicSalary + hra + allowances + bonus - deductions - tax
        payrollRows.push({
          companyId,
          employeeId: employee.employeeId || employee._id,
          month: m.month,
          year: m.year,
          basicSalary,
          hra,
          allowances,
          bonus,
          deductions,
          tax,
          netSalary,
          status: pick(['generated', 'paid', 'pending']),
          generatedBy: adminUser._id
        })
      }
    }
    await Payroll.insertMany(payrollRows)

    await CompanySettings.create({
      companyId,
      companyProfile: {
        name: 'Demo Company Pvt Ltd',
        email: 'contact@demo-company.com',
        phone: '+91-9000000001',
        address: 'Demo Business Park, Bengaluru',
        website: 'https://demo-company.com'
      },
      officeTiming: {
        startTime: '09:00',
        endTime: '18:00',
        timezone: 'Asia/Kolkata'
      },
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      attendanceRules: {
        workHoursPerDay: 8,
        graceMinutes: 15,
        halfDayHours: 4
      },
      leavePolicy: {
        casual: 12,
        sick: 12,
        earned: 15
      },
      payrollSettings: {
        payDay: 30,
        pfEnabled: true,
        esiEnabled: false
      },
      holidays: holidaySeeds
    })

    console.log('Company Admin module seed completed successfully.')
    console.log('Login email: admin@demo.com')
    console.log('Login password: Admin@123')
    console.log(`Seeded companyId: ${companyId}`)

    await getSequelize().close()
    process.exit(0)
  } catch (error) {
    console.error(`Admin seed error: ${error.message}`)
    try {
      await getSequelize().close()
    } catch (_error) {
      // ignore close errors
    }
    process.exit(1)
  }
}

seedCompanyAdminModule()

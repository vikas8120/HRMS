import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import connectDB from '../config/db.js'
import { getSequelize } from '../config/pgCompat.js'
import SuperAdmin from '../models/SuperAdmin.js'

dotenv.config()

const seedSuperAdmin = async () => {
  try {
    await connectDB()

    const existing = await SuperAdmin.findOne({ email: 'superadmin@hrms.com' })
    if (existing) {
      console.log('Super Admin already exists. No changes made.')
      await getSequelize().close()
      process.exit(0)
    }

    const hashedPassword = await bcrypt.hash('Admin@123', 10)

    await SuperAdmin.create({
      name: 'Super Admin',
      email: 'superadmin@hrms.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      status: 'active'
    })

    console.log('Super Admin seeded successfully.')
    await getSequelize().close()
    process.exit(0)
  } catch (error) {
    console.error(`Seeder error: ${error.message}`)
    try {
      await getSequelize().close()
    } catch (_e) {
      // ignore close errors in seed failure path
    }
    process.exit(1)
  }
}

seedSuperAdmin()

import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import net from 'net'
import path from 'path'
import connectDB from './config/db.js'
import { errorHandler, notFound } from './middleware/errorMiddleware.js'
import superAdminAuthRoutes from './routes/superAdminAuthRoutes.js'
import aiCenterRoutes from './routes/aiCenterRoutes.js'
import superAdminManagementRoutes from './routes/superAdminManagementRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import hrRoutes from './routes/hrRoutes.js'
import managerRoutes from './routes/managerRoutes.js'
import employeeRoutes from './routes/employeeRoutes.js'
import authRoutes from './routes/authRoutes.js'

dotenv.config()

if (!process.env.JWT_SECRET) {
  console.error('Server startup error: JWT_SECRET is missing in backend/.env')
  process.exit(1)
}

if (process.env.JWT_SECRET === 'replace_with_strong_secret' || String(process.env.JWT_SECRET).length < 32) {
  console.error('Server startup error: JWT_SECRET is too weak. Use a strong secret with at least 32 characters.')
  process.exit(1)
}

const app = express()
const PORT = process.env.PORT || 5001

const checkPortInUse = (port) =>
  new Promise((resolve) => {
    const tester = net
      .createServer()
      .once('error', (error) => {
        if (error.code === 'EADDRINUSE') return resolve(true)
        return resolve(false)
      })
      .once('listening', () => {
        tester
          .once('close', () => resolve(false))
          .close()
      })
      .listen(port)
  })

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (curl, server-side requests) with no origin header.
      if (!origin) return callback(null, true)

      const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin)
      const isLoopback = /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
      if (isLocalhost || isLoopback) return callback(null, true)

      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true
  })
)

app.use(express.json())
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')))

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' })
})

app.use('/api/super-admin/auth', superAdminAuthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/super-admin', superAdminManagementRoutes)
app.use('/api/ai-center', aiCenterRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/hr', hrRoutes)
app.use('/api/manager', managerRoutes)
app.use('/api/employee', employeeRoutes)

app.use(notFound)
app.use(errorHandler)

const startServer = async () => {
  const inUse = await checkPortInUse(PORT)
  if (inUse) {
    console.error(`Server startup error: port ${PORT} is already in use.`)
    console.error(`Action: stop the existing process using port ${PORT}, or run with a different port (example: PORT=5002 npm run dev).`)
    process.exit(1)
  }

  await connectDB()
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })

  server.on('error', (error) => {
    if (error?.code === 'EADDRINUSE') {
      console.error(`Server runtime error: port ${PORT} became unavailable.`)
      console.error(`Action: stop the conflicting process or change PORT, then restart backend.`)
      process.exit(1)
    }
    console.error(`Server runtime error: ${error.message}`)
    process.exit(1)
  })
}

startServer().catch((error) => {
  console.error(`Server startup error: ${error.message}`)
  process.exit(1)
})

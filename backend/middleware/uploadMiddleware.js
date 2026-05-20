import fs from 'fs'
import path from 'path'
import multer from 'multer'

const uploadDir = path.resolve(process.cwd(), 'uploads', 'documents')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeOriginal = String(file.originalname || 'document').replace(/[^a-zA-Z0-9_.-]/g, '_')
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeOriginal}`
    cb(null, uniqueName)
  }
})

const allowedMime = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
])

const fileFilter = (_req, file, cb) => {
  if (allowedMime.has(file.mimetype)) return cb(null, true)
  cb(new Error('Unsupported file type. Upload PDF, DOC, DOCX, PNG, JPG, or WEBP.'))
}

const uploadDocumentFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
}).single('file')

export default uploadDocumentFile

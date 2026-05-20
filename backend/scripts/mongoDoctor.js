import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { ensureMongoConnection, getMongoConnectionInfo, getMongoUri } from '../config/pgCompat.js'

dotenv.config()

const run = async () => {
  const uri = getMongoUri()
  if (!uri) {
    throw new Error('Missing MONGO_URI (or MONGODB_URI) in backend/.env')
  }

  await ensureMongoConnection()
  const info = getMongoConnectionInfo()
  const db = mongoose.connection.db

  await db.admin().ping()
  const collections = await db.listCollections({}, { nameOnly: true }).toArray()

  const documentsCollection = collections.find((c) => c.name === 'documents')
  const tenantCompanyCollection = collections.find((c) => c.name === 'tenantcompanies')

  const documentsCount = documentsCollection ? await db.collection('documents').estimatedDocumentCount() : 0
  const tenantCompanyCount = tenantCompanyCollection ? await db.collection('tenantcompanies').estimatedDocumentCount() : 0

  const indexes = documentsCollection ? await db.collection('documents').indexes() : []
  const hasModelDocIdUnique = indexes.some((idx) => idx.unique && idx.key?.model === 1 && idx.key?.docId === 1)

  console.table([
    { check: 'mongo_state', result: info.state, ok: info.readyState === 1 },
    { check: 'documents_collection', result: Boolean(documentsCollection), ok: true },
    { check: 'tenantcompanies_collection', result: Boolean(tenantCompanyCollection), ok: true },
    { check: 'documents_count', result: documentsCount, ok: true },
    { check: 'tenantcompanies_count', result: tenantCompanyCount, ok: true },
    { check: 'documents_model_docId_unique_index', result: hasModelDocIdUnique, ok: hasModelDocIdUnique }
  ])

  if (!hasModelDocIdUnique) {
    throw new Error('Required unique index { model: 1, docId: 1 } is missing on documents collection')
  }

  console.log(`MongoDB doctor passed (${info.label})`)
}

run()
  .then(async () => {
    await mongoose.disconnect()
  })
  .catch(async (error) => {
    console.error(`MongoDB doctor failed:\n${error.message}`)
    try { await mongoose.disconnect() } catch (_e) {}
    process.exit(1)
  })

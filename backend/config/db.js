import { ensureMongoConnection, getDocumentRow, getMongoConnectionInfo } from './pgCompat.js'

const connectDB = async () => {
  await ensureMongoConnection()
  const DocumentRow = getDocumentRow()
  await DocumentRow.sync()

  const info = getMongoConnectionInfo()
  if (info.readyState !== 1) {
    throw new Error(`MongoDB connection is not healthy (state: ${info.state})`)
  }

  console.log(`MongoDB connected successfully (${info.label})`)
}

export default connectDB

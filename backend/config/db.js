import { getDocumentRow, getSequelize } from './pgCompat.js'

const connectDB = async () => {
  const db = getSequelize()
  const DocumentRow = getDocumentRow()
  await db.authenticate()
  await DocumentRow.sync()
  console.log('MongoDB connected successfully')
}

export default connectDB

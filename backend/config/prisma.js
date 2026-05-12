import crypto from 'crypto'
import { getDocumentRow } from './pgCompat.js'

const parseModelFromSql = (sql) => {
  const text = String(sql || '')
  const match = text.match(/where\s+model\s*=\s*'([^']+)'/i)
  return match?.[1] || null
}

const asRawRow = (row) => ({
  row_id: row.rowId,
  model: row.model,
  doc_id: row.docId,
  data: row.data || {},
  created_at: row.createdAt || null,
  updated_at: row.updatedAt || null,
  rowId: row.rowId,
  docId: row.docId,
  createdAt: row.createdAt || null,
  updatedAt: row.updatedAt || null
})

const prisma = {
  async $queryRawUnsafe(sql) {
    const model = parseModelFromSql(sql)
    if (!model) return []
    const rows = await getDocumentRow().findAll({ where: { model } })
    return rows.map(asRawRow)
  },
  document: {
    async create({ data }) {
      const row = await getDocumentRow().upsert({
        rowId: String(data.rowId || crypto.randomUUID()),
        model: String(data.model),
        docId: String(data.docId || crypto.randomUUID().replace(/-/g, '')),
        data: data.data || {},
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
      })
      return asRawRow(row)
    },
    async findFirst({ where = {} } = {}) {
      const row = await getDocumentRow().findOne({
        where: {
          rowId: where.rowId,
          model: where.model,
          docId: where.docId
        }
      })
      return row ? asRawRow(row) : null
    },
    async update({ where = {}, data = {} } = {}) {
      const existing = await getDocumentRow().findOne({ where: { rowId: where.rowId } })
      if (!existing) throw new Error('Record to update not found')

      const row = await getDocumentRow().upsert({
        rowId: existing.rowId,
        model: existing.model,
        docId: existing.docId,
        data: data.data !== undefined ? data.data : existing.data,
        createdAt: existing.createdAt,
        updatedAt: data.updatedAt || new Date().toISOString()
      })

      return asRawRow(row)
    },
    async delete({ where = {} } = {}) {
      const existing = await getDocumentRow().findOne({ where: { rowId: where.rowId } })
      if (!existing) throw new Error('Record to delete does not exist')
      await getDocumentRow().destroy({ where: { rowId: where.rowId } })
      return asRawRow(existing)
    }
  }
}

export default prisma

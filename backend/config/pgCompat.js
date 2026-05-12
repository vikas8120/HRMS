import crypto from 'crypto'
import mongoose from 'mongoose'

let connectionPromise = null
let documentRowModel = null

const refs = new Map()
const Op = { in: '$in' }

const clone = (value) => JSON.parse(JSON.stringify(value))

const getMongoUri = () => process.env.MONGO_URI || process.env.MONGODB_URI

const ensureDb = async () => {
  if (documentRowModel && mongoose.connection.readyState === 1) return

  const mongoUri = getMongoUri()
  if (!mongoUri) {
    throw new Error('MONGO_URI (or MONGODB_URI) is missing in backend/.env')
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    }).catch((error) => {
      connectionPromise = null
      throw error
    })
  }

  await connectionPromise

  if (!documentRowModel) {
    const schema = new mongoose.Schema({
      rowId: { type: String, required: true, unique: true, index: true },
      model: { type: String, required: true, index: true },
      docId: { type: String, required: true, index: true },
      data: { type: mongoose.Schema.Types.Mixed, default: {} }
    }, {
      collection: 'documents',
      timestamps: true,
      versionKey: false
    })

    schema.index({ model: 1, docId: 1 }, { unique: true })

    documentRowModel = mongoose.models.DocumentRow || mongoose.model('DocumentRow', schema)
  }
}

const toRow = (doc) => {
  if (!doc) return null
  return {
    rowId: doc.rowId,
    model: doc.model,
    docId: doc.docId,
    data: clone(doc.data ?? {}),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null
  }
}

const buildFilter = (where = {}) => {
  const filter = {}

  if (where.rowId != null) filter.rowId = String(where.rowId)
  if (where.model != null) filter.model = String(where.model)

  if (where.docId != null) {
    const docIdFilter = where.docId
    if (docIdFilter && typeof docIdFilter === 'object' && docIdFilter[Op.in]) {
      filter.docId = { $in: docIdFilter[Op.in].map(String) }
    } else {
      filter.docId = String(docIdFilter)
    }
  }

  return filter
}

export const getSequelize = () => ({
  async authenticate() {
    await ensureDb()
    await mongoose.connection.db.admin().ping()
    return true
  },
  async close() {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
    }
    connectionPromise = null
    return true
  },
  getDialect() {
    return 'mongodb'
  }
})

export const getDocumentRow = () => ({
  async sync() {
    await ensureDb()
    await documentRowModel.syncIndexes()
    return true
  },
  async upsert(payload) {
    await ensureDb()

    const model = String(payload.model)
    const docId = String(payload.docId)
    const rowId = String(payload.rowId || crypto.randomUUID())

    const filter = payload.rowId
      ? { rowId }
      : { model, docId }

    const now = new Date()
    const update = {
      $set: {
        model,
        docId,
        data: clone(payload.data ?? {}),
        updatedAt: payload.updatedAt ? new Date(payload.updatedAt) : now
      },
      $setOnInsert: {
        rowId,
        createdAt: payload.createdAt ? new Date(payload.createdAt) : now
      }
    }

    const doc = await documentRowModel.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true
    }).lean()

    return toRow(doc)
  },
  async findAll({ where = {} } = {}) {
    await ensureDb()
    const docs = await documentRowModel.find(buildFilter(where)).lean()
    return docs.map((doc) => toRow(doc))
  },
  async findOne({ where = {} } = {}) {
    await ensureDb()
    const doc = await documentRowModel.findOne(buildFilter(where)).lean()
    return toRow(doc)
  },
  async destroy({ where = {} } = {}) {
    await ensureDb()
    const result = await documentRowModel.deleteMany(buildFilter(where))
    return result.deletedCount || 0
  }
})

const genId = () => crypto.randomUUID().replace(/-/g, '')

const readPath = (obj, path) => path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj)

const testCondition = (value, condition) => {
  if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
    if ('$regex' in condition) {
      const flags = condition.$options || ''
      const re = new RegExp(condition.$regex, flags)
      return re.test(String(value ?? ''))
    }
    if ('$in' in condition) {
      if (Array.isArray(value)) {
        return value.some((item) => condition.$in.map(String).includes(String(item)))
      }
      return condition.$in.map(String).includes(String(value))
    }
    if ('$ne' in condition) return String(value) !== String(condition.$ne)
    if ('$gte' in condition && !(value >= condition.$gte)) return false
    if ('$lte' in condition && !(value <= condition.$lte)) return false
    return Object.entries(condition).every(([k, v]) => testCondition(value?.[k], v))
  }
  return String(value) === String(condition)
}

const matches = (doc, query = {}) => {
  if (!query || Object.keys(query).length === 0) return true
  if (query.$or && !query.$or.some((part) => matches(doc, part))) return false

  return Object.entries(query).every(([key, condition]) => {
    if (key === '$or') return true
    return testCondition(readPath(doc, key), condition)
  })
}

const projectFields = (doc, select) => {
  if (!select) return doc

  const fields = String(select).trim().split(/\s+/).filter(Boolean)
  if (!fields.length) return doc

  const include = fields.filter((f) => !f.startsWith('-'))
  const exclude = fields.filter((f) => f.startsWith('-')).map((f) => f.slice(1))

  let out = { ...doc }
  if (include.length) {
    out = include.reduce((acc, key) => {
      if (key in doc) acc[key] = doc[key]
      return acc
    }, {})
    if ('_id' in doc) out._id = doc._id
  }

  for (const key of exclude) delete out[key]
  return out
}

const sanitizeForStorage = (obj) => {
  const out = {}
  for (const [key, value] of Object.entries(obj)) {
    if (key === '__model') continue
    if (typeof value !== 'function') out[key] = value
  }
  return out
}

const makeDoc = (modelName, raw, defaults = null, virtuals = null) => {
  const doc = { ...raw }
  doc._id = String(doc._id)

  if (defaults) {
    const def = defaults()
    for (const [k, v] of Object.entries(def)) {
      if (doc[k] === undefined) doc[k] = v
    }
  }

  Object.defineProperty(doc, '__model', { value: modelName, enumerable: false, writable: true })
  Object.defineProperty(doc, 'save', {
    enumerable: false,
    value: async function save() {
      const now = new Date().toISOString()
      this.updatedAt = now
      if (!this.createdAt) this.createdAt = now
      await getDocumentRow().upsert({
        model: modelName,
        docId: String(this._id),
        data: sanitizeForStorage(this)
      })
      return this
    }
  })
  Object.defineProperty(doc, 'toObject', {
    enumerable: false,
    value: function toObject() {
      return sanitizeForStorage(this)
    }
  })

  if (virtuals?.nameFromCompanyName) {
    Object.defineProperty(doc, 'name', {
      enumerable: true,
      get() {
        return this.companyName
      }
    })
  }

  return doc
}

class Query {
  constructor(executor) {
    this.executor = executor
    this._sort = null
    this._skip = 0
    this._limit = null
    this._populate = []
    this._select = null
  }

  sort(sortObj) { this._sort = sortObj; return this }
  skip(n) { this._skip = Number(n) || 0; return this }
  limit(n) { this._limit = Number(n); return this }

  populate(path, select = '') {
    const parts = String(path).trim().split(/\s+/).filter(Boolean)
    for (const p of parts) this._populate.push({ path: p, select })
    return this
  }

  select(value) { this._select = value; return this }

  async _applyPopulate(doc) {
    if (!doc || this._populate.length === 0) return doc

    for (const pop of this._populate) {
      const refModel = refs.get(`${doc.__model}:${pop.path}`)
      if (!refModel) continue

      const current = doc[pop.path]
      if (current == null) continue

      if (Array.isArray(current)) {
        const rows = await getDocumentRow().findAll({
          where: {
            model: refModel,
            docId: { [Op.in]: current.map(String) }
          }
        })

        const mapped = rows.map((row) => projectFields({ _id: row.docId, ...row.data }, pop.select))
        doc[pop.path] = current
          .map((id) => mapped.find((m) => String(m._id) === String(id)))
          .filter(Boolean)
      } else {
        const row = await getDocumentRow().findOne({ where: { model: refModel, docId: String(current) } })
        doc[pop.path] = row ? projectFields({ _id: row.docId, ...row.data }, pop.select) : null
      }
    }

    return doc
  }

  async exec() {
    let result = await this.executor()
    const isArray = Array.isArray(result)

    if (!isArray && result == null) return result

    const applyOne = async (doc) => {
      await this._applyPopulate(doc)
      return projectFields(doc, this._select)
    }

    if (isArray) {
      let list = [...result]

      if (this._sort && Object.keys(this._sort).length) {
        const [field, dir] = Object.entries(this._sort)[0]
        list.sort((a, b) => {
          const av = readPath(a, field)
          const bv = readPath(b, field)
          if (av == null && bv == null) return 0
          if (av == null) return 1
          if (bv == null) return -1
          if (av > bv) return dir >= 0 ? 1 : -1
          if (av < bv) return dir >= 0 ? -1 : 1
          return 0
        })
      }

      if (this._skip) list = list.slice(this._skip)
      if (Number.isFinite(this._limit)) list = list.slice(0, this._limit)

      return Promise.all(list.map((doc) => applyOne(doc)))
    }

    return applyOne(result)
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject)
  }
}

export const createCompatModel = (modelName, options = {}) => {
  const { defaults, refs: refMap, virtuals } = options

  if (refMap) {
    for (const [field, refModel] of Object.entries(refMap)) {
      refs.set(`${modelName}:${field}`, refModel)
    }
  }

  return class CompatModel {
    static _doc(raw) {
      return makeDoc(modelName, raw, defaults, virtuals)
    }

    static find(query = {}) {
      return new Query(async () => {
        const rows = await getDocumentRow().findAll({ where: { model: modelName } })
        return rows.map((r) => this._doc({ _id: r.docId, ...r.data })).filter((doc) => matches(doc, query))
      })
    }

    static findOne(query = {}) {
      return new Query(async () => {
        const rows = await getDocumentRow().findAll({ where: { model: modelName } })
        return rows.map((r) => this._doc({ _id: r.docId, ...r.data })).find((doc) => matches(doc, query)) || null
      })
    }

    static findById(id) {
      return new Query(async () => {
        const row = await getDocumentRow().findOne({ where: { model: modelName, docId: String(id) } })
        return row ? this._doc({ _id: row.docId, ...row.data }) : null
      })
    }

    static async create(payload = {}) {
      const now = new Date().toISOString()
      const docId = String(payload._id || genId())
      const doc = this._doc({
        ...payload,
        _id: docId,
        createdAt: payload.createdAt || now,
        updatedAt: payload.updatedAt || now
      })
      await getDocumentRow().upsert({ model: modelName, docId, data: sanitizeForStorage(doc) })
      return doc
    }

    static async insertMany(items = []) {
      const output = []
      for (const item of items) output.push(await this.create(item))
      return output
    }

    static findByIdAndUpdate(id, update = {}, opts = {}) {
      return new Query(async () => {
        const doc = await this.findById(id)
        if (!doc) return null
        Object.assign(doc, update)
        doc.updatedAt = new Date().toISOString()
        await doc.save()
        return opts.new ? doc : null
      })
    }

    static findOneAndUpdate(query = {}, update = {}, opts = {}) {
      return new Query(async () => {
        const doc = await this.findOne(query)
        if (doc) {
          Object.assign(doc, update)
          doc.updatedAt = new Date().toISOString()
          await doc.save()
          return opts.new ? doc : null
        }

        if (opts.upsert) {
          return this.create({ ...query, ...update })
        }

        return null
      })
    }

    static async countDocuments(query = {}) {
      const items = await this.find(query)
      return items.length
    }

    static async deleteOne(query = {}) {
      const doc = await this.findOne(query)
      if (!doc) return { deletedCount: 0 }
      await getDocumentRow().destroy({ where: { model: modelName, docId: String(doc._id) } })
      return { deletedCount: 1 }
    }
  }
}

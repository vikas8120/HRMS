const DEFAULT_DATE_FORMAT = 'DD-MM-YYYY'
const STORAGE_KEY = 'hrms_date_format'

const pad = (value) => String(value).padStart(2, '0')

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime())

export const getDateFormat = () => localStorage.getItem(STORAGE_KEY) || DEFAULT_DATE_FORMAT

export const setDateFormat = (format) => {
  const safe = String(format || '').trim() || DEFAULT_DATE_FORMAT
  localStorage.setItem(STORAGE_KEY, safe)
}

export const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (!isValidDate(date)) return '-'

  const format = getDateFormat()
  const dd = pad(date.getDate())
  const mm = pad(date.getMonth() + 1)
  const yyyy = String(date.getFullYear())

  return format
    .replace('DD', dd)
    .replace('MM', mm)
    .replace('YYYY', yyyy)
}

export const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (!isValidDate(date)) return '-'

  const datePart = formatDate(value)
  const hh = pad(date.getHours())
  const min = pad(date.getMinutes())
  const ss = pad(date.getSeconds())
  return `${datePart}, ${hh}:${min}:${ss}`
}


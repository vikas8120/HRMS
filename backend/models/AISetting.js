import { createCompatModel } from '../config/pgCompat.js'

const AISetting = createCompatModel('AISetting', { defaults: () => ({ value: null, description: '' }) })

export default AISetting

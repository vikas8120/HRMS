import jwt from 'jsonwebtoken'

const generateToken = (payload, options = {}) => {
  const expiresIn = options.expiresIn || process.env.JWT_EXPIRES_IN || '1d'
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn
  })
}

export default generateToken

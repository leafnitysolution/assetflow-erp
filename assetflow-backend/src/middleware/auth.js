const jwt = require('jsonwebtoken')
const Users = require('../db/users')

const protect = async (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized — no token' })
  }

  const token = header.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await Users.findById(decoded.id)
    if (!req.user) return res.status(401).json({ message: 'User not found' })
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

const requireRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Access denied — requires: ${roles.join(', ')}` })
  }
  next()
}

module.exports = { protect, requireRoles }

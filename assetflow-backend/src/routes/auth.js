const router = require('express').Router()
const jwt = require('jsonwebtoken')
const Users = require('../db/users')
const Logs = require('../db/logs')
const { protect } = require('../middleware/auth')
const { createLog } = require('../middleware/logger')

function normalizeIp(req) {
  const raw = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
  return raw === '::1' ? '127.0.0.1' : raw.replace(/^::ffff:/, '')
}

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' })

    // Fetch with password hash for comparison
    const userRow = await Users.findByEmail(email, { withPassword: true })
    const isValid = userRow && await Users.comparePassword(userRow, password)

    if (!isValid) {
      const ip = normalizeIp(req)
      await Logs.create({ userName: email, userRole: 'unknown', action: 'LOGIN_FAIL', entityType: 'auth', entityName: email, details: `Failed login from ${ip}`, ipAddress: ip })
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (userRow.status !== 'active')
      return res.status(403).json({ message: 'Account is inactive. Contact your admin.' })

    // Update last_login
    await Users.update(userRow.id, { lastLogin: new Date().toISOString() })

    const user = Users.mapUser(userRow)
    const ip = normalizeIp(req)
    await createLog({ req: { user, headers: req.headers, socket: req.socket }, action: 'LOGIN', entityType: 'auth', entityName: user.email, details: `Logged in from ${ip}` })

    res.json({ token: signToken(user.id), user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json(req.user))

// PUT /api/auth/me
router.put('/me', protect, async (req, res) => {
  try {
    const allowedFields = ['name', 'email', 'phone', 'avatar']
    const updates = {}
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field]
    }
    const user = await Users.update(req.user.id, updates)
    if (!user) return res.status(404).json({ message: 'User not found' })
    await createLog({ req, action: 'UPDATE', entityType: 'user', entityId: user.id, entityName: user.name, details: `Profile updated: ${Object.keys(updates).join(', ')}` })
    res.json(user)
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Email already exists' })
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })
    const user = await Users.findByEmail(email)
    if (user) {
      await createLog({ req: { user, headers: req.headers, socket: req.socket }, action: 'UPDATE', entityType: 'auth', entityName: user.email, details: 'Password reset requested' })
    }
    res.json({ message: 'If an account exists, password reset instructions will be sent.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/change-password
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' })
    }
    const userRow = await Users.findByEmail(req.user.email, { withPassword: true })
    if (!(await Users.comparePassword(userRow, currentPassword)))
      return res.status(400).json({ message: 'Current password is incorrect' })
    await Users.updatePassword(req.user.id, newPassword)
    await createLog({ req, action: 'UPDATE', entityType: 'auth', entityName: req.user.email, details: 'Password changed' })
    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

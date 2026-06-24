const router = require('express').Router()
const crypto = require('crypto')
const Users = require('../db/users')
const { protect, requireRoles } = require('../middleware/auth')
const { createLog } = require('../middleware/logger')

function canAdminManageUser(actor, target) {
  return actor.role === 'super-admin' || target.role === 'member'
}

// GET /api/users — admin/super-admin only
router.get('/', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    const excludeRole = req.user.role === 'super-admin' ? undefined : 'super-admin'
    const users = await Users.list({ excludeRole })
    res.json(users)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/users/directory — all authenticated users (minimal profile data)
router.get('/directory', protect, async (req, res) => {
  try {
    res.json(await Users.listDirectory())
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/users/:id
router.get('/:id', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    const user = await Users.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (!canAdminManageUser(req.user, user)) return res.status(403).json({ message: 'Access denied' })
    res.json(user)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/users
router.post('/', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    const { password: suppliedPassword, ...rest } = req.body
    if (req.user.role === 'admin' && rest.role && rest.role !== 'member') {
      return res.status(403).json({ message: 'Admins can only create member accounts' })
    }
    if (req.user.role === 'admin') rest.role = 'member'
    const temporaryPassword = suppliedPassword || crypto.randomBytes(18).toString('base64url')
    if (temporaryPassword.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' })
    const user = await Users.create({ password: temporaryPassword, ...rest })
    await createLog({ req, action: 'CREATE', entityType: 'user', entityId: user.id, entityName: user.name, details: `Role: ${user.role}, Email: ${user.email}` })
    const payload = { ...user }
    if (!suppliedPassword) payload.temporaryPassword = temporaryPassword
    res.status(201).json(payload)
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Email already exists' })
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/users/:id
router.put('/:id', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    const { password, ...rest } = req.body // password changes not allowed here
    const existing = await Users.findById(req.params.id)
    if (!existing) return res.status(404).json({ message: 'User not found' })
    if (!canAdminManageUser(req.user, existing)) return res.status(403).json({ message: 'Access denied' })
    if (req.user.role === 'admin' && rest.role && rest.role !== 'member') {
      return res.status(403).json({ message: 'Admins cannot elevate user roles' })
    }
    if (req.user.role === 'admin') rest.role = 'member'
    const user = await Users.update(req.params.id, rest)
    await createLog({ req, action: 'UPDATE', entityType: 'user', entityId: user.id, entityName: user.name, details: `Updated: ${Object.keys(rest).join(', ')}` })
    res.json(user)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/users/:id
router.delete('/:id', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    const user = await Users.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (!canAdminManageUser(req.user, user)) return res.status(403).json({ message: 'Access denied' })
    await Users.remove(req.params.id)
    await createLog({ req, action: 'DELETE', entityType: 'user', entityId: req.params.id, entityName: user.name, details: user.email })
    res.json({ message: 'User deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/users/:id/toggle-status
router.patch('/:id/toggle-status', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    const existing = await Users.findById(req.params.id)
    if (!existing) return res.status(404).json({ message: 'User not found' })
    if (!canAdminManageUser(req.user, existing)) return res.status(403).json({ message: 'Access denied' })
    const user = await Users.toggleStatus(req.params.id)
    await createLog({ req, action: 'UPDATE', entityType: 'user', entityId: user.id, entityName: user.name, details: `Status set to ${user.status}` })
    res.json(user)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router

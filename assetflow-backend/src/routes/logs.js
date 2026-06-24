const router = require('express').Router()
const Logs = require('../db/logs')
const { protect, requireRoles } = require('../middleware/auth')

// GET /api/logs/dashboard-summary
router.get('/dashboard-summary', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    res.json(await Logs.dashboardSummary())
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/logs
router.get('/', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    const { action, entityType, search, userId, limit } = req.query
    const logs = await Logs.list({ action, entityType, search, userId, limit })
    res.json(logs)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

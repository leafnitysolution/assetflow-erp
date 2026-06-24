const router = require('express').Router()
const AssetHistory = require('../db/assetHistory')
const Assets = require('../db/assets')
const { protect, requireRoles } = require('../middleware/auth')

// GET /api/asset-history/:assetId — full history for one asset
router.get('/:assetId', protect, async (req, res) => {
  try {
    if (req.user.role === 'member') {
      const asset = await Assets.findById(req.params.assetId)
      if (!asset) return res.status(404).json({ message: 'Asset not found' })
      if (String(asset.assignedTo || '') !== String(req.user.id)) {
        return res.status(403).json({ message: 'Access denied' })
      }
    }
    const history = await AssetHistory.findByAsset(req.params.assetId)
    const totalRepairCost = history
      .filter(h => h.event === 'REPAIR')
      .reduce((sum, h) => sum + (h.repairDetails?.cost || 0), 0)
    res.json({ history, totalRepairCost })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/asset-history/user/:userId — all assets ever assigned to a user
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const isOwnHistory = String(req.params.userId) === String(req.user.id)
    if (req.user.role === 'member' && !isOwnHistory) {
      return res.status(403).json({ message: 'Access denied' })
    }
    if (req.user.role !== 'member' && !['admin', 'super-admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }
    const history = await AssetHistory.findByUser(req.params.userId, { eventsFilter: ['ASSIGNED', 'RETURNED'] })
    res.json(history)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/asset-history/:assetId/repair — log a repair/cost entry
router.post('/:assetId/repair', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    const asset = await Assets.findById(req.params.assetId)
    if (!asset) return res.status(404).json({ message: 'Asset not found' })
    const entry = await AssetHistory.create({
      assetId:   req.params.assetId,
      assetName: asset.name,
      event:     'REPAIR',
      performedBy: req.user.name,
      repairDetails: {
        description: req.body.description,
        cost:        req.body.cost || 0,
        vendor:      req.body.vendor,
        date:        req.body.date || new Date().toISOString(),
        recordedBy:  req.user.name,
      },
      notes: req.body.notes,
    })
    res.status(201).json(entry)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router

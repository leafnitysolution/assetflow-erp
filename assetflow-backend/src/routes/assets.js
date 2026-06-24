const router = require('express').Router()
const Assets = require('../db/assets')
const AssetHistory = require('../db/assetHistory')
const Users = require('../db/users')
const { protect, requireRoles } = require('../middleware/auth')
const { createLog } = require('../middleware/logger')

// GET /api/assets
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'member' ? { assignedTo: req.user.id } : {}
    res.json(await Assets.list(filter))
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/assets/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const asset = await Assets.findById(req.params.id)
    if (!asset) return res.status(404).json({ message: 'Asset not found' })
    if (req.user.role === 'member' && String(asset.assignedTo || '') !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' })
    }
    res.json(asset)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/assets
router.post('/', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    const asset = await Assets.create(req.body)
    await createLog({ req, action: 'CREATE', entityType: 'asset', entityId: asset.id, entityName: asset.name, details: `Category: ${asset.category}` })
    res.status(201).json(asset)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/assets/:id
router.put('/:id', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    const asset = await Assets.update(req.params.id, req.body)
    if (!asset) return res.status(404).json({ message: 'Asset not found' })
    await createLog({ req, action: 'UPDATE', entityType: 'asset', entityId: asset.id, entityName: asset.name, details: `Updated fields: ${Object.keys(req.body).join(', ')}` })
    res.json(asset)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/assets/:id
router.delete('/:id', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    const asset = await Assets.remove(req.params.id)
    if (!asset) return res.status(404).json({ message: 'Asset not found' })
    await createLog({ req, action: 'DELETE', entityType: 'asset', entityId: req.params.id, entityName: asset.name })
    res.json({ message: 'Asset deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/assets/:id/assign
router.post('/:id/assign', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    const { userId } = req.body
    const asset = await Assets.assign(req.params.id, { userId, status: 'assigned' })
    if (!asset) return res.status(404).json({ message: 'Asset not found' })
    const assignedUser = await Users.findById(userId)
    await AssetHistory.create({
      assetId: asset.id, assetName: asset.name, event: 'ASSIGNED',
      userId, userName: assignedUser?.name, userEmail: assignedUser?.email,
      fromStatus: 'available', toStatus: 'assigned', performedBy: req.user.name,
    })
    await createLog({ req, action: 'ASSIGN', entityType: 'asset', entityId: asset.id, entityName: asset.name, details: `Assigned to ${assignedUser?.name || userId}` })
    res.json(asset)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/assets/:id/return
router.post('/:id/return', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    const asset = await Assets.returnAsset(req.params.id)
    if (!asset) return res.status(404).json({ message: 'Asset not found' })
    await AssetHistory.create({
      assetId: asset.id, assetName: asset.name, event: 'RETURNED',
      performedBy: req.user.name, fromStatus: 'assigned', toStatus: 'available',
    })
    await createLog({ req, action: 'RETURN', entityType: 'asset', entityId: asset.id, entityName: asset.name, details: 'Asset returned' })
    res.json(asset)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router

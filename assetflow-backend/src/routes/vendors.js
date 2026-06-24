const router = require('express').Router()
const Vendors = require('../db/vendors')
const { protect, requireRoles } = require('../middleware/auth')

router.get('/', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    res.json(await Vendors.list())
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    res.status(201).json(await Vendors.create(req.body))
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.put('/:id', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    const vendor = await Vendors.update(req.params.id, req.body)
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' })
    res.json(vendor)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.delete('/:id', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    const vendor = await Vendors.remove(req.params.id)
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' })
    res.json({ message: 'Vendor deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router

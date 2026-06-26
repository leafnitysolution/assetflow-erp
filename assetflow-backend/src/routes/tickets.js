const router = require('express').Router()
const Tickets = require('../db/tickets')
const { protect, requireRoles } = require('../middleware/auth')
const { createLog } = require('../middleware/logger')

// GET /api/tickets
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'member'
      ? { createdBy: req.user.id, assignedTo: req.user.id }
      : {}
    res.json(await Tickets.list(filter))
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/tickets/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const ticket = await Tickets.findById(req.params.id)
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
    
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super-admin'
    const isOwner = String(ticket.createdBy) === String(req.user.id)
    const isAssignee = ticket.assignedTo && String(ticket.assignedTo) === String(req.user.id)

    if (!isAdmin && !isOwner && !isAssignee) {
      return res.status(403).json({ message: 'Access denied' })
    }
    res.json(ticket)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/tickets
router.post('/', protect, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super-admin'
    const ticket = await Tickets.create({
      ...req.body,
      createdBy:     isAdmin && req.body.createdBy     ? req.body.createdBy     : req.user.id,
      createdByName: isAdmin && req.body.createdByName ? req.body.createdByName : req.user.name,
    })
    await createLog({ req, action: 'CREATE', entityType: 'ticket', entityId: ticket.id, entityName: ticket.title, details: `${ticket.ticketNumber} — Priority: ${ticket.priority}` })
    res.status(201).json(ticket)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/tickets/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const ticket = await Tickets.findById(req.params.id)
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super-admin'
    const isAssignee = ticket.assignedTo && String(ticket.assignedTo) === String(req.user.id)

    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Assignee (technician) can only update status-related fields
    let updateFields = req.body
    if (!isAdmin) {
      updateFields = {}
      if (req.body.status !== undefined) updateFields.status = req.body.status
      if (req.body.resolvedAt !== undefined) updateFields.resolvedAt = req.body.resolvedAt
    }

    const updated = await Tickets.update(req.params.id, updateFields)
    await createLog({ req, action: 'UPDATE', entityType: 'ticket', entityId: updated.id, entityName: updated.title, details: `Updated: ${Object.keys(updateFields).join(', ')}` })
    res.json(updated)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/tickets/:id
router.delete('/:id', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    const ticket = await Tickets.remove(req.params.id)
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
    await createLog({ req, action: 'DELETE', entityType: 'ticket', entityId: req.params.id, entityName: ticket.title })
    res.json({ message: 'Ticket deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/tickets/:id/assign
router.post('/:id/assign', protect, requireRoles('admin', 'super-admin'), async (req, res) => {
  try {
    const { userId, userName } = req.body
    const ticket = await Tickets.assign(req.params.id, { userId, userName })
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
    await createLog({ req, action: 'ASSIGN', entityType: 'ticket', entityId: ticket.id, entityName: ticket.title, details: `Assigned to ${userName}` })
    res.json(ticket)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/tickets/:id/resolve
router.post('/:id/resolve', protect, async (req, res) => {
  try {
    const ticket = await Tickets.findById(req.params.id)
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super-admin'
    const isAssignee = ticket.assignedTo && String(ticket.assignedTo) === String(req.user.id)

    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const resolved = await Tickets.resolve(req.params.id)
    await createLog({ req, action: 'RESOLVE', entityType: 'ticket', entityId: resolved.id, entityName: resolved.title })
    res.json(resolved)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/tickets/:id/comments
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const ticket = await Tickets.findById(req.params.id)
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super-admin'
    const isOwner = String(ticket.createdBy) === String(req.user.id)
    const isAssignee = ticket.assignedTo && String(ticket.assignedTo) === String(req.user.id)

    if (!isAdmin && !isOwner && !isAssignee) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const updated = await Tickets.addComment(req.params.id, {
      userId: req.user.id, userName: req.user.name, content: req.body.content,
    })
    await createLog({ req, action: 'COMMENT', entityType: 'ticket', entityId: ticket.id, entityName: ticket.title, details: req.body.content?.slice(0, 80) })
    res.json(updated)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router

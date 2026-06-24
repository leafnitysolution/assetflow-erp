const Logs = require('../db/logs')

/**
 * createLog({ req, action, entityType, entityId, entityName, details })
 * Call this inside any route handler to persist an audit entry.
 */
async function createLog({ req, action, entityType, entityId, entityName, details }) {
  try {
    const rawIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
    const ip = rawIp === '::1' ? '127.0.0.1' : rawIp.replace(/^::ffff:/, '')
    await Logs.create({
      userId:     req.user?.id,
      userName:   req.user?.name  || 'System',
      userRole:   req.user?.role  || 'system',
      action,
      entityType,
      entityId:   entityId   ? String(entityId)   : undefined,
      entityName: entityName ? String(entityName) : undefined,
      details:    details    ? String(details)    : undefined,
      ipAddress:  ip,
    })
  } catch (err) {
    console.error('Log write failed:', err.message)
  }
}

module.exports = { createLog }

function sanitizeValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (!value || typeof value !== 'object') return value

  const clean = {}
  for (const [key, childValue] of Object.entries(value)) {
    if (key.startsWith('$') || key.includes('.')) continue
    clean[key] = sanitizeValue(childValue)
  }
  return clean
}

function sanitizeRequest(req, _res, next) {
  if (req.body) req.body = sanitizeValue(req.body)
  if (req.query) req.query = sanitizeValue(req.query)
  if (req.params) req.params = sanitizeValue(req.params)
  next()
}

module.exports = { sanitizeRequest }

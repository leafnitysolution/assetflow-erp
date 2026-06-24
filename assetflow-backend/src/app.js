const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const assetRoutes = require('./routes/assets')
const ticketRoutes = require('./routes/tickets')
const vendorRoutes = require('./routes/vendors')
const logRoutes = require('./routes/logs')
const assetHistoryRoutes = require('./routes/assetHistory')
const { sanitizeRequest } = require('./middleware/sanitize')

const app = express()

function normalizeOrigin(origin) {
  try {
    const url = new URL(origin)
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`
  } catch {
    return origin
  }
}

function isAllowedLocalOrigin(origin) {
  try {
    const { protocol, hostname } = new URL(origin)
    if (!['http:', 'https:'].includes(protocol)) return false
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1'
  } catch {
    return false
  }
}

function getConfiguredOrigins() {
  return String(process.env.CLIENT_URL || '')
    .split(',')
    .map((value) => normalizeOrigin(value.trim()))
    .filter(Boolean)
}

if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1)

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX || 1000),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Try again later.' },
})

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({
  origin: (origin, cb) => {
    const normalizedOrigin = origin ? normalizeOrigin(origin) : ''
    const configuredOrigins = getConfiguredOrigins()
    const isConfigured = normalizedOrigin && configuredOrigins.includes(normalizedOrigin)

    if (!origin || isConfigured) {
      return cb(null, true)
    }

    if (process.env.NODE_ENV !== 'production' && isAllowedLocalOrigin(origin)) {
      return cb(null, true)
    }

    cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }))
app.use(hpp())
app.use(sanitizeRequest)
app.use('/api', apiLimiter)

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/assets', assetRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/vendors', vendorRoutes)
app.use('/api/logs', logRoutes)
app.use('/api/asset-history', assetHistoryRoutes)

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

app.use((err, _req, res, _next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: err.message })
  }
  console.error(err.stack)
  res.status(500).json({ message: err.message || 'Internal server error' })
})

module.exports = app

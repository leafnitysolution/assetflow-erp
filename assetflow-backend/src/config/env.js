const DEFAULT_SECRET = 'your_super_secret_jwt_key_change_this_in_production'

function validateEnv() {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET']
  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.CLIENT_URL) {
      throw new Error('CLIENT_URL is required in production')
    }
    if (process.env.JWT_SECRET === DEFAULT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be changed and at least 32 characters in production')
    }
    if (
      process.env.SUPABASE_URL.includes('localhost') ||
      process.env.SUPABASE_URL.includes('127.0.0.1')
    ) {
      throw new Error('Production SUPABASE_URL must not point to localhost')
    }
  }
}

module.exports = { validateEnv }

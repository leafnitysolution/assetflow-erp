require('dotenv').config()
const app = require('./app')
const supabase = require('./config/supabase')
const { validateEnv } = require('./config/env')

const PORT = process.env.PORT || 3001

try {
  validateEnv()
} catch (err) {
  console.error(`❌ Configuration error: ${err.message}`)
  process.exit(1)
}

// Verify Supabase connectivity, then start the server
async function start() {
  try {
    const { error } = await supabase.from('users').select('id').limit(1)
    if (error) throw error
    console.log('✅ Supabase connected')
  } catch (err) {
    console.error('❌ Supabase connection failed:', err.message)
    process.exit(1)
  }

  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
}

start()

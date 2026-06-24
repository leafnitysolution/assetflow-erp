const supabase = require('../config/supabase')

function mapLog(row) {
  if (!row) return null
  return {
    id:         row.id,
    userId:     row.user_id,
    userName:   row.user_name,
    userRole:   row.user_role,
    action:     row.action,
    entityType: row.entity_type,
    entityId:   row.entity_id,
    entityName: row.entity_name,
    details:    row.details,
    ipAddress:  row.ip_address,
    createdAt:  row.created_at,
  }
}

async function create({ userId, userName, userRole, action, entityType, entityId, entityName, details, ipAddress }) {
  const { error } = await supabase.from('audit_logs').insert([{
    user_id:     userId     || null,
    user_name:   userName   || 'System',
    user_role:   userRole   || 'system',
    action,
    entity_type: entityType,
    entity_id:   entityId   ? String(entityId)   : null,
    entity_name: entityName ? String(entityName) : null,
    details:     details    ? String(details)    : null,
    ip_address:  ipAddress  || null,
  }])
  if (error) throw error
}

async function list({ action, entityType, search, userId, limit = 200 } = {}) {
  let q = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(Number(limit))
  if (action     && action     !== 'all') q = q.eq('action',      action)
  if (entityType && entityType !== 'all') q = q.eq('entity_type', entityType)
  if (userId)  q = q.eq('user_id', userId)
  if (search) {
    // Postgres ilike or textSearch — use .or() for multi-column
    q = q.or(`user_name.ilike.%${search}%,entity_name.ilike.%${search}%,details.ilike.%${search}%,action.ilike.%${search}%`)
  }
  const { data, error } = await q
  if (error) throw error
  return (data || []).map(mapLog)
}

async function dashboardSummary() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Recent activity (last 10 non-fail actions)
  const { data: recentRows, error: recentErr } = await supabase
    .from('audit_logs')
    .select('user_name, user_role, action, entity_type, entity_name, created_at')
    .neq('action', 'LOGIN_FAIL')
    .order('created_at', { ascending: false })
    .limit(10)
  if (recentErr) throw recentErr

  // Failed logins in last 24h grouped by IP
  const { data: failRows, error: failErr } = await supabase
    .from('audit_logs')
    .select('ip_address, entity_name, created_at')
    .eq('action', 'LOGIN_FAIL')
    .gte('created_at', since24h)
  if (failErr) throw failErr

  // Group by ip in JS (Supabase JS client doesn't support GROUP BY directly)
  const ipMap = {}
  for (const row of failRows || []) {
    const ip = row.ip_address || 'unknown'
    if (!ipMap[ip]) ipMap[ip] = { _id: ip, count: 0, lastAttempt: row.created_at, emails: new Set() }
    ipMap[ip].count++
    if (row.entity_name) ipMap[ip].emails.add(row.entity_name)
    if (row.created_at > ipMap[ip].lastAttempt) ipMap[ip].lastAttempt = row.created_at
  }
  const failedLogins = Object.values(ipMap)
    .map(g => ({ _id: g._id, count: g.count, lastAttempt: g.lastAttempt, emails: [...g.emails] }))
    .sort((a, b) => b.count - a.count)

  return {
    recentActivity: (recentRows || []).map(mapLog),
    failedLogins,
  }
}

module.exports = { create, list, dashboardSummary }

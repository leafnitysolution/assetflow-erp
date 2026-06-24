const bcrypt = require('bcryptjs')
const supabase = require('../config/supabase')

// Map DB row → API-friendly shape (removes password_hash, renames fields)
function mapUser(row) {
  if (!row) return null
  const { password_hash, ...rest } = row
  void password_hash // intentionally excluded
  return {
    id:         rest.id,
    email:      rest.email,
    name:       rest.name,
    role:       rest.role,
    department: rest.department,
    branch:     rest.branch,
    avatar:     rest.avatar,
    phone:      rest.phone,
    status:     rest.status,
    lastLogin:  rest.last_login,
    createdAt:  rest.created_at,
  }
}

async function findById(id, { withPassword = false } = {}) {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single()
  if (error || !data) return null
  return withPassword ? data : mapUser(data)
}

async function findByEmail(email, { withPassword = false } = {}) {
  const { data, error } = await supabase
    .from('users').select('*').eq('email', email.toLowerCase().trim()).single()
  if (error || !data) return null
  return withPassword ? data : mapUser(data)
}

async function list({ excludeRole } = {}) {
  let q = supabase.from('users').select('*').order('created_at', { ascending: false })
  if (excludeRole) q = q.neq('role', excludeRole)
  const { data, error } = await q
  if (error) throw error
  return (data || []).map(mapUser)
}

async function listDirectory() {
  const { data, error } = await supabase
    .from('users').select('id, name, email, department, branch, role').eq('status', 'active')
  if (error) throw error
  return data || []
}

async function create({ email, password, name, role, department, branch, avatar, phone, status }) {
  const password_hash = await bcrypt.hash(password, 10)
  const { data, error } = await supabase.from('users').insert([{
    email: email.toLowerCase().trim(), password_hash, name, role,
    department, branch, avatar, phone, status: status || 'active',
  }]).select('*').single()
  if (error) throw error
  return mapUser(data)
}

async function update(id, fields) {
  // Rename camelCase keys to snake_case columns
  const colMap = {
    email: 'email', name: 'name', role: 'role', department: 'department',
    branch: 'branch', avatar: 'avatar', phone: 'phone', status: 'status',
    lastLogin: 'last_login',
  }
  const row = {}
  for (const [k, col] of Object.entries(colMap)) {
    if (fields[k] !== undefined) row[col] = k === 'email' ? fields[k].toLowerCase().trim() : fields[k]
  }
  const { data, error } = await supabase.from('users').update(row).eq('id', id).select('*').single()
  if (error) throw error
  return mapUser(data)
}

async function updatePassword(id, newPassword) {
  const password_hash = await bcrypt.hash(newPassword, 10)
  const { error } = await supabase.from('users').update({ password_hash }).eq('id', id)
  if (error) throw error
}

async function toggleStatus(id) {
  const { data: current, error: fetchErr } = await supabase
    .from('users').select('status').eq('id', id).single()
  if (fetchErr || !current) throw fetchErr || new Error('User not found')
  const newStatus = current.status === 'active' ? 'inactive' : 'active'
  const { data, error } = await supabase
    .from('users').update({ status: newStatus }).eq('id', id).select('*').single()
  if (error) throw error
  return mapUser(data)
}

async function remove(id) {
  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) throw error
}

async function comparePassword(row, password) {
  return bcrypt.compare(password, row.password_hash)
}

module.exports = { findById, findByEmail, list, listDirectory, create, update, updatePassword, toggleStatus, remove, comparePassword, mapUser }

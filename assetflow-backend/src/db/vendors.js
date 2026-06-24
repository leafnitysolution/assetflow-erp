const supabase = require('../config/supabase')

function mapVendor(row) {
  if (!row) return null
  return {
    id:            row.id,
    name:          row.name,
    email:         row.email,
    phone:         row.phone,
    address:       row.address,
    contactPerson: row.contact_person,
    website:       row.website,
    rating:        row.rating != null ? Number(row.rating) : null,
    totalOrders:   row.total_orders,
    status:        row.status,
    createdAt:     row.created_at,
  }
}

async function list() {
  const { data, error } = await supabase.from('vendors').select('*').order('name', { ascending: true })
  if (error) throw error
  return (data || []).map(mapVendor)
}

async function findById(id) {
  const { data, error } = await supabase.from('vendors').select('*').eq('id', id).single()
  if (error || !data) return null
  return mapVendor(data)
}

async function create({ name, email, phone, address, contactPerson, website, rating, totalOrders, status }) {
  const { data, error } = await supabase.from('vendors').insert([{
    name, email, phone, address,
    contact_person: contactPerson || null,
    website, rating,
    total_orders: totalOrders || 0,
    status: status || 'active',
  }]).select('*').single()
  if (error) throw error
  return mapVendor(data)
}

async function update(id, fields) {
  const colMap = {
    name: 'name', email: 'email', phone: 'phone', address: 'address',
    contactPerson: 'contact_person', website: 'website', rating: 'rating',
    totalOrders: 'total_orders', status: 'status',
  }
  const row = {}
  for (const [k, col] of Object.entries(colMap)) {
    if (fields[k] !== undefined) row[col] = fields[k]
  }
  const { data, error } = await supabase.from('vendors').update(row).eq('id', id).select('*').single()
  if (error) throw error
  return data ? mapVendor(data) : null
}

async function remove(id) {
  const { data, error } = await supabase.from('vendors').delete().eq('id', id).select('*').single()
  if (error) throw error
  return data ? mapVendor(data) : null
}

module.exports = { list, findById, create, update, remove }

const supabase = require('../config/supabase')

function mapAsset(row) {
  if (!row) return null
  return {
    id:               row.id,
    name:             row.name,
    description:      row.description,
    category:         row.category,
    status:           row.status,
    serialNumber:     row.serial_number,
    sku:              row.sku,
    barcode:          row.barcode,
    qrCode:           row.qr_code,
    purchaseDate:     row.purchase_date,
    purchasePrice:    row.purchase_price != null ? Number(row.purchase_price) : null,
    purchaseStatus:   row.purchase_status,
    vendorId:         row.vendor_id,
    vendorName:       row.vendor_name,
    warrantyExpiry:   row.warranty_expiry,
    insuranceExpiry:  row.insurance_expiry,
    amcExpiry:        row.amc_expiry,
    branch:           row.branch,
    location:         row.location,
    departmentId:     row.department_id,
    assignedTo:       row.assigned_to,
    assignedAt:       row.assigned_at,
    condition:        row.condition,
    depreciationRate: row.depreciation_rate != null ? Number(row.depreciation_rate) : null,
    currentValue:     row.current_value != null ? Number(row.current_value) : null,
    subType:          row.sub_type,
    specs:            row.specs || {},
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
  }
}

function toRow(fields) {
  const map = {
    name: 'name', description: 'description', category: 'category', status: 'status',
    serialNumber: 'serial_number', sku: 'sku', barcode: 'barcode', qrCode: 'qr_code',
    purchaseDate: 'purchase_date', purchasePrice: 'purchase_price',
    purchaseStatus: 'purchase_status', vendorId: 'vendor_id', vendorName: 'vendor_name',
    warrantyExpiry: 'warranty_expiry', insuranceExpiry: 'insurance_expiry', amcExpiry: 'amc_expiry',
    branch: 'branch', location: 'location', departmentId: 'department_id',
    assignedTo: 'assigned_to', assignedAt: 'assigned_at',
    condition: 'condition', depreciationRate: 'depreciation_rate',
    currentValue: 'current_value', subType: 'sub_type', specs: 'specs',
  }
  const row = {}
  for (const [k, col] of Object.entries(map)) {
    if (fields[k] !== undefined) row[col] = fields[k]
  }
  return row
}

async function list({ assignedTo } = {}) {
  let q = supabase.from('assets').select('*').order('created_at', { ascending: false })
  if (assignedTo) q = q.eq('assigned_to', assignedTo)
  const { data, error } = await q
  if (error) throw error
  return (data || []).map(mapAsset)
}

async function findById(id) {
  const { data, error } = await supabase.from('assets').select('*').eq('id', id).single()
  if (error || !data) return null
  return mapAsset(data)
}

async function create(fields) {
  const row = toRow(fields)
  // Auto-assign qr_code after insert if not provided
  const { data, error } = await supabase.from('assets').insert([row]).select('*').single()
  if (error) throw error
  // Set qrCode = 'asset:<id>' if not supplied
  if (!data.qr_code) {
    const { data: updated, error: updErr } = await supabase
      .from('assets').update({ qr_code: `asset:${data.id}` }).eq('id', data.id).select('*').single()
    if (updErr) throw updErr
    return mapAsset(updated)
  }
  return mapAsset(data)
}

async function update(id, fields) {
  const row = toRow(fields)
  const { data, error } = await supabase.from('assets').update(row).eq('id', id).select('*').single()
  if (error) throw error
  if (!data) return null
  return mapAsset(data)
}

async function remove(id) {
  const { data, error } = await supabase.from('assets').delete().eq('id', id).select('*').single()
  if (error) throw error
  return data ? mapAsset(data) : null
}

async function assign(id, { userId, status = 'assigned' }) {
  const { data, error } = await supabase.from('assets')
    .update({ assigned_to: userId, assigned_at: new Date().toISOString(), status })
    .eq('id', id).select('*').single()
  if (error) throw error
  return data ? mapAsset(data) : null
}

async function returnAsset(id) {
  const { data, error } = await supabase.from('assets')
    .update({ assigned_to: null, assigned_at: null, status: 'available' })
    .eq('id', id).select('*').single()
  if (error) throw error
  return data ? mapAsset(data) : null
}

module.exports = { list, findById, create, update, remove, assign, returnAsset, mapAsset }

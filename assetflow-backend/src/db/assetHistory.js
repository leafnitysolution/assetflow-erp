const supabase = require('../config/supabase')

function mapHistory(row) {
  if (!row) return null
  return {
    id:            row.id,
    assetId:       row.asset_id,
    assetName:     row.asset_name,
    event:         row.event,
    userId:        row.user_id,
    userName:      row.user_name,
    userEmail:     row.user_email,
    fromStatus:    row.from_status,
    toStatus:      row.to_status,
    repairDetails: row.repair_details,
    performedBy:   row.performed_by,
    notes:         row.notes,
    createdAt:     row.created_at,
  }
}

async function findByAsset(assetId) {
  const { data, error } = await supabase
    .from('asset_history')
    .select('*')
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapHistory)
}

async function findByUser(userId, { eventsFilter } = {}) {
  let q = supabase.from('asset_history').select('*').eq('user_id', userId)
  if (eventsFilter && eventsFilter.length > 0) q = q.in('event', eventsFilter)
  q = q.order('created_at', { ascending: false })
  const { data, error } = await q
  if (error) throw error
  return (data || []).map(mapHistory)
}

async function create({ assetId, assetName, event, userId, userName, userEmail, fromStatus, toStatus, repairDetails, performedBy, notes }) {
  const { data, error } = await supabase.from('asset_history').insert([{
    asset_id:       assetId,
    asset_name:     assetName,
    event,
    user_id:        userId  || null,
    user_name:      userName  || null,
    user_email:     userEmail || null,
    from_status:    fromStatus || null,
    to_status:      toStatus   || null,
    repair_details: repairDetails || null,
    performed_by:   performedBy || null,
    notes:          notes || null,
  }]).select('*').single()
  if (error) throw error
  return mapHistory(data)
}

module.exports = { findByAsset, findByUser, create }

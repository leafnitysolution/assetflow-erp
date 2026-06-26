const supabase = require('../config/supabase')

// Map comments rows into the embedded-array shape the frontend expects
function mapComment(row) {
  return {
    id:        row.id,
    userId:    row.user_id,
    userName:  row.user_name,
    content:   row.content,
    createdAt: row.created_at,
  }
}

function mapTicket(row, comments = []) {
  if (!row) return null
  return {
    id:             row.id,
    ticketNumber:   row.ticket_number,
    title:          row.title,
    description:    row.description,
    type:           row.type,
    status:         row.status,
    priority:       row.priority,
    assetId:        row.asset_id,
    assetName:      row.asset_name,
    source:         row.source,
    rawEmail:       row.raw_email,
    createdBy:      row.created_by,
    createdByName:  row.created_by_name,
    assignedTo:     row.assigned_to,
    assignedToName: row.assigned_to_name,
    departmentId:   row.department_id,
    attachments:    row.attachments || [],
    sla:            row.sla,
    resolvedAt:     row.resolved_at,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
    comments:       comments.map(mapComment),
  }
}

async function _commentsFor(ticketIds) {
  if (!ticketIds.length) return []
  const { data, error } = await supabase
    .from('ticket_comments').select('*').in('ticket_id', ticketIds)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

async function list({ createdBy, assignedTo } = {}) {
  let q = supabase.from('tickets').select('*').order('created_at', { ascending: false })
  if (createdBy && assignedTo) {
    q = q.or(`created_by.eq.${createdBy},assigned_to.eq.${assignedTo}`)
  } else if (createdBy) {
    q = q.eq('created_by', createdBy)
  } else if (assignedTo) {
    q = q.eq('assigned_to', assignedTo)
  }
  const { data, error } = await q
  if (error) throw error
  const rows = data || []
  const comments = await _commentsFor(rows.map(r => r.id))
  const byTicket = {}
  for (const c of comments) {
    if (!byTicket[c.ticket_id]) byTicket[c.ticket_id] = []
    byTicket[c.ticket_id].push(c)
  }
  return rows.map(r => mapTicket(r, byTicket[r.id] || []))
}

async function findById(id) {
  const { data, error } = await supabase.from('tickets').select('*').eq('id', id).single()
  if (error || !data) return null
  const { data: commentRows } = await supabase
    .from('ticket_comments').select('*').eq('ticket_id', id).order('created_at', { ascending: true })
  return mapTicket(data, commentRows || [])
}

async function _generateTicketNumber() {
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('tickets').select('id', { count: 'exact', head: true })
    .like('ticket_number', `TKT-${year}-%`)
  return `TKT-${year}-${String((count || 0) + 1).padStart(4, '0')}`
}

async function create({ title, description, type, status, priority, assetId, assetName, source, rawEmail, createdBy, createdByName, assignedTo, assignedToName, departmentId, attachments, sla }) {
  const ticketNumber = await _generateTicketNumber()
  const { data, error } = await supabase.from('tickets').insert([{
    ticket_number:    ticketNumber,
    title, description, type,
    status:           status   || 'open',
    priority:         priority || 'medium',
    asset_id:         assetId  || null,
    asset_name:       assetName || null,
    source:           source   || 'manual',
    raw_email:        rawEmail || null,
    created_by:       createdBy,
    created_by_name:  createdByName || null,
    assigned_to:      assignedTo   || null,
    assigned_to_name: assignedToName || null,
    department_id:    departmentId  || null,
    attachments:      attachments   || [],
    sla:              sla           || null,
  }]).select('*').single()
  if (error) throw error
  return mapTicket(data, [])
}

async function update(id, fields) {
  const colMap = {
    title: 'title', description: 'description', type: 'type', status: 'status',
    priority: 'priority', assetId: 'asset_id', assetName: 'asset_name',
    source: 'source', rawEmail: 'raw_email', createdBy: 'created_by',
    createdByName: 'created_by_name', assignedTo: 'assigned_to',
    assignedToName: 'assigned_to_name', departmentId: 'department_id',
    attachments: 'attachments', sla: 'sla', resolvedAt: 'resolved_at',
  }
  const row = {}
  for (const [k, col] of Object.entries(colMap)) {
    if (fields[k] !== undefined) row[col] = fields[k]
  }
  const { data, error } = await supabase.from('tickets').update(row).eq('id', id).select('*').single()
  if (error) throw error
  if (!data) return null
  const { data: commentRows } = await supabase
    .from('ticket_comments').select('*').eq('ticket_id', id).order('created_at', { ascending: true })
  return mapTicket(data, commentRows || [])
}

async function remove(id) {
  const ticket = await findById(id)
  if (!ticket) return null
  await supabase.from('ticket_comments').delete().eq('ticket_id', id)
  await supabase.from('tickets').delete().eq('id', id)
  return ticket
}

async function assign(id, { userId, userName }) {
  const { data, error } = await supabase.from('tickets')
    .update({ assigned_to: userId, assigned_to_name: userName, status: 'assigned' })
    .eq('id', id).select('*').single()
  if (error) throw error
  if (!data) return null
  const { data: commentRows } = await supabase
    .from('ticket_comments').select('*').eq('ticket_id', id).order('created_at', { ascending: true })
  return mapTicket(data, commentRows || [])
}

async function resolve(id) {
  const { data, error } = await supabase.from('tickets')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', id).select('*').single()
  if (error) throw error
  if (!data) return null
  const { data: commentRows } = await supabase
    .from('ticket_comments').select('*').eq('ticket_id', id).order('created_at', { ascending: true })
  return mapTicket(data, commentRows || [])
}

async function addComment(ticketId, { userId, userName, content }) {
  const { error } = await supabase.from('ticket_comments').insert([{
    ticket_id: ticketId, user_id: userId, user_name: userName, content,
  }])
  if (error) throw error
  return findById(ticketId)
}

module.exports = { list, findById, create, update, remove, assign, resolve, addComment }

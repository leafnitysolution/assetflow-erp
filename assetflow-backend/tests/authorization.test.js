require('dotenv').config()
const request = require('supertest')
const bcrypt = require('bcryptjs')

const app = require('../src/app')
const supabase = require('../src/config/supabase')

// Use real Supabase project (TEST env prefix prevents accidental prod data collisions)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-integration-tests'

jest.setTimeout(120000)

// ── Helpers ──────────────────────────────────────────────────────────────────

async function createUser({ email, password = 'password123', name, role, department, status = 'active' }) {
  const password_hash = await bcrypt.hash(password, 10)
  const { data, error } = await supabase.from('users').insert([{
    email, password_hash, name, role, department: department || null, status,
  }]).select('*').single()
  if (error) throw error
  return data
}

async function createAsset({ name, category, status = 'available', assignedTo = null }) {
  const { data, error } = await supabase.from('assets').insert([{
    name, category, status, assigned_to: assignedTo || null,
  }]).select('*').single()
  if (error) throw error
  // Set qr_code
  await supabase.from('assets').update({ qr_code: `asset:${data.id}` }).eq('id', data.id)
  return data
}

async function createTicket({ title, description, type, createdById, createdByName }) {
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('tickets').select('id', { count: 'exact', head: true })
    .like('ticket_number', `TKT-${year}-%`)
  const ticketNumber = `TKT-${year}-${String((count || 0) + 1).padStart(4, '0')}`
  const { data, error } = await supabase.from('tickets').insert([{
    ticket_number: ticketNumber, title, description, type,
    created_by: createdById, created_by_name: createdByName,
  }]).select('*').single()
  if (error) throw error
  return data
}

async function login(email, password = 'password123') {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200)
  return response.body.token
}

// ── Teardown ─────────────────────────────────────────────────────────────────
// Track IDs created per test so we can clean up precisely
let createdUserIds = []
let createdAssetIds = []
let createdTicketIds = []

async function cleanup() {
  if (createdTicketIds.length) {
    await supabase.from('ticket_comments').delete().in('ticket_id', createdTicketIds)
    await supabase.from('tickets').delete().in('id', createdTicketIds)
    createdTicketIds = []
  }
  if (createdAssetIds.length) {
    await supabase.from('asset_history').delete().in('asset_id', createdAssetIds)
    await supabase.from('assets').delete().in('id', createdAssetIds)
    createdAssetIds = []
  }
  if (createdUserIds.length) {
    await supabase.from('audit_logs').delete().in('user_id', createdUserIds)
    await supabase.from('users').delete().in('id', createdUserIds)
    createdUserIds = []
  }
}

// Wrap helpers to track IDs
async function user(opts) { const u = await createUser(opts); createdUserIds.push(u.id); return u }
async function asset(opts) { const a = await createAsset(opts); createdAssetIds.push(a.id); return a }
async function ticket(opts) { const t = await createTicket(opts); createdTicketIds.push(t.id); return t }

afterEach(cleanup)

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('role-based authorization', () => {
  test('members can only read assigned assets by id', async () => {
    const member      = await user({ email: `member-${Date.now()}@example.com`,  name: 'Member One', role: 'member' })
    const otherMember = await user({ email: `other-${Date.now()}@example.com`,   name: 'Member Two', role: 'member' })
    const ownAsset    = await asset({ name: 'Assigned Laptop', category: 'electronics', assignedTo: member.id,      status: 'assigned' })
    const unownedAsset = await asset({ name: 'Other Laptop',   category: 'electronics', assignedTo: otherMember.id, status: 'assigned' })
    const token = await login(member.email)

    await request(app)
      .get(`/api/assets/${ownAsset.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    await request(app)
      .get(`/api/assets/${unownedAsset.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403)
  })

  test('members cannot read, update, or comment on other users tickets', async () => {
    const member      = await user({ email: `member-${Date.now()}@example.com`, name: 'Member One', role: 'member' })
    const otherMember = await user({ email: `other-${Date.now()}@example.com`,  name: 'Member Two', role: 'member' })
    const otherTicket = await ticket({ title: 'Other issue', description: 'Belongs to another member', type: 'issue', createdById: otherMember.id, createdByName: otherMember.name })
    createdTicketIds.push(otherTicket.id) // already tracked by ticket() helper
    const token = await login(member.email)

    await request(app)
      .get(`/api/tickets/${otherTicket.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403)

    await request(app)
      .put(`/api/tickets/${otherTicket.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'resolved' })
      .expect(403)

    await request(app)
      .post(`/api/tickets/${otherTicket.id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'I should not be able to comment here' })
      .expect(403)
  })

  test('assigned technicians (even with member role) can view, comment, and update status of their assigned tickets', async () => {
    const technician = await user({ email: `tech-${Date.now()}@example.com`, name: 'Tech Member', role: 'member' })
    const member     = await user({ email: `member-${Date.now()}@example.com`, name: 'Reporter Member', role: 'member' })
    const userTicket = await ticket({ title: 'Broken chair', description: 'Chair leg is broken', type: 'issue', createdById: member.id, createdByName: member.name })
    
    // Assign ticket to technician using Supabase
    await supabase.from('tickets').update({ assigned_to: technician.id, assigned_to_name: technician.name, status: 'assigned' }).eq('id', userTicket.id)
    
    const token = await login(technician.email)

    // Technician should be able to view the ticket
    await request(app)
      .get(`/api/tickets/${userTicket.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    // Technician should be able to comment on the ticket
    await request(app)
      .post(`/api/tickets/${userTicket.id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'I am on my way to fix this' })
      .expect(200)

    // Technician should be able to update status
    const putResp = await request(app)
      .put(`/api/tickets/${userTicket.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in-progress' })
      .expect(200)
    
    expect(putResp.body.status).toBe('in-progress')

    // Technician should NOT be able to update other fields, e.g., title
    const putTitleResp = await request(app)
      .put(`/api/tickets/${userTicket.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Hacked Title' })
      .expect(200)
    
    expect(putTitleResp.body.title).not.toBe('Hacked Title') // Field update ignored
  })

  test('members cannot spoof ticket ownership while creating tickets', async () => {
    const member      = await user({ email: `member-${Date.now()}@example.com`, name: 'Member One', role: 'member' })
    const otherMember = await user({ email: `other-${Date.now()}@example.com`,  name: 'Member Two', role: 'member' })
    const token = await login(member.email)

    const response = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title:         'Spoof attempt',
        description:   'Try to create this ticket for someone else',
        type:          'issue',
        priority:      'medium',
        createdBy:     otherMember.id,
        createdByName: otherMember.name,
      })
      .expect(201)

    createdTicketIds.push(response.body.id)
    expect(response.body.createdBy).toBe(String(member.id))
    expect(response.body.createdByName).toBe(member.name)
  })

  test('admins can manage members but cannot create or alter admin accounts', async () => {
    const admin       = await user({ email: `admin-${Date.now()}@example.com`,  name: 'Admin One',    role: 'admin' })
    const targetAdmin = await user({ email: `target-${Date.now()}@example.com`, name: 'Target Admin', role: 'admin' })
    const token = await login(admin.email)

    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: `new-admin-${Date.now()}@example.com`, name: 'New Admin', role: 'admin', password: 'password123' })
      .expect(403)

    const newMemberEmail = `new-member-${Date.now()}@example.com`
    const memberResp = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: newMemberEmail, name: 'New Member', role: 'member', password: 'password123' })
      .expect(201)
    createdUserIds.push(memberResp.body.id)

    await request(app)
      .put(`/api/users/${targetAdmin.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renamed Admin' })
      .expect(403)
  })
})

describe('core asset and ticket workflows', () => {
  test('admin can assign and return an asset with history entries', async () => {
    const admin  = await user({ email: `admin-${Date.now()}@example.com`,  name: 'Admin One',  role: 'admin' })
    const member = await user({ email: `member-${Date.now()}@example.com`, name: 'Member One', role: 'member' })
    const inv    = await asset({ name: 'Inventory Laptop', category: 'electronics', status: 'available' })
    const token  = await login(admin.email)

    const assignResponse = await request(app)
      .post(`/api/assets/${inv.id}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: member.id })
      .expect(200)

    expect(assignResponse.body.status).toBe('assigned')
    expect(assignResponse.body.assignedTo).toBe(String(member.id))

    const returnResponse = await request(app)
      .post(`/api/assets/${inv.id}/return`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(returnResponse.body.status).toBe('available')
    expect(returnResponse.body.assignedTo).toBeNull()

    const { data: history } = await supabase
      .from('asset_history').select('event').eq('asset_id', inv.id).order('created_at', { ascending: true })
    expect(history.map(e => e.event)).toEqual(['ASSIGNED', 'RETURNED'])
  })

  test('admin can create, assign, comment on, and resolve a ticket', async () => {
    const admin  = await user({ email: `admin-${Date.now()}@example.com`,  name: 'Admin One',  role: 'admin' })
    const member = await user({ email: `member-${Date.now()}@example.com`, name: 'Member One', role: 'member' })
    const token  = await login(admin.email)

    const createResponse = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title:         'Laptop repair',
        description:   'Screen flickering',
        type:          'maintenance',
        priority:      'high',
        createdBy:     member.id,
        createdByName: member.name,
      })
      .expect(201)

    const ticketId = createResponse.body.id
    createdTicketIds.push(ticketId)
    expect(createResponse.body.createdBy).toBe(String(member.id))

    const assignResponse = await request(app)
      .post(`/api/tickets/${ticketId}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: admin.id, userName: admin.name })
      .expect(200)

    expect(assignResponse.body.status).toBe('assigned')
    expect(assignResponse.body.assignedTo).toBe(String(admin.id))

    const commentResponse = await request(app)
      .post(`/api/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Diagnostics started' })
      .expect(200)

    expect(commentResponse.body.comments).toHaveLength(1)

    const resolveResponse = await request(app)
      .post(`/api/tickets/${ticketId}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(resolveResponse.body.status).toBe('resolved')
    expect(resolveResponse.body.resolvedAt).toBeTruthy()
  })
})

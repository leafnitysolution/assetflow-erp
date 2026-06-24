require('dotenv').config()
const { validateEnv } = require('./config/env')
const supabase = require('./config/supabase')
const bcrypt = require('bcryptjs')

try { validateEnv() } catch (err) { console.error(err.message); process.exit(1) }

async function seed() {
  console.log('🔗 Connecting to Supabase...')

  // ── Clear existing data ──────────────────────────────────────────
  // Delete in reverse dependency order
  await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('ticket_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('asset_history').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('assets').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('vendors').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  console.log('🗑  Cleared existing data')

  // ── Users ────────────────────────────────────────────────────────
  const userData = [
    { email: 'superadmin@assetflow.com', password: 'password123', name: 'Super Admin',  role: 'super-admin', branch: 'Head Office',        status: 'active' },
    { email: 'admin@assetflow.com',      password: 'password123', name: 'John Admin',   role: 'admin',       department: 'IT',          branch: 'Head Office',        status: 'active' },
    { email: 'member@assetflow.com',     password: 'password123', name: 'Jane Member',  role: 'member',      department: 'Engineering', branch: 'Engineering Branch', status: 'active' },
    { email: 'sarah@assetflow.com',      password: 'password123', name: 'Sarah Wilson', role: 'member',      department: 'Design',      branch: 'Design Branch',      status: 'active' },
    { email: 'mike@assetflow.com',       password: 'password123', name: 'Mike Johnson', role: 'member',      department: 'Engineering', branch: 'Engineering Branch', status: 'inactive' },
  ]

  const userRows = await Promise.all(userData.map(async u => ({
    email:         u.email,
    password_hash: await bcrypt.hash(u.password, 10),
    name:          u.name,
    role:          u.role,
    department:    u.department || null,
    branch:        u.branch    || null,
    status:        u.status,
  })))

  const { data: users, error: usersErr } = await supabase.from('users').insert(userRows).select('*')
  if (usersErr) throw usersErr
  console.log(`👤 Seeded ${users.length} users`)

  const [, admin, jane, sarah] = users

  // ── Vendors ──────────────────────────────────────────────────────
  const { data: vendors, error: vendorsErr } = await supabase.from('vendors').insert([
    { name: 'Apple Inc.',        email: 'business@apple.com', phone: '+1-800-MY-APPLE', contact_person: 'Business Sales',   website: 'https://apple.com/business', rating: 4.8, total_orders: 150, status: 'active' },
    { name: 'Dell Technologies', email: 'sales@dell.com',     phone: '+1-800-624-9897', contact_person: 'Enterprise Sales', rating: 4.5, total_orders: 89,  status: 'active' },
    { name: 'Herman Miller',     email: 'orders@hermanmiller.com',                       contact_person: 'Commercial Sales', rating: 4.7, total_orders: 45,  status: 'active' },
    { name: 'Toyota Motors',     email: 'fleet@toyota.com',   phone: '+1-800-331-4331', contact_person: 'Fleet Sales',      rating: 4.6, total_orders: 12,  status: 'active' },
  ]).select('*')
  if (vendorsErr) throw vendorsErr
  console.log(`🏢 Seeded ${vendors.length} vendors`)

  // ── Assets ───────────────────────────────────────────────────────
  const { data: assets, error: assetsErr } = await supabase.from('assets').insert([
    {
      name: 'MacBook Pro 16"', category: 'electronics', condition: 'excellent',
      status: 'assigned', assigned_to: jane.id, assigned_at: '2024-03-15T00:00:00Z',
      serial_number: 'C02XYZ123ABC', sku: 'MBP-16-M3',
      branch: 'Engineering Branch', location: 'Engineering Floor', vendor_id: vendors[0].id,
      purchase_date: '2024-01-15', purchase_price: 3499, current_value: 3200,
    },
    {
      name: 'Dell Monitor 27"', category: 'electronics', condition: 'good',
      status: 'available', serial_number: 'DL27-2024-001',
      branch: 'Head Office', location: 'IT Storage', vendor_id: vendors[1].id,
      purchase_date: '2024-02-01', purchase_price: 599, current_value: 550,
    },
    {
      name: 'Ergonomic Chair', category: 'furniture', condition: 'good',
      status: 'assigned', assigned_to: sarah.id, assigned_at: '2024-02-10T00:00:00Z',
      serial_number: 'CHAIR-HM-001', branch: 'Design Branch', location: 'Design Studio', vendor_id: vendors[2].id,
      purchase_price: 1200, current_value: 1100,
    },
    {
      name: 'iPhone 15 Pro', category: 'electronics', condition: 'excellent',
      status: 'assigned', assigned_to: jane.id, assigned_at: '2024-04-01T00:00:00Z',
      serial_number: 'IP15-2024-002', branch: 'Engineering Branch', location: 'Engineering Floor', vendor_id: vendors[0].id,
      purchase_price: 1299, current_value: 1199,
    },
    {
      name: 'Toyota Camry 2023', category: 'vehicle', condition: 'excellent',
      status: 'available', serial_number: 'VH-TYT-2023', branch: 'Fleet Yard', location: 'Parking B2',
      vendor_id: vendors[3].id, purchase_price: 28000, current_value: 26000,
    },
    {
      name: '3D Printer', category: 'equipment', condition: 'fair',
      status: 'maintenance', serial_number: 'PRUSA-3D-001',
      branch: 'Lab Branch', location: 'Lab Room 3', purchase_price: 1500, current_value: 879,
    },
  ]).select('*')
  if (assetsErr) throw assetsErr

  // Set qr_code for each asset
  for (const a of assets) {
    await supabase.from('assets').update({ qr_code: `asset:${a.id}` }).eq('id', a.id)
  }
  console.log(`📦 Seeded ${assets.length} assets`)

  // ── Tickets ──────────────────────────────────────────────────────
  const year = new Date().getFullYear()
  const ticketData = [
    { ticket_number: `TKT-${year}-0001`, title: 'MacBook screen flickering', description: 'Screen flickers intermittently when connected to external monitor', type: 'issue', status: 'in-progress', priority: 'high', asset_id: assets[0].id, asset_name: 'MacBook Pro 16"', created_by: jane.id, created_by_name: 'Jane Member', assigned_to: admin.id, assigned_to_name: 'John Admin', source: 'manual' },
    { ticket_number: `TKT-${year}-0002`, title: 'Request new keyboard', description: 'Keyboard keys are sticking, need replacement', type: 'replacement', status: 'open', priority: 'medium', created_by: sarah.id, created_by_name: 'Sarah Wilson', source: 'manual' },
    { ticket_number: `TKT-${year}-0003`, title: '3D Printer maintenance', description: 'Regular scheduled maintenance for 3D printer', type: 'maintenance', status: 'assigned', priority: 'medium', asset_id: assets[5].id, asset_name: '3D Printer', created_by: admin.id, created_by_name: 'John Admin', assigned_to: admin.id, assigned_to_name: 'John Admin', source: 'manual' },
    { ticket_number: `TKT-${year}-0004`, title: 'Lost iPhone charger', description: 'Lost iPhone charger, need a replacement', type: 'lost', status: 'resolved', priority: 'low', created_by: jane.id, created_by_name: 'Jane Member', assigned_to: admin.id, assigned_to_name: 'John Admin', resolved_at: '2024-05-06T00:00:00Z', source: 'manual' },
  ]

  const { data: tickets, error: ticketsErr } = await supabase.from('tickets').insert(ticketData).select('*')
  if (ticketsErr) throw ticketsErr
  console.log(`🎫 Seeded ${tickets.length} tickets`)

  console.log('\n✅ Seed complete!\n')
  console.log('Test accounts (all passwords: password123):')
  console.log('  superadmin@assetflow.com  →  super-admin')
  console.log('  admin@assetflow.com       →  admin')
  console.log('  member@assetflow.com      →  member')
  console.log('  sarah@assetflow.com       →  member')

  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})

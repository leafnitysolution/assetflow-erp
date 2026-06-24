export type UserRole = "super-admin" | "admin" | "member"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  department?: string
  branch?: string
  avatar?: string
  phone?: string
  status: "active" | "inactive"
  createdAt: string
  lastLogin?: string
}

export interface Department {
  id: string
  name: string
  description?: string
  managerId?: string
  createdAt: string
}

export type AssetStatus = "available" | "assigned" | "maintenance" | "retired" | "lost" | "damaged"
export type AssetCategory = "electronics" | "furniture" | "vehicle" | "equipment" | "tools" | "other"

export interface Asset {
  id: string
  name: string
  description?: string
  category: AssetCategory
  status: AssetStatus
  serialNumber?: string
  sku?: string
  barcode?: string
  qrCode?: string
  purchaseDate?: string
  purchasePrice?: number
  purchaseStatus?: "new" | "refurbished"
  vendorId?: string
  vendorName?: string
  warrantyExpiry?: string
  insuranceExpiry?: string
  amcExpiry?: string
  branch?: string
  location?: string
  departmentId?: string
  assignedTo?: string
  assignedAt?: string
  condition: "excellent" | "good" | "fair" | "poor"
  depreciationRate?: number
  currentValue?: number
  subType?: string
  specs?: Record<string, string>
  createdAt: string
  updatedAt: string
}

export type TicketStatus = "open" | "assigned" | "in-progress" | "pending-approval" | "on-hold" | "resolved" | "closed" | "reopened"
export type TicketPriority = "low" | "medium" | "high" | "urgent"
export type TicketType = "issue" | "maintenance" | "replacement" | "damage" | "lost"

export interface Ticket {
  id: string
  ticketNumber: string
  title: string
  description: string
  type: TicketType
  status: TicketStatus
  priority: TicketPriority
  assetId?: string
  assetName?: string
  source?: "manual" | "email"
  rawEmail?: string
  createdBy: string
  createdByName: string
  assignedTo?: string
  assignedToName?: string
  departmentId?: string
  comments?: TicketComment[]
  attachments?: string[]
  sla?: number
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface TicketComment {
  id: string
  ticketId: string
  userId: string
  userName: string
  content: string
  createdAt: string
}

export interface Vendor {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  contactPerson?: string
  website?: string
  rating?: number
  totalOrders?: number
  status: "active" | "inactive"
  createdAt: string
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  userRole: UserRole
  action: string
  entityType: string
  entityId: string
  oldValue?: unknown
  newValue?: unknown
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export interface InventoryMovement {
  id: string
  assetId: string
  assetName: string
  type: "in" | "out" | "transfer" | "return" | "adjustment"
  quantity: number
  fromLocation?: string
  toLocation?: string
  fromUser?: string
  toUser?: string
  reason?: string
  performedBy: string
  performedByName: string
  createdAt: string
}

export interface DashboardStats {
  totalAssets: number
  availableAssets: number
  assignedAssets: number
  maintenanceAssets: number
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  totalUsers: number
  recentActivities: AuditLog[]
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  link?: string
  createdAt: string
}

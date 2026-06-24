import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Plus, Search, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTicketStore } from "@/stores/ticketStore"
import { useAuthStore } from "@/stores/authStore"
import { formatDate } from "@/lib/utils"
import type { Ticket } from "@/types"

type BadgeVariant = "default" | "secondary" | "accent" | "destructive" | "warning" | "outline"

const getStatusBadgeVariant = (status: Ticket["status"]): BadgeVariant => {
  switch (status) {
    case "open":
      return "warning"
    case "assigned":
    case "in-progress":
      return "default"
    case "pending-approval":
    case "on-hold":
      return "secondary"
    case "resolved":
    case "closed":
      return "accent"
    case "reopened":
      return "destructive"
    default:
      return "secondary"
  }
}

const getPriorityBadgeVariant = (priority: Ticket["priority"]): BadgeVariant => {
  switch (priority) {
    case "urgent":
      return "destructive"
    case "high":
      return "warning"
    case "medium":
      return "default"
    case "low":
      return "secondary"
    default:
      return "secondary"
  }
}

function TicketTable({ tickets, onRowClick }: { tickets: Ticket[]; onRowClick: (ticketId: string) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[120px]">#</TableHead>
          <TableHead>Ticket</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created By</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onRowClick(ticket.id)}>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-xs font-semibold text-primary">
                  {ticket.ticketNumber || "—"}
                </span>
                {ticket.source === "email" && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Mail className="h-2.5 w-2.5" />via email
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{ticket.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {ticket.description}
                </p>
              </div>
            </TableCell>
            <TableCell className="capitalize">{ticket.type}</TableCell>
            <TableCell>
              <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                {ticket.priority}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(ticket.status)}>
                {ticket.status}
              </Badge>
            </TableCell>
            <TableCell>{ticket.createdByName}</TableCell>
            <TableCell>{ticket.assignedToName || "-"}</TableCell>
            <TableCell>{formatDate(ticket.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function Tickets() {
  const { tickets } = useTicketStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")

  const isAdmin = user?.role === "admin" || user?.role === "super-admin"
  const ticketDetailBase = isAdmin ? "/tickets" : "/member/tickets"

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    // For members, only show their tickets
    if (!isAdmin) {
      return matchesSearch && ticket.createdBy === user?.id
    }
    
    return matchesSearch
  })

  const ticketsByStatus = {
    all: filteredTickets,
    open: filteredTickets.filter((t) => t.status === "open"),
    assigned: filteredTickets.filter((t) => t.status === "assigned"),
    inProgress: filteredTickets.filter((t) => t.status === "in-progress"),
    resolved: filteredTickets.filter((t) => t.status === "resolved"),
    closed: filteredTickets.filter((t) => t.status === "closed"),
  }

  const handleRowClick = (ticketId: string) => navigate(`${ticketDetailBase}/${ticketId}`)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Tickets</h1>
          <p className="text-muted-foreground">Manage support tickets and requests</p>
        </div>
        <Button asChild>
          <Link to={isAdmin ? "/tickets/create" : "/member/tickets/create"}>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search tickets..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                All ({ticketsByStatus.all.length})
              </TabsTrigger>
              <TabsTrigger value="open">
                Open ({ticketsByStatus.open.length})
              </TabsTrigger>
              <TabsTrigger value="assigned">
                Assigned ({ticketsByStatus.assigned.length})
              </TabsTrigger>
              <TabsTrigger value="inProgress">
                In Progress ({ticketsByStatus.inProgress.length})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolved ({ticketsByStatus.resolved.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <TicketTable tickets={ticketsByStatus.all} onRowClick={handleRowClick} />
            </TabsContent>
            <TabsContent value="open">
              <TicketTable tickets={ticketsByStatus.open} onRowClick={handleRowClick} />
            </TabsContent>
            <TabsContent value="assigned">
              <TicketTable tickets={ticketsByStatus.assigned} onRowClick={handleRowClick} />
            </TabsContent>
            <TabsContent value="inProgress">
              <TicketTable tickets={ticketsByStatus.inProgress} onRowClick={handleRowClick} />
            </TabsContent>
            <TabsContent value="resolved">
              <TicketTable tickets={ticketsByStatus.resolved} onRowClick={handleRowClick} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

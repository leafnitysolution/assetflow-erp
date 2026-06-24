import { Package, Ticket, QrCode, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/authStore"
import { useAssetStore } from "@/stores/assetStore"
import { useTicketStore } from "@/stores/ticketStore"
import { Link } from "react-router-dom"

export function MemberDashboard() {
  const { user } = useAuthStore()
  const { getAssetsByUser } = useAssetStore()
  const { getTicketsByUser } = useTicketStore()

  const myAssets = user ? getAssetsByUser(user.id) : []
  const myTickets = user ? getTicketsByUser(user.id) : []
  const openTickets = myTickets.filter((t) => t.status === "open")
  const resolvedTickets = myTickets.filter((t) => t.status === "resolved")
  const inProgressTickets = myTickets.filter((t) => t.status === "in-progress")
  const stats = {
    totalAssets: myAssets.length,
    openTickets: openTickets.length,
    resolvedTickets: resolvedTickets.length,
    inProgressTickets: inProgressTickets.length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your assets
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/scanner">
            <QrCode className="mr-2 h-4 w-4" />
            Scan QR
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssets}</div>
            <p className="text-xs text-muted-foreground">
              Currently assigned to you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTickets}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressTickets}</div>
            <p className="text-xs text-muted-foreground">
              Being worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolvedTickets}</div>
            <p className="text-xs text-muted-foreground">
              Completed tickets
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* My Assets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Assets</CardTitle>
              <CardDescription>Assets currently assigned to you</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/member/assets">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {myAssets.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No assets assigned to you yet
              </p>
            ) : (
              myAssets.slice(0, 4).map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {asset.category} • {asset.condition}
                      </p>
                    </div>
                  </div>
                  <Badge variant={asset.status === "assigned" ? "accent" : "secondary"}>
                    {asset.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* My Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Tickets</CardTitle>
              <CardDescription>Your support requests</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/member/tickets">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {myTickets.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-3">No tickets yet</p>
                <Button asChild size="sm">
                  <Link to="/member/tickets/create">Create Ticket</Link>
                </Button>
              </div>
            ) : (
              myTickets.slice(0, 4).map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Ticket className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Status: {ticket.status}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      ticket.status === "open"
                        ? "warning"
                        : ticket.status === "resolved"
                        ? "accent"
                        : "secondary"
                    }
                  >
                    {ticket.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

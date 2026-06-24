import { useParams, useNavigate, Link } from "react-router-dom"
import {
  ArrowLeft,
  Package,
  Calendar,
  MapPin,
  User,
  DollarSign,
  QrCode,
  Wrench,
  Ticket,
  Clock,
  FileText,
  Edit,
} from "lucide-react"
import { AssetHistoryPanel } from "@/components/AssetHistoryPanel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useAssetStore } from "@/stores/assetStore"
import { useTicketStore } from "@/stores/ticketStore"
import { formatCurrency, formatDate } from "@/lib/utils"
import { normalizeBranch } from "@/lib/branches"
import { QRCodeSVG } from "qrcode.react"

export function AssetDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getAssetById } = useAssetStore()
  const { getTicketsByAsset } = useTicketStore()

  const asset = id ? getAssetById(id) : undefined
  const tickets = id ? getTicketsByAsset(id) : []

  if (!asset) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Asset not found</h2>
        <p className="text-muted-foreground mb-4">
          The asset you're looking for doesn't exist.
        </p>
        <Button onClick={() => navigate("/inventory")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Inventory
        </Button>
      </div>
    )
  }

  const getStatusBadgeVariant = (status: typeof asset.status) => {
    switch (status) {
      case "available":
        return "accent"
      case "assigned":
        return "default"
      case "maintenance":
        return "warning"
      case "retired":
      case "lost":
      case "damaged":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getConditionBadgeVariant = (condition: typeof asset.condition) => {
    switch (condition) {
      case "excellent":
        return "accent"
      case "good":
        return "default"
      case "fair":
        return "warning"
      case "poor":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/inventory")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-3xl font-bold">{asset.name}</h1>
              <Badge variant={getStatusBadgeVariant(asset.status)}>{asset.status}</Badge>
            </div>
            <p className="text-muted-foreground">
              {asset.category} • SKU: {asset.sku || "N/A"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline">
            <Wrench className="mr-2 h-4 w-4" />
            Maintenance
          </Button>
          <Button asChild>
            <Link to={`/qr-generator?asset=${asset.id}`}>
              <QrCode className="mr-2 h-4 w-4" />
              QR Code
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="tickets">
                Tickets ({tickets.length})
              </TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Asset Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Serial Number</p>
                      <p className="font-medium">{asset.serialNumber || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">SKU</p>
                      <p className="font-medium">{asset.sku || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium capitalize">{asset.category}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Condition</p>
                      <Badge variant={getConditionBadgeVariant(asset.condition)}>
                        {asset.condition}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Branch</p>
                      <p className="font-medium">{normalizeBranch(asset.branch)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {asset.location || "Not specified"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">
                        {asset.departmentId || "Not assigned"}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p>{asset.description || "No description available"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Purchase Price</p>
                      <p className="font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {asset.purchasePrice
                          ? formatCurrency(asset.purchasePrice)
                          : "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Current Value</p>
                      <p className="font-medium">
                        {asset.currentValue
                          ? formatCurrency(asset.currentValue)
                          : "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Depreciation Rate</p>
                      <p className="font-medium">
                        {asset.depreciationRate ? `${asset.depreciationRate}%` : "N/A"}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Purchase Date</p>
                      <p className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {asset.purchaseDate
                          ? formatDate(asset.purchaseDate)
                          : "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Warranty Expiry</p>
                      <p className="font-medium">
                        {asset.warrantyExpiry
                          ? formatDate(asset.warrantyExpiry)
                          : "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Insurance Expiry</p>
                      <p className="font-medium">
                        {asset.insuranceExpiry
                          ? formatDate(asset.insuranceExpiry)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Asset History</CardTitle>
                  <CardDescription>Full lifecycle — assignments, returns, repairs and costs</CardDescription>
                </CardHeader>
                <CardContent>
                  <AssetHistoryPanel assetId={asset.id} assetName={asset.name} showRepairButton />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tickets">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Related Tickets</CardTitle>
                    <CardDescription>
                      Support tickets related to this asset
                    </CardDescription>
                  </div>
                  <Button>
                    <Ticket className="mr-2 h-4 w-4" />
                    New Ticket
                  </Button>
                </CardHeader>
                <CardContent>
                  {tickets.length === 0 ? (
                    <div className="text-center py-8">
                      <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No tickets found for this asset
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{ticket.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Status: {ticket.status} • Priority: {ticket.priority}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>Asset-related documents and files</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No documents attached to this asset
                    </p>
                    <Button variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Upload Document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-lg">
                <QRCodeSVG
                  value={`asset:${asset.id}`}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Scan to view asset details
              </p>
              <Button variant="outline" className="mt-4 w-full">
                <QrCode className="mr-2 h-4 w-4" />
                Download QR
              </Button>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              {asset.assignedTo ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Assigned User</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {asset.assignedTo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Since {formatDate(asset.assignedAt || "")}</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    View Assignment Details
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">Asset is not assigned</p>
                  <Button className="w-full">
                    <User className="mr-2 h-4 w-4" />
                    Assign to User
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { useState, useRef } from "react"
import { Link } from "react-router-dom"
import { Search, Filter, Download, Upload, QrCode, MoreHorizontal, Edit, Trash2, FileSpreadsheet, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAssetStore } from "@/stores/assetStore"
import { AddAssetDialog } from "@/components/AddAssetDialog"
import { exportToExcel, parseFile, mapAssetRow, downloadAssetTemplate } from "@/lib/csv"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getBranchOptions, normalizeBranch } from "@/lib/branches"
import type { Asset } from "@/types"

export function Inventory() {
  const { assets, deleteAsset, importAssetsFromCSV } = useAssetStore()
  const [searchQuery, setSearchQuery]   = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [branchFilter, setBranchFilter] = useState<string>("all")
  const [importing, setImporting]       = useState(false)
  const [exporting, setExporting]       = useState(false)
  const [importMsg, setImportMsg]       = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const branchOptions = getBranchOptions(assets.map((asset) => asset.branch))

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      normalizeBranch(asset.branch).toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter
    const matchesBranch = branchFilter === "all" || normalizeBranch(asset.branch) === branchFilter
    return matchesSearch && matchesStatus && matchesBranch
  })

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this asset?")) deleteAsset(id)
  }

  const handleExport = async () => {
    setExporting(true)
    setImportMsg("")
    try {
      const data = filteredAssets.map((a) => ({
      Name: a.name, Category: a.category, "Sub-Type": a.subType || "",
      "Serial Number": a.serialNumber || "", SKU: a.sku || "",
      Condition: a.condition, Status: a.status,
      "Purchase Status": a.purchaseStatus || "",
      "Purchase Date": a.purchaseDate || "", "Purchase Price": a.purchasePrice || "",
      "Vendor Name": a.vendorName || "", Branch: normalizeBranch(a.branch), Location: a.location || "",
      "Warranty Expiry": a.warrantyExpiry || "",
      "Insurance Expiry": a.insuranceExpiry || "",
      "AMC Expiry": a.amcExpiry || "",
      Description: a.description || "",
      ...(a.specs ? Object.fromEntries(Object.entries(a.specs).map(([k, v]) => [`Spec: ${k}`, v])) : {}),
    }))
      await exportToExcel(`assets-export-${new Date().toISOString().slice(0,10)}`, "Assets", data)
      setImportMsg(`Export ready: ${data.length} assets`)
    } catch {
      setImportMsg("Export failed — please try again")
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true); setImportMsg("")
    try {
      const rows = await parseFile(file)
      const mapped: Partial<Asset>[] = rows.map(mapAssetRow).filter((r) => r.name).map((r) => ({
        ...r,
        category: r.category as Asset["category"],
        condition: r.condition as Asset["condition"],
        status: r.status as Asset["status"],
        purchaseStatus: r.purchaseStatus as Asset["purchaseStatus"],
      }))
      const { success, failed } = await importAssetsFromCSV(mapped)
      setImportMsg(`Import complete: ${success} added${failed ? `, ${failed} failed` : ""}`)
    } catch {
      setImportMsg("Import failed — upload a valid CSV or XLSX file")
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const getStatusBadgeVariant = (status: Asset["status"]) => {
    switch (status) {
      case "available":   return "accent"
      case "assigned":    return "default"
      case "maintenance": return "warning"
      case "retired": case "lost": case "damaged": return "destructive"
      default:            return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={handleImport} />

      {importMsg && (
        <Alert variant={importMsg.includes("failed") ? "destructive" : "default"}>
          <AlertDescription>{importMsg}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Manage all assets and equipment</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => fileRef.current?.click()} disabled={importing}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {importing ? "Importing..." : "Import CSV / XLSX"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={downloadAssetTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={handleExport} disabled={exporting || filteredAssets.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Exporting..." : "Export Excel"}
          </Button>
          <AddAssetDialog />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search assets..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
              </SelectContent>
            </Select>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[200px]">
                <Building2 className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branchOptions.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <div>
                      <Link
                        to={`/inventory/${asset.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {asset.name}
                      </Link>
                      {asset.serialNumber && (
                        <p className="text-xs text-muted-foreground">
                          SN: {asset.serialNumber}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{asset.category}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(asset.status)}>
                      {asset.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{normalizeBranch(asset.branch)}</TableCell>
                  <TableCell>{asset.location || "-"}</TableCell>
                  <TableCell>{asset.assignedTo ? "Assigned" : "-"}</TableCell>
                  <TableCell>
                    {asset.purchaseDate ? formatDate(asset.purchaseDate) : "-"}
                  </TableCell>
                  <TableCell>
                    {asset.currentValue
                      ? formatCurrency(asset.currentValue)
                      : asset.purchasePrice
                      ? formatCurrency(asset.purchasePrice)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/inventory/${asset.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            View/Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/qr-generator?asset=${asset.id}`}>
                            <QrCode className="mr-2 h-4 w-4" />
                            Generate QR
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-danger"
                          onClick={() => handleDelete(asset.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

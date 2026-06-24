import { useCallback, useEffect, useState } from "react"
import { Plus, Search, Star, Phone, Mail, Globe, MoreHorizontal, Edit, Trash2 } from "lucide-react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"
import type { Vendor } from "@/types"

type VendorForm = {
  name: string
  email: string
  phone: string
  contactPerson: string
  website: string
  status: Vendor["status"]
}

const BLANK_VENDOR: VendorForm = {
  name: "",
  email: "",
  phone: "",
  contactPerson: "",
  website: "",
  status: "active",
}

export function Vendors() {
  const [searchQuery, setSearchQuery] = useState("")
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [form, setForm] = useState<VendorForm>(BLANK_VENDOR)
  const [submitting, setSubmitting] = useState(false)

  const loadVendors = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const { data } = await api.get<Vendor[]>("/vendors")
      setVendors(data)
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load vendors"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVendors()
  }, [loadVendors])

  const setField = (field: keyof VendorForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const openAddDialog = () => {
    setEditingVendor(null)
    setForm(BLANK_VENDOR)
    setError("")
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setForm({
      name: vendor.name,
      email: vendor.email || "",
      phone: vendor.phone || "",
      contactPerson: vendor.contactPerson || "",
      website: vendor.website || "",
      status: vendor.status,
    })
    setError("")
    setIsAddDialogOpen(true)
  }

  const handleSaveVendor = async () => {
    if (!form.name.trim()) {
      setError("Vendor name is required")
      return
    }
    setSubmitting(true)
    setError("")
    const payload = {
      name: form.name.trim(),
      email: form.email || undefined,
      phone: form.phone || undefined,
      contactPerson: form.contactPerson || undefined,
      website: form.website || undefined,
      status: form.status,
    }
    try {
      if (editingVendor) {
        const { data } = await api.put<Vendor>(`/vendors/${editingVendor.id}`, payload)
        setVendors((current) => current.map((vendor) => (vendor.id === data.id ? data : vendor)))
      } else {
        const { data } = await api.post<Vendor>("/vendors", payload)
        setVendors((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)))
      }
      setForm(BLANK_VENDOR)
      setEditingVendor(null)
      setIsAddDialogOpen(false)
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save vendor"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteVendor = async (vendor: Vendor) => {
    if (!confirm(`Delete vendor "${vendor.name}"?`)) return
    try {
      await api.delete(`/vendors/${vendor.id}`)
      setVendors((current) => current.filter((item) => item.id !== vendor.id))
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to delete vendor"))
    }
  }

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Vendors</h1>
          <p className="text-muted-foreground">Manage suppliers and vendors</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingVendor ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
              <DialogDescription>{editingVendor ? "Update supplier details." : "Add a new supplier to your vendor list."}</DialogDescription>
            </DialogHeader>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input id="name" placeholder="Acme Corporation" value={form.name} onChange={(e) => setField("name", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="contact@acme.com" value={form.email} onChange={(e) => setField("email", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="+1 234 567 8900" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input id="contactPerson" placeholder="Business Sales" value={form.contactPerson} onChange={(e) => setField("contactPerson", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" placeholder="https://example.com" value={form.website} onChange={(e) => setField("website", e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveVendor} disabled={submitting}>
                {submitting ? "Saving..." : editingVendor ? "Save Vendor" : "Add Vendor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && !isAddDialogOpen && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search vendors..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Loading vendors...
                  </TableCell>
                </TableRow>
              )}
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {vendor.contactPerson || "No contact person"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {vendor.email && (
                        <p className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {vendor.email}
                        </p>
                      )}
                      {vendor.phone && (
                        <p className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {vendor.phone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {vendor.rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="font-medium">{vendor.rating}</span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{vendor.totalOrders || 0}</TableCell>
                  <TableCell>
                    <Badge
                      variant={vendor.status === "active" ? "accent" : "secondary"}
                    >
                      {vendor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(vendor)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={!vendor.website} onClick={() => vendor.website && window.open(vendor.website, "_blank", "noopener,noreferrer")}>
                          <Globe className="mr-2 h-4 w-4" />
                          Visit Website
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-danger" onClick={() => handleDeleteVendor(vendor)}>
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

import { useState } from "react"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAssetStore } from "@/stores/assetStore"
import { getErrorMessage } from "@/lib/errors"
import { BRANCH_OPTIONS, DEFAULT_BRANCH } from "@/lib/branches"
import type { AssetCategory, AssetStatus } from "@/types"

// ── Spec templates per category ────────────────────────────────────────────────

const ELECTRONICS_SUBTYPES = [
  "Laptop", "Desktop", "Monitor", "Tablet", "Mobile Phone", "Server",
  "Printer", "Scanner", "Camera", "UPS", "Projector", "Network Device", "Other",
]

const MAKES: Record<string, string[]> = {
  "Laptop":         ["Dell", "HP", "Apple", "Lenovo", "Asus", "Acer", "Microsoft", "Samsung", "Toshiba", "Other"],
  "Desktop":        ["Dell", "HP", "Apple", "Lenovo", "Custom Build", "Other"],
  "Mobile Phone":   ["Apple", "Samsung", "OnePlus", "Xiaomi", "Oppo", "Vivo", "Realme", "Google", "Other"],
  "Tablet":         ["Apple", "Samsung", "Lenovo", "Microsoft", "Other"],
  "Monitor":        ["Dell", "HP", "LG", "Samsung", "Asus", "BenQ", "ViewSonic", "Acer", "Other"],
  "Printer":        ["HP", "Canon", "Epson", "Brother", "Xerox", "Ricoh", "Other"],
  "Camera":         ["Canon", "Nikon", "Sony", "Fujifilm", "Panasonic", "Other"],
  "Server":         ["Dell", "HP", "IBM", "Cisco", "Lenovo", "Other"],
  "UPS":            ["APC", "Eaton", "Luminous", "Microtek", "Other"],
  "Projector":      ["Epson", "BenQ", "Sony", "Optoma", "ViewSonic", "Other"],
  "Network Device": ["Cisco", "TP-Link", "D-Link", "Netgear", "Ubiquiti", "Other"],
  "Scanner":        ["HP", "Canon", "Epson", "Fujitsu", "Brother", "Other"],
}

const SPEC_FIELDS: Record<string, { key: string; label: string; placeholder?: string }[]> = {
  "Laptop": [
    { key: "make",       label: "Make",           placeholder: "Dell" },
    { key: "model",      label: "Model",          placeholder: "Latitude 5540" },
    { key: "processor",  label: "Processor",      placeholder: "Intel Core i7-1355U" },
    { key: "ram",        label: "RAM",            placeholder: "16GB DDR5" },
    { key: "storage",    label: "Storage",        placeholder: "512GB NVMe SSD" },
    { key: "display",    label: "Display",        placeholder: '15.6" FHD IPS' },
    { key: "os",         label: "Operating System", placeholder: "Windows 11 Pro" },
    { key: "graphics",   label: "Graphics",       placeholder: "Intel Iris Xe / NVIDIA RTX 3060" },
    { key: "battery",    label: "Battery",        placeholder: "54Wh" },
    { key: "color",      label: "Color",          placeholder: "Black" },
  ],
  "Desktop": [
    { key: "make",      label: "Make",      placeholder: "Dell" },
    { key: "model",     label: "Model",     placeholder: "OptiPlex 7010" },
    { key: "processor", label: "Processor", placeholder: "Intel Core i5-12500" },
    { key: "ram",       label: "RAM",       placeholder: "8GB DDR4" },
    { key: "storage",   label: "Storage",   placeholder: "256GB SSD + 1TB HDD" },
    { key: "os",        label: "OS",        placeholder: "Windows 11 Pro" },
    { key: "graphics",  label: "Graphics",  placeholder: "Intel UHD 770" },
  ],
  "Mobile Phone": [
    { key: "make",    label: "Make",    placeholder: "Apple" },
    { key: "model",   label: "Model",   placeholder: "iPhone 15 Pro" },
    { key: "storage", label: "Storage", placeholder: "256GB" },
    { key: "ram",     label: "RAM",     placeholder: "8GB" },
    { key: "os",      label: "OS",      placeholder: "iOS 17" },
    { key: "color",   label: "Color",   placeholder: "Natural Titanium" },
    { key: "imei",    label: "IMEI",    placeholder: "35XXXXXXXXXXXXXXX" },
  ],
  "Tablet": [
    { key: "make",    label: "Make",    placeholder: "Apple" },
    { key: "model",   label: "Model",   placeholder: "iPad Pro 12.9" },
    { key: "storage", label: "Storage", placeholder: "256GB" },
    { key: "os",      label: "OS",      placeholder: "iPadOS 17" },
    { key: "display", label: "Display", placeholder: '12.9" Liquid Retina' },
  ],
  "Monitor": [
    { key: "make",       label: "Make",       placeholder: "Dell" },
    { key: "model",      label: "Model",      placeholder: "U2722D" },
    { key: "size",       label: "Screen Size", placeholder: '27"' },
    { key: "resolution", label: "Resolution", placeholder: "2560x1440 QHD" },
    { key: "panel",      label: "Panel Type", placeholder: "IPS" },
    { key: "ports",      label: "Ports",      placeholder: "HDMI, DP, USB-C" },
  ],
  "Printer": [
    { key: "make",     label: "Make",       placeholder: "HP" },
    { key: "model",    label: "Model",      placeholder: "LaserJet Pro M404n" },
    { key: "type",     label: "Type",       placeholder: "Laser / Inkjet" },
    { key: "color",    label: "Color/B&W",  placeholder: "Mono / Color" },
    { key: "network",  label: "Network",    placeholder: "Wired / Wireless" },
  ],
  "Server": [
    { key: "make",      label: "Make",      placeholder: "Dell" },
    { key: "model",     label: "Model",     placeholder: "PowerEdge R750" },
    { key: "processor", label: "Processor", placeholder: "Intel Xeon Silver 4314" },
    { key: "ram",       label: "RAM",       placeholder: "64GB ECC" },
    { key: "storage",   label: "Storage",   placeholder: "4x 2TB SAS RAID" },
    { key: "os",        label: "OS",        placeholder: "Windows Server 2022" },
  ],
  "vehicle": [
    { key: "make",         label: "Make",           placeholder: "Maruti Suzuki" },
    { key: "model",        label: "Model",          placeholder: "Swift Dzire" },
    { key: "year",         label: "Year",           placeholder: "2023" },
    { key: "registration", label: "Registration No", placeholder: "MH 01 AB 1234" },
    { key: "fuel_type",    label: "Fuel Type",      placeholder: "Petrol / Diesel / CNG / Electric" },
    { key: "color",        label: "Color",          placeholder: "White" },
    { key: "chassis",      label: "Chassis No",     placeholder: "" },
    { key: "engine",       label: "Engine No",      placeholder: "" },
  ],
  "furniture": [
    { key: "type",       label: "Furniture Type", placeholder: "Chair / Table / Cabinet" },
    { key: "material",   label: "Material",       placeholder: "Wood / Metal / Plastic" },
    { key: "color",      label: "Color",          placeholder: "Black" },
    { key: "dimensions", label: "Dimensions",     placeholder: "120cm x 60cm x 75cm" },
    { key: "brand",      label: "Brand",          placeholder: "Godrej / Durian" },
  ],
  "equipment": [
    { key: "make",    label: "Make / Brand", placeholder: "" },
    { key: "model",   label: "Model",        placeholder: "" },
    { key: "type",    label: "Equipment Type", placeholder: "" },
    { key: "voltage", label: "Voltage/Power", placeholder: "220V / 5kW" },
    { key: "capacity",label: "Capacity",      placeholder: "" },
  ],
  "tools": [
    { key: "make",  label: "Brand", placeholder: "" },
    { key: "model", label: "Model", placeholder: "" },
    { key: "type",  label: "Tool Type", placeholder: "" },
  ],
}

function warrantyStatus(expiryDate: string): { label: string; color: string } {
  if (!expiryDate) return { label: "Not set", color: "text-muted-foreground" }
  const diff = new Date(expiryDate).getTime() - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days < 0)  return { label: "Expired", color: "text-destructive" }
  if (days < 90) return { label: `Expiring in ${days} days`, color: "text-warning" }
  return { label: `Valid (${days} days left)`, color: "text-accent" }
}

interface Props {
  onCreated?: () => void
  children?: React.ReactNode
}

type FormState = {
  name: string; description: string; category: string; subType: string
  condition: string; status: string; branch: string; location: string
  purchaseStatus: string; purchaseDate: string; purchasePrice: string; vendorName: string
  serialNumber: string; sku: string
  warrantyExpiry: string; insuranceExpiry: string; amcExpiry: string
  specs: Record<string, string>
  customSpecs: { key: string; value: string }[]
}

type AssetCondition = "excellent" | "good" | "fair" | "poor"
type PurchaseStatus = "new" | "refurbished"

const BLANK: FormState = {
  name: "", description: "", category: "", subType: "",
  condition: "good", status: "available", branch: DEFAULT_BRANCH, location: "",
  purchaseStatus: "new", purchaseDate: "", purchasePrice: "", vendorName: "",
  serialNumber: "", sku: "",
  warrantyExpiry: "", insuranceExpiry: "", amcExpiry: "",
  specs: {}, customSpecs: [],
}

export function AddAssetDialog({ onCreated, children }: Props) {
  const { addAsset } = useAssetStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>({ ...BLANK })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const set = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }))
  const setSpec = (key: string, val: string) =>
    setForm((f) => ({ ...f, specs: { ...f.specs, [key]: val } }))

  const handleCategoryChange = (cat: string) => {
    setForm((f) => ({ ...f, category: cat, subType: "", specs: {}, customSpecs: [] }))
  }

  const handleSubTypeChange = (sub: string) => {
    setForm((f) => ({ ...f, subType: sub, specs: {}, customSpecs: [] }))
  }

  const specFields = form.category === "electronics"
    ? SPEC_FIELDS[form.subType] || []
    : SPEC_FIELDS[form.category] || []

  const addCustomSpec = () =>
    setForm((f) => ({ ...f, customSpecs: [...f.customSpecs, { key: "", value: "" }] }))

  const updateCustomSpec = (i: number, field: "key" | "value", val: string) =>
    setForm((f) => {
      const cs = [...f.customSpecs]
      cs[i] = { ...cs[i], [field]: val }
      return { ...f, customSpecs: cs }
    })

  const removeCustomSpec = (i: number) =>
    setForm((f) => ({ ...f, customSpecs: f.customSpecs.filter((_, j) => j !== i) }))

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.category) { setError("Name and category are required"); return }
    setLoading(true); setError("")
    try {
      const allSpecs: Record<string, string> = { ...form.specs }
      form.customSpecs.forEach((cs) => { if (cs.key.trim()) allSpecs[cs.key.trim()] = cs.value })
      await addAsset({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category: form.category as AssetCategory,
        subType: form.subType || undefined,
        condition: form.condition as AssetCondition,
        status: form.status as AssetStatus,
        branch: form.branch || undefined,
        location: form.location || undefined,
        purchaseStatus: form.purchaseStatus as PurchaseStatus,
        purchaseDate: form.purchaseDate || undefined,
        purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : undefined,
        vendorName: form.vendorName || undefined,
        serialNumber: form.serialNumber || undefined,
        sku: form.sku || undefined,
        warrantyExpiry: form.warrantyExpiry || undefined,
        insuranceExpiry: form.insuranceExpiry || undefined,
        amcExpiry: form.amcExpiry || undefined,
        specs: Object.keys(allSpecs).length ? allSpecs : undefined,
      })
      setForm({ ...BLANK })
      setOpen(false)
      onCreated?.()
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create asset"))
    } finally {
      setLoading(false)
    }
  }

  const wStatus = warrantyStatus(form.warrantyExpiry)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button><Plus className="mr-2 h-4 w-4" />Add Asset</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
        </DialogHeader>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="space-y-5 py-2">
          {/* ── Basic Info ── */}
          <Section title="Basic Information">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Asset Name *</Label>
                <Input placeholder="Dell Latitude 5540" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="tools">Tools</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.category === "electronics" && (
                <div className="space-y-1.5">
                  <Label>Sub-Type</Label>
                  <Select value={form.subType} onValueChange={handleSubTypeChange}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {ELECTRONICS_SUBTYPES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Condition</Label>
                <Select value={form.condition} onValueChange={(v) => set("condition", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Branch</Label>
                <Select value={form.branch} onValueChange={(v) => set("branch", v)}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {BRANCH_OPTIONS.map((branch) => (
                      <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input placeholder="HQ - Floor 2" value={form.location} onChange={(e) => set("location", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Optional description..." rows={2}
                value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
          </Section>

          {/* ── Category Specs ── */}
          {specFields.length > 0 && (
            <Section title={`${form.subType || form.category} Specifications`}>
              <div className="grid grid-cols-2 gap-3">
                {specFields.map((f) => {
                  if (f.key === "make" && (MAKES[form.subType] || MAKES[form.category])) {
                    const makeOptions = MAKES[form.subType] || MAKES[form.category] || []
                    return (
                      <div key={f.key} className="space-y-1.5">
                        <Label>{f.label}</Label>
                        <Select value={form.specs[f.key] || ""} onValueChange={(v) => setSpec(f.key, v)}>
                          <SelectTrigger><SelectValue placeholder="Select make" /></SelectTrigger>
                          <SelectContent>
                            {makeOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  }
                  return (
                    <div key={f.key} className="space-y-1.5">
                      <Label>{f.label}</Label>
                      <Input placeholder={f.placeholder} value={form.specs[f.key] || ""}
                        onChange={(e) => setSpec(f.key, e.target.value)} />
                    </div>
                  )
                })}
              </div>

              {/* Custom spec rows */}
              {form.customSpecs.length > 0 && (
                <div className="space-y-2 mt-2">
                  {form.customSpecs.map((cs, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <Input placeholder="Field name (e.g. IMEI)" value={cs.key}
                        onChange={(e) => updateCustomSpec(i, "key", e.target.value)} />
                      <Input placeholder="Value" value={cs.value}
                        onChange={(e) => updateCustomSpec(i, "value", e.target.value)} />
                      <Button variant="ghost" size="icon" onClick={() => removeCustomSpec(i)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" className="mt-2" onClick={addCustomSpec}>
                <Plus className="mr-2 h-3.5 w-3.5" />Add Custom Field
              </Button>
            </Section>
          )}

          {/* If no spec template, still allow custom fields */}
          {specFields.length === 0 && form.category && (
            <Section title="Specifications">
              {form.customSpecs.length > 0 && (
                <div className="space-y-2">
                  {form.customSpecs.map((cs, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <Input placeholder="Field name" value={cs.key}
                        onChange={(e) => updateCustomSpec(i, "key", e.target.value)} />
                      <Input placeholder="Value" value={cs.value}
                        onChange={(e) => updateCustomSpec(i, "value", e.target.value)} />
                      <Button variant="ghost" size="icon" onClick={() => removeCustomSpec(i)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={addCustomSpec}>
                <Plus className="mr-2 h-3.5 w-3.5" />Add Spec Field
              </Button>
            </Section>
          )}

          <Separator />

          {/* ── Purchase Info ── */}
          <Section title="Purchase Information">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Purchase Status</Label>
                <Select value={form.purchaseStatus} onValueChange={(v) => set("purchaseStatus", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="refurbished">Refurbished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Vendor / Purchased From</Label>
                <Input placeholder="Dell India / Amazon / Local shop" value={form.vendorName}
                  onChange={(e) => set("vendorName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Purchase Date</Label>
                <Input type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Purchase Cost (₹)</Label>
                <Input type="number" placeholder="85000" value={form.purchasePrice}
                  onChange={(e) => set("purchasePrice", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Serial Number</Label>
                <Input placeholder="C02XYZ123" value={form.serialNumber}
                  onChange={(e) => set("serialNumber", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>SKU / Asset Tag</Label>
                <Input placeholder="LAT5540-001" value={form.sku}
                  onChange={(e) => set("sku", e.target.value)} />
              </div>
            </div>
          </Section>

          <Separator />

          {/* ── Warranty & Service ── */}
          <Section title="Warranty & Service">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Warranty Expiry</Label>
                  {form.warrantyExpiry && (
                    <span className={`text-xs font-medium ${wStatus.color}`}>{wStatus.label}</span>
                  )}
                </div>
                <Input type="date" value={form.warrantyExpiry}
                  onChange={(e) => set("warrantyExpiry", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Insurance Expiry</Label>
                  {form.insuranceExpiry && (
                    <span className={`text-xs ${warrantyStatus(form.insuranceExpiry).color}`}>
                      {warrantyStatus(form.insuranceExpiry).label}
                    </span>
                  )}
                </div>
                <Input type="date" value={form.insuranceExpiry}
                  onChange={(e) => set("insuranceExpiry", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>AMC Expiry</Label>
                  {form.amcExpiry && (
                    <span className={`text-xs ${warrantyStatus(form.amcExpiry).color}`}>
                      {warrantyStatus(form.amcExpiry).label}
                    </span>
                  )}
                </div>
                <Input type="date" value={form.amcExpiry}
                  onChange={(e) => set("amcExpiry", e.target.value)} />
              </div>
            </div>
          </Section>
        </div>

        <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-background pb-1">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Asset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  )
}

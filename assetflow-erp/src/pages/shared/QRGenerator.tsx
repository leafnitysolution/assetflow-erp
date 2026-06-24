import { useState, useRef, useCallback } from "react"
import { Download, Printer, QrCode, Copy, Check, CheckSquare, Square, Package, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QRCodeSVG } from "qrcode.react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAssetStore } from "@/stores/assetStore"
import type { Asset } from "@/types"

/* ─── helper: SVG QR → PNG blob ─────────────────────────────────────────── */
function qrToPNG(value: string, assetName: string, serialNo: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const SIZE = 300
    const LABEL_H = 60
    const canvas = document.createElement("canvas")
    canvas.width = SIZE
    canvas.height = SIZE + LABEL_H

    const ctx = canvas.getContext("2d")
    if (!ctx) return reject(new Error("no ctx"))

    // white background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // render QR to temp canvas via qrcode.react's canvas API
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = SIZE
    tempCanvas.height = SIZE

    // use a hidden div to render QRCodeCanvas
    const container = document.createElement("div")
    container.style.cssText = "position:fixed;top:-9999px;left:-9999px;"
    document.body.appendChild(container)

    const qrCanvas = document.createElement("canvas")
    container.appendChild(qrCanvas)

    // Draw QR using qrcode lib directly
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(qrCanvas, value, { width: SIZE, margin: 2, color: { dark: "#000000", light: "#ffffff" } }, (err) => {
        document.body.removeChild(container)
        if (err) return reject(err)
        ctx.drawImage(qrCanvas, 0, 0, SIZE, SIZE)

        // labels
        ctx.fillStyle = "#111827"
        ctx.font = "bold 14px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(assetName.length > 30 ? assetName.slice(0, 30) + "…" : assetName, SIZE / 2, SIZE + 22)

        ctx.fillStyle = "#6b7280"
        ctx.font = "11px sans-serif"
        ctx.fillText(serialNo || value, SIZE / 2, SIZE + 42)

        ctx.strokeStyle = "#e5e7eb"
        ctx.lineWidth = 1
        ctx.strokeRect(0, 0, SIZE, SIZE + LABEL_H)

        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error("toBlob failed"))
        }, "image/png")
      })
    }).catch(reject)
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ─── Component ────────────────────────────────────────────────────────────── */
export function QRGenerator() {
  const { assets } = useAssetStore()
  const [selectedAsset, setSelectedAsset] = useState("")
  const [copied, setCopied] = useState(false)
  const [selectedBulk, setSelectedBulk] = useState<Set<string>>(new Set())
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  const currentAsset = assets.find((a) => a.id === selectedAsset)
  const qrValue = currentAsset ? (currentAsset.qrCode || `asset:${currentAsset.id}`) : "https://assetflow.example.com"

  /* ── single download ── */
  const handleDownloadSingle = () => {
    if (!qrRef.current || !currentAsset) return
    const svg = qrRef.current.querySelector("svg")
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const SIZE = 320
    const canvas = document.createElement("canvas")
    canvas.width = SIZE; canvas.height = SIZE + 60
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, SIZE, SIZE)
      ctx.fillStyle = "#111827"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center"
      ctx.fillText(currentAsset.name.slice(0, 35), SIZE / 2, SIZE + 22)
      ctx.fillStyle = "#6b7280"; ctx.font = "11px sans-serif"
      ctx.fillText(currentAsset.serialNumber || qrValue, SIZE / 2, SIZE + 42)
      const a = document.createElement("a")
      a.download = `qr-${currentAsset.name.replace(/\s+/g, "-")}.png`
      a.href = canvas.toDataURL("image/png")
      a.click()
    }
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(qrValue)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /* ── bulk selection ── */
  const toggleBulk = (id: string) => {
    setSelectedBulk((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelectedBulk(new Set(assets.map((a) => a.id)))
  const clearAll = () => setSelectedBulk(new Set())

  /* ── bulk download ── */
  const handleBulkDownload = useCallback(async () => {
    const toDownload = assets.filter((a) => selectedBulk.has(a.id))
    if (toDownload.length === 0) return

    setBulkProgress({ done: 0, total: toDownload.length })

    for (let i = 0; i < toDownload.length; i++) {
      const asset = toDownload[i]
      const code = asset.qrCode || `asset:${asset.id}`
      try {
        const blob = await qrToPNG(code, asset.name, asset.serialNumber || code)
        downloadBlob(blob, `qr-${asset.name.replace(/\s+/g, "-")}.png`)
      } catch {
        // skip failed
      }
      setBulkProgress({ done: i + 1, total: toDownload.length })
      // small delay so browser can process each download
      await new Promise((r) => setTimeout(r, 400))
    }

    setBulkProgress(null)
  }, [assets, selectedBulk])

  const getVariant = (status: Asset["status"]) =>
    status === "available" ? "accent" : status === "assigned" ? "default" : "warning"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">QR Code Generator</h1>
        <p className="text-muted-foreground">Generate and download QR codes for your assets</p>
      </div>

      <Tabs defaultValue="single">
        <TabsList className="mb-4">
          <TabsTrigger value="single"><QrCode className="mr-2 h-4 w-4" />Single QR</TabsTrigger>
          <TabsTrigger value="bulk"><Package className="mr-2 h-4 w-4" />Bulk Download</TabsTrigger>
        </TabsList>

        {/* ── SINGLE ── */}
        <TabsContent value="single">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Select Asset</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Asset</Label>
                  <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                    <SelectTrigger><SelectValue placeholder="Choose an asset" /></SelectTrigger>
                    <SelectContent>
                      {assets.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentAsset && (
                  <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                    {[
                      ["Name", currentAsset.name],
                      ["Category", currentAsset.category],
                      ["Serial", currentAsset.serialNumber || "N/A"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-medium capitalize">{v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={getVariant(currentAsset.status)} className="capitalize">{currentAsset.status}</Badge>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>QR Content</Label>
                  <div className="flex gap-2">
                    <Input value={qrValue} readOnly className="font-mono text-sm" />
                    <Button variant="outline" size="icon" onClick={handleCopy}>
                      {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div ref={qrRef} className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border-2 border-dashed">
                  {selectedAsset ? (
                    <>
                      <QRCodeSVG value={qrValue} size={220} level="M" includeMargin />
                      <div className="mt-3 text-center">
                        <p className="font-bold text-gray-900 text-sm">{currentAsset?.name}</p>
                        <p className="text-xs text-gray-500">{currentAsset?.serialNumber || currentAsset?.sku || qrValue}</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <QrCode className="h-14 w-14 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">Select an asset to preview</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" disabled={!selectedAsset} onClick={handleDownloadSingle}>
                    <Download className="mr-2 h-4 w-4" />Download PNG
                  </Button>
                  <Button variant="outline" className="flex-1" disabled={!selectedAsset} onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />Print
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── BULK ── */}
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle>Bulk QR Download</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select assets and download their QR codes as PNG files
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    <CheckSquare className="mr-2 h-4 w-4" />Select All ({assets.length})
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearAll} disabled={selectedBulk.size === 0}>
                    <Square className="mr-2 h-4 w-4" />Clear
                  </Button>
                  <Button
                    size="sm"
                    disabled={selectedBulk.size === 0 || !!bulkProgress}
                    onClick={handleBulkDownload}
                  >
                    {bulkProgress ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {bulkProgress.done}/{bulkProgress.total}…
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download Selected ({selectedBulk.size})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* progress bar */}
              {bulkProgress && (
                <div className="mb-4 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Downloading QR codes…</span>
                    <span>{Math.round((bulkProgress.done / bulkProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="divide-y">
                {assets.map((asset) => {
                  const checked = selectedBulk.has(asset.id)
                  return (
                    <div
                      key={asset.id}
                      onClick={() => toggleBulk(asset.id)}
                      className={`flex items-center gap-4 py-3 px-2 rounded-lg cursor-pointer transition-colors select-none ${
                        checked ? "bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      {/* checkbox */}
                      <div className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        checked ? "bg-primary border-primary" : "border-muted-foreground/40"
                      }`}>
                        {checked && <Check className="h-3 w-3 text-white" />}
                      </div>

                      {/* QR preview */}
                      <div className="h-12 w-12 flex-shrink-0 bg-white rounded border p-1">
                        <QRCodeSVG
                          value={asset.qrCode || `asset:${asset.id}`}
                          size={40}
                          level="L"
                        />
                      </div>

                      {/* info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {asset.serialNumber || asset.sku || `ID: ${asset.id}`}
                        </p>
                      </div>

                      {/* badges */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={getVariant(asset.status)} className="capitalize text-xs">
                          {asset.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize hidden sm:inline">
                          {asset.category}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {assets.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>No assets found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { useEffect, useRef, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { X, Camera, Scan, ArrowLeft, Package, Upload, Keyboard, CheckCircle, AlertCircle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAssetStore } from "@/stores/assetStore"
import { useUserStore } from "@/stores/userStore"
import { useAuthStore } from "@/stores/authStore"
import type { Asset } from "@/types"

type ScanMode = "camera" | "manual" | "upload"

export function QRScanner() {
  const navigate = useNavigate()
  const { assets } = useAssetStore()
  const { getUserById } = useUserStore()
  const { user: currentUser } = useAuthStore()
  const isMember = currentUser?.role === "member"

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [scanResult, setScanResult] = useState<Asset | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState<string | null>(null)
  const [mode, setMode] = useState<ScanMode>("camera")
  const [manualCode, setManualCode] = useState("")
  const [cameraReady, setCameraReady] = useState(false)
  const [scanning, setScanning] = useState(false)

  const findAsset = useCallback((code: string): Asset | undefined => {
    const cleaned = code.trim()
    return assets.find(
      (a) =>
        a.qrCode === cleaned ||
        a.id === cleaned ||
        a.id === cleaned.replace("asset:", "") ||
        a.serialNumber === cleaned
    )
  }, [assets])

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setScanning(false)
    setCameraReady(false)
  }, [])

  const handleFound = useCallback((code: string) => {
    stopCamera()
    const asset = findAsset(code)
    if (asset) {
      setScanResult(asset)
      setScanError(null)
      setNotFound(null)
    } else {
      setNotFound(code)
    }
  }, [findAsset, stopCamera])

  const startDetection = useCallback(() => {
    // Use BarcodeDetector if available (Chrome/Edge)
    if ("BarcodeDetector" in window) {
      // @ts-expect-error BarcodeDetector not in all TS libs
      const detector = new window.BarcodeDetector({ formats: ["qr_code", "code_128", "ean_13", "code_39"] })
      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return
        const video = videoRef.current
        if (video.readyState !== video.HAVE_ENOUGH_DATA) return
        try {
          const barcodes = await detector.detect(video)
          if (barcodes.length > 0) {
            handleFound(barcodes[0].rawValue)
          }
        } catch {
          // continue scanning
        }
      }, 300)
    } else {
      // Fallback: draw frames to canvas for manual inspection
      intervalRef.current = setInterval(() => {
        if (!videoRef.current || !canvasRef.current) return
        const video = videoRef.current
        const canvas = canvasRef.current
        if (video.readyState !== video.HAVE_ENOUGH_DATA) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
      }, 100)
    }
  }, [handleFound])

  const startCamera = useCallback(async () => {
    setScanError(null)
    setScanning(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setCameraReady(true)
          startDetection()
        }
      }
    } catch {
      setScanError("Camera access denied. Use manual entry or upload a QR image.")
      setScanning(false)
    }
  }, [startDetection])

  useEffect(() => {
    if (mode === "camera") {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [mode, startCamera, stopCamera])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    handleFound(manualCode.trim())
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!("BarcodeDetector" in window)) {
      setScanError("Barcode detection not supported in this browser. Try Chrome or Edge, or use manual entry.")
      return
    }

    try {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      img.onload = async () => {
        // @ts-expect-error BarcodeDetector not in all TS libs
        const detector = new window.BarcodeDetector({ formats: ["qr_code", "code_128", "ean_13", "code_39"] })
        const barcodes = await detector.detect(img)
        URL.revokeObjectURL(img.src)
        if (barcodes.length > 0) {
          handleFound(barcodes[0].rawValue)
        } else {
          setScanError("No barcode or QR code found in the image.")
        }
      }
    } catch {
      setScanError("Failed to read image.")
    }
  }

  const reset = () => {
    setScanResult(null)
    setNotFound(null)
    setScanError(null)
    setManualCode("")
    if (mode === "camera") startCamera()
  }

  const getStatusBadgeVariant = (status: Asset["status"]) => {
    switch (status) {
      case "available": return "accent"
      case "assigned": return "default"
      case "maintenance": return "warning"
      default: return "destructive"
    }
  }

  // --- RESULT VIEW ---
  if (scanResult) {
    const assignedUser = scanResult.assignedTo ? getUserById(scanResult.assignedTo) : null

    // Member: show only assigned person + auto-redirect button
    if (isMember) {
      return (
        <div className="max-w-md mx-auto space-y-6 p-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 text-accent">
              <CheckCircle className="h-5 w-5" />
              <h1 className="font-heading text-xl font-bold">Asset Scanned</h1>
            </div>
          </div>
          <Card className="border-accent/30">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Package className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-base">{scanResult.name}</h2>
                  <p className="text-xs text-muted-foreground capitalize">{scanResult.category}</p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/40 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned To</p>
                    <p className="font-semibold">
                      {assignedUser ? assignedUser.name : scanResult.assignedTo ? scanResult.assignedTo : "Not assigned"}
                    </p>
                  </div>
                </div>
                {assignedUser?.department && (
                  <p className="text-xs text-muted-foreground pl-8">Department: {assignedUser.department}</p>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <Button className="flex-1" onClick={() => navigate(currentUser?.role === "member" ? "/member/dashboard" : "/admin/dashboard")}>
                  Go to Dashboard
                </Button>
                <Button variant="outline" size="icon" onClick={reset}>
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Admin / Super-admin: full detail view
    return (
      <div className="max-w-md mx-auto space-y-6 p-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 text-accent">
            <CheckCircle className="h-5 w-5" />
            <h1 className="font-heading text-xl font-bold">Asset Found!</h1>
          </div>
        </div>

        <Card className="border-accent/30">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-lg">{scanResult.name}</h2>
                <Badge variant={getStatusBadgeVariant(scanResult.status)} className="capitalize">
                  {scanResult.status}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 text-sm border rounded-lg p-3 bg-muted/30">
              {[
                { label: "Category", value: scanResult.category },
                { label: "Condition", value: scanResult.condition },
                { label: "Location", value: scanResult.location || "Not specified" },
                { label: "Serial No.", value: scanResult.serialNumber || "N/A" },
                { label: "Assigned To", value: assignedUser ? assignedUser.name : (scanResult.assignedTo || "Unassigned") },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium capitalize">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => navigate(`/inventory/${scanResult.id}`)}>
                View Full Details
              </Button>
              <Button variant="outline" className="flex-1" onClick={reset}>
                <Scan className="mr-2 h-4 w-4" />
                Scan Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- NOT FOUND VIEW ---
  if (notFound) {
    return (
      <div className="max-w-md mx-auto space-y-6 p-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-heading text-xl font-bold">Asset Not Found</h1>
        </div>
        <Card className="border-destructive/30">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <p className="font-medium">No asset matched:</p>
              <code className="text-sm bg-muted px-2 py-1 rounded">{notFound}</code>
            </div>
            <Button onClick={reset} className="w-full">
              <Scan className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- SCANNER VIEW ---
  return (
    <div className="max-w-lg mx-auto space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-heading text-2xl font-bold">QR / Barcode Scanner</h1>
        </div>
        {mode === "camera" && scanning && (
          <Button variant="ghost" size="icon" onClick={stopCamera}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 border rounded-lg p-1 bg-muted/30">
        {[
          { id: "camera" as ScanMode, icon: <Camera className="h-4 w-4" />, label: "Camera" },
          { id: "manual" as ScanMode, icon: <Keyboard className="h-4 w-4" />, label: "Manual" },
          { id: "upload" as ScanMode, icon: <Upload className="h-4 w-4" />, label: "Upload" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setMode(tab.id); setScanError(null) }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              mode === tab.id
                ? "bg-white dark:bg-card shadow text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Camera Mode */}
      {mode === "camera" && (
        <Card>
          <CardContent className="p-4 space-y-4">
            {scanError ? (
              <div className="text-center py-6 space-y-3">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                <p className="text-sm text-muted-foreground">{scanError}</p>
                <Button onClick={() => { setScanError(null); startCamera() }}>
                  <Camera className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                {/* Scan overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-48 h-48">
                    <div className="absolute inset-0 border-2 border-white/30 rounded-lg" />
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                    {cameraReady && (
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/70 animate-pulse" />
                    )}
                  </div>
                </div>
                {!cameraReady && scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <p className="text-white text-sm">Starting camera...</p>
                  </div>
                )}
              </div>
            )}
            {!scanError && (
              <p className="text-center text-sm text-muted-foreground">
                {cameraReady
                  ? "Point at a QR code or barcode to scan automatically"
                  : "Requesting camera permission..."}
              </p>
            )}
            {!("BarcodeDetector" in window) && cameraReady && (
              <p className="text-center text-xs text-warning bg-warning/10 rounded p-2">
                Auto-detection not supported in this browser. Use manual entry or try Chrome/Edge.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual Entry Mode */}
      {mode === "manual" && (
        <Card>
          <CardHeader>
            <CardTitle>Enter Code Manually</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Asset ID, QR Code, or Serial Number</Label>
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g. asset:1 or C02XYZ123"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Try: <code className="bg-muted px-1 rounded">asset:1</code>,{" "}
                  <code className="bg-muted px-1 rounded">asset:2</code>, ...,{" "}
                  <code className="bg-muted px-1 rounded">asset:6</code>
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={!manualCode.trim()}>
                <Scan className="mr-2 h-4 w-4" />
                Look Up Asset
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Upload Mode */}
      {mode === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload QR Code Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scanError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {scanError}
              </div>
            )}
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-muted-foreground/30 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Click to upload QR code image</span>
              <span className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, WEBP</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            {!("BarcodeDetector" in window) && (
              <p className="text-xs text-center text-muted-foreground">
                Image scanning requires Chrome or Edge browser.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick test assets */}
      <Card className="bg-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Quick Test — Click to look up:</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {assets.slice(0, 6).map((a) => (
              <button
                key={a.id}
                onClick={() => handleFound(a.qrCode || `asset:${a.id}`)}
                className="text-xs px-2 py-1 rounded-md bg-background border hover:bg-primary hover:text-white hover:border-primary transition-colors"
              >
                {a.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

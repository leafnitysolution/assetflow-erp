import type { CellValue, Row, Worksheet } from "exceljs"

// ── Export ────────────────────────────────────────────────────────────────────

export function exportToCSV(filename: string, rows: (string | number | undefined | null)[][]) {
  const csv = rows
    .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n")
  downloadBlob(csv, `${filename}.csv`, "text/csv")
}

export async function exportToExcel(filename: string, sheetName: string, data: Record<string, unknown>[]) {
  const { Workbook } = await import("exceljs")
  const wb = new Workbook()
  const ws = wb.addWorksheet(sheetName.slice(0, 31))
  const headers = data.length ? Object.keys(data[0]) : []
  ws.addRow(headers)
  data.forEach((row) => {
    ws.addRow(headers.map((header) => row[header] ?? ""))
  })
  ws.getRow(1).font = { bold: true }
  ws.columns.forEach((column) => {
    let maxLength = 12
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      maxLength = Math.max(maxLength, String(cell.value ?? "").length + 2)
    })
    column.width = Math.min(maxLength, 48)
  })
  const buffer = await wb.xlsx.writeBuffer()
  downloadBlob(buffer, `${filename}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
}

function downloadBlob(content: BlobPart, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.rel = "noopener"
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ── Parse ─────────────────────────────────────────────────────────────────────

type ParsedRow = Record<string, string>

export async function parseFile(file: File): Promise<ParsedRow[]> {
  const extension = file.name.split(".").pop()?.toLowerCase()
  if (extension === "csv") {
    return parseCSV(await file.text())
  }
  if (extension === "xlsx") {
    const { Workbook } = await import("exceljs")
    const wb = new Workbook()
    await wb.xlsx.load(await file.arrayBuffer())
    const ws = wb.worksheets[0]
    if (!ws) return []
    return worksheetToRows(ws)
  }
  throw new Error("Unsupported file type. Please upload a CSV or XLSX file.")
}

function worksheetToRows(ws: Worksheet): ParsedRow[] {
  const headerRow = ws.getRow(1)
  const headers = rowValues(headerRow).map(stringifyCellValue)
  const rows: ParsedRow[] = []
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const values = rowValues(row).map(stringifyCellValue)
    const parsed: ParsedRow = {}
    headers.forEach((header, index) => {
      if (header) parsed[header] = values[index] || ""
    })
    if (Object.values(parsed).some(Boolean)) rows.push(parsed)
  })
  return rows
}

function rowValues(row: Row): CellValue[] {
  if (Array.isArray(row.values)) return row.values.slice(1) as CellValue[]
  return Object.values(row.values) as CellValue[]
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim())
  if (lines.length === 0) return []
  const headers = parseCSVLine(lines[0])
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line)
    const row: ParsedRow = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ""
    })
    return row
  })
}

function parseCSVLine(line: string) {
  const values: string[] = []
  let current = ""
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"' && line[i + 1] === '"') {
      current += '"'
      i++
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === "," && !quoted) {
      values.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  values.push(current.trim())
  return values
}

function stringifyCellValue(value: CellValue) {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === "object") {
    if ("text" in value && value.text) return String(value.text)
    if ("result" in value && value.result !== undefined) return stringifyCellValue(value.result)
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("")
    }
    if ("hyperlink" in value && value.hyperlink) return String(value.hyperlink)
    return JSON.stringify(value)
  }
  return String(value)
}

// ── Asset CSV helpers ─────────────────────────────────────────────────────────

export const ASSET_CSV_HEADERS = [
  "name", "category", "subType", "serialNumber", "sku", "condition", "status",
  "purchaseStatus", "purchaseDate", "purchasePrice", "vendorName",
  "warrantyExpiry", "insuranceExpiry", "amcExpiry", "branch", "location", "description",
]

export const ASSET_CSV_HEADER_LABELS = [
  "Name *", "Category *", "Sub-Type", "Serial Number", "SKU", "Condition", "Status",
  "Purchase Status", "Purchase Date (YYYY-MM-DD)", "Purchase Price", "Vendor Name",
  "Warranty Expiry (YYYY-MM-DD)", "Insurance Expiry (YYYY-MM-DD)", "AMC Expiry (YYYY-MM-DD)",
  "Branch", "Location", "Description",
]

export async function downloadAssetTemplate() {
  const { Workbook } = await import("exceljs")
  const wb = new Workbook()
  const ws = wb.addWorksheet("Assets")
  ws.addRow(ASSET_CSV_HEADER_LABELS)
  ws.addRow(["Dell Latitude 5540", "electronics", "Laptop", "SN123456", "LAT5540", "good", "available",
    "new", "2024-01-15", "85000", "Dell India", "2027-01-15", "", "", "Head Office", "HQ - Floor 2", "Work laptop"])
  ws.getRow(1).font = { bold: true }
  const buffer = await wb.xlsx.writeBuffer()
  downloadBlob(buffer, "asset-import-template.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
}

export function mapAssetRow(row: ParsedRow) {
  const get = (key: string) => {
    // Try both label and raw key
    const labelKey = ASSET_CSV_HEADER_LABELS.find((l) => l.replace(" *", "") === key)
    return (labelKey ? row[labelKey] : undefined) ?? row[key] ?? ""
  }

  return {
    name:           get("Name") || get("name"),
    category:       (get("Category") || get("category") || "other").toLowerCase(),
    subType:        get("Sub-Type") || get("subType") || "",
    serialNumber:   get("Serial Number") || get("serialNumber") || "",
    sku:            get("SKU") || get("sku") || "",
    condition:      (get("Condition") || get("condition") || "good").toLowerCase(),
    status:         (get("Status") || get("status") || "available").toLowerCase(),
    purchaseStatus: (get("Purchase Status") || get("purchaseStatus") || "new").toLowerCase(),
    purchaseDate:   get("Purchase Date (YYYY-MM-DD)") || get("purchaseDate") || "",
    purchasePrice:  parseFloat(get("Purchase Price") || get("purchasePrice") || "0") || undefined,
    vendorName:     get("Vendor Name") || get("vendorName") || "",
    warrantyExpiry: get("Warranty Expiry (YYYY-MM-DD)") || get("warrantyExpiry") || "",
    insuranceExpiry:get("Insurance Expiry (YYYY-MM-DD)") || get("insuranceExpiry") || "",
    amcExpiry:      get("AMC Expiry (YYYY-MM-DD)") || get("amcExpiry") || "",
    branch:         get("Branch") || get("branch") || "",
    location:       get("Location") || get("location") || "",
    description:    get("Description") || get("description") || "",
  }
}

// ── Member CSV helpers ────────────────────────────────────────────────────────

export const MEMBER_CSV_HEADERS  = ["name", "email", "department", "branch", "phone", "role", "password"]
export const MEMBER_CSV_LABELS   = ["Name *", "Email *", "Department", "Branch", "Phone", "Role (member/admin)", "Initial Password"]

export async function downloadMemberTemplate() {
  const { Workbook } = await import("exceljs")
  const wb = new Workbook()
  const ws = wb.addWorksheet("Members")
  ws.addRow(MEMBER_CSV_LABELS)
  ws.addRow(["Jane Smith", "jane.smith@company.com", "Engineering", "Head Office", "+91 9876543210", "member", "ChangeMe123!"])
  ws.getRow(1).font = { bold: true }
  const buffer = await wb.xlsx.writeBuffer()
  downloadBlob(buffer, "member-import-template.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
}

export function mapMemberRow(row: ParsedRow) {
  const get = (labelKey: string, rawKey: string) =>
    row[labelKey] ?? row[labelKey.replace(" *", "")] ?? row[rawKey] ?? ""
  return {
    name:       get("Name *", "name"),
    email:      get("Email *", "email"),
    department: get("Department", "department"),
    branch:     get("Branch", "branch"),
    phone:      get("Phone", "phone"),
    role:       (get("Role (member/admin)", "role") || "member").toLowerCase(),
    password:   get("Initial Password", "password"),
  }
}

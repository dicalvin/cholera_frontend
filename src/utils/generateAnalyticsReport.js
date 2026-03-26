import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const formatDate = (row) => {
  if (row.reportingDate && !Number.isNaN(row.reportingDate.valueOf?.())) {
    return row.reportingDate.toISOString().split('T')[0]
  }
  return String(row.reportingDateRaw || '—')
}

/** Simple inline SVG brand mark → PNG data URL (browser only). */
function brandMarkDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="14" fill="#1d4ed8"/>
    <path d="M32 12c-6 10-12 18-12 26a12 12 0 0 0 24 0c0-8-6-16-12-26z" fill="#fff" opacity="0.95"/>
    <circle cx="32" cy="38" r="4" fill="#1d4ed8"/>
  </svg>`
  return new Promise((resolve, reject) => {
    const img = new Image()
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 64
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, 64, 64)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/png'))
      } catch (e) {
        URL.revokeObjectURL(url)
        reject(e)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Logo load failed'))
    }
    img.src = url
  })
}

function buildFilterSummary({ dateRange, selectedRegions, selectedDistricts }) {
  const parts = []
  if (dateRange?.start || dateRange?.end) {
    parts.push(
      `Dates: ${dateRange?.start || '…'} → ${dateRange?.end || '…'}`,
    )
  }
  if (selectedRegions?.length) {
    parts.push(`Regions: ${selectedRegions.join(', ')}`)
  }
  if (selectedDistricts?.length) {
    parts.push(`Districts: ${selectedDistricts.join(', ')}`)
  }
  return parts.length ? parts.join('  |  ') : 'Full dataset (no location/date filters)'
}

const safeNumber = (value) => {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

const meanOf = (nums) => {
  if (!nums.length) return 0
  const total = nums.reduce((acc, n) => acc + n, 0)
  return total / nums.length
}

const modeOfRoundedInt = (nums) => {
  if (!nums.length) return 0
  const counts = new Map()
  nums.forEach((n) => {
    const k = Math.round(n)
    counts.set(k, (counts.get(k) || 0) + 1)
  })
  let bestKey = 0
  let bestCount = -1
  counts.forEach((count, key) => {
    if (count > bestCount) {
      bestCount = count
      bestKey = key
    }
  })
  return bestKey
}

const computeRecordStats = (rows) => {
  const suspected = (rows || [])
    .map((r) => safeNumber(r?.sCh ?? r?.suspected))
    .filter((n) => Number.isFinite(n))
  const confirmed = (rows || [])
    .map((r) => safeNumber(r?.cCh ?? r?.confirmed))
    .filter((n) => Number.isFinite(n))
  const deaths = (rows || [])
    .map((r) => safeNumber(r?.deaths ?? r?.death))
    .filter((n) => Number.isFinite(n))

  return {
    suspected: {
      mean: meanOf(suspected),
      mode: modeOfRoundedInt(suspected),
    },
    confirmed: {
      mean: meanOf(confirmed),
      mode: modeOfRoundedInt(confirmed),
    },
    deaths: {
      mean: meanOf(deaths),
      mode: modeOfRoundedInt(deaths),
    },
  }
}

const hexToRgb = (hex) => {
  const h = String(hex || '').replace('#', '')
  if (h.length !== 6) return { r: 0, g: 0, b: 0 }
  const n = parseInt(h, 16)
  // eslint-disable-next-line no-bitwise
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

const sampleEvery = (arr, maxPoints) => {
  if (!Array.isArray(arr) || arr.length <= maxPoints) return arr
  const step = Math.ceil(arr.length / maxPoints)
  const out = arr.filter((_, i) => i % step === 0)
  const last = arr[arr.length - 1]
  if (out.length && out[out.length - 1] !== last) out.push(last)
  return out
}

const drawChartFrame = (doc, { x, y, w, h }) => {
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.2)
  doc.rect(x, y, w, h)
}

const drawTimeSeriesLineChart = ({
  doc,
  title,
  data,
  yKey,
  colorHex,
  xKey = 'label',
  cursorY,
  pageW,
  maxPoints = 18,
  cellX = 14,
  cellW = null,
}) => {
  const paddingX = 2
  const contentW = cellW ?? pageW - 28
  const chartW = contentW - paddingX * 2
  const boxH = 38

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text(title, cellX, cursorY)

  const innerY = cursorY + 3.2
  const chartX = cellX + paddingX
  drawChartFrame(doc, { x: chartX, y: innerY, w: chartW, h: boxH })

  const sampled = sampleEvery(data || [], maxPoints)
  const values = sampled.map((d) => safeNumber(d?.[yKey]))
  const maxV = Math.max(...values, 1)

  const rgb = hexToRgb(colorHex)
  doc.setDrawColor(rgb.r, rgb.g, rgb.b)
  doc.setLineWidth(0.5)

  const n = sampled.length
  if (n > 1) {
    for (let i = 0; i < n - 1; i += 1) {
      const x1 = chartX + (i * chartW) / (n - 1)
      const x2 = chartX + ((i + 1) * chartW) / (n - 1)
      const y1 = innerY + boxH - (values[i] / maxV) * boxH
      const y2 = innerY + boxH - (values[i + 1] / maxV) * boxH
      doc.line(x1, y1, x2, y2)
    }
  }

  // First / mid / last x labels.
  if (n > 1) {
    doc.setFontSize(7)
    doc.setTextColor(71, 85, 105)
    const idxs = [0, Math.floor((n - 1) / 2), n - 1]
    idxs.forEach((idx) => {
      const x = chartX + (idx * chartW) / (n - 1)
      const label = String(sampled[idx]?.[xKey] ?? '').slice(0, 10)
      doc.text(label, x - 10, innerY + boxH + 2.8)
    })
  }

  return innerY + boxH + 8
}

const drawSeasonalityChart = ({
  doc,
  title,
  data,
  cursorY,
  pageW,
  cellX = 14,
  cellW = null,
}) => {
  const paddingX = 2
  const contentW = cellW ?? pageW - 28
  const chartW = contentW - paddingX * 2
  const boxH = 42

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text(title, cellX, cursorY)

  const innerY = cursorY + 3.2
  const chartX = cellX + paddingX
  drawChartFrame(doc, { x: chartX, y: innerY, w: chartW, h: boxH })

  const months = Array.isArray(data) ? data.slice(0, 12) : []
  const confirmedVals = months.map((d) => safeNumber(d?.avgConfirmed))
  const suspectedVals = months.map((d) => safeNumber(d?.avgSuspected))
  const maxV = Math.max(...confirmedVals, ...suspectedVals, 1)

  const barRgb = hexToRgb('#dc2626')
  const lineRgb = hexToRgb('#475569')

  const n = months.length || 1
  const barW = chartW / n

  // Bars for avgConfirmed.
  months.forEach((d, i) => {
    const v = safeNumber(d?.avgConfirmed)
    const h = (v / maxV) * boxH
    const x = chartX + i * barW + 0.6
    doc.setFillColor(barRgb.r, barRgb.g, barRgb.b)
    doc.rect(x, innerY + boxH - h, Math.max(0.9, barW - 1.2), h, 'F')
  })

  // Line for avgSuspected.
  if (n > 1) {
    doc.setDrawColor(lineRgb.r, lineRgb.g, lineRgb.b)
    doc.setLineWidth(0.6)
    for (let i = 0; i < n - 1; i += 1) {
      const x1 = chartX + (i * chartW) / (n - 1)
      const x2 = chartX + ((i + 1) * chartW) / (n - 1)
      const y1 = innerY + boxH - (suspectedVals[i] / maxV) * boxH
      const y2 = innerY + boxH - (suspectedVals[i + 1] / maxV) * boxH
      doc.line(x1, y1, x2, y2)
    }
  }

  // Month labels every 2 points.
  doc.setFontSize(6.5)
  doc.setTextColor(71, 85, 105)
  months.forEach((d, i) => {
    if (i % 2 !== 0) return
    const x = chartX + (i * chartW) / (n - 1)
    const label = String(d?.label ?? '').slice(0, 3)
    doc.text(label, x - 2, innerY + boxH + 2.6)
  })

  return innerY + boxH + 8
}

const drawBarChart = ({
  doc,
  title,
  data,
  labelKey,
  valueKey,
  cursorY,
  pageW,
  maxBars = 8,
  cellX = 14,
  cellW = null,
}) => {
  const paddingX = 2
  const contentW = cellW ?? pageW - 28
  const chartW = contentW - paddingX * 2
  const boxH = 40

  const safe = Array.isArray(data) ? data : []
  const top = safe.slice(0, maxBars)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text(title, cellX, cursorY)

  const innerY = cursorY + 3.2
  const chartX = cellX + paddingX
  drawChartFrame(doc, { x: chartX, y: innerY, w: chartW, h: boxH })

  const values = top.map((d) => safeNumber(d?.[valueKey]))
  const maxV = Math.max(...values, 1)
  const rgb = hexToRgb('#b91c1c')

  const n = top.length || 1
  const barW = chartW / n

  doc.setFillColor(rgb.r, rgb.g, rgb.b)
  top.forEach((d, i) => {
    const v = safeNumber(d?.[valueKey])
    const h = (v / maxV) * boxH
    const x = chartX + i * barW + 0.6
    doc.rect(x, innerY + boxH - h, Math.max(0.9, barW - 1.2), h, 'F')
  })

  doc.setFontSize(6.5)
  doc.setTextColor(71, 85, 105)
  top.forEach((d, i) => {
    const x = chartX + i * barW + barW / 2 - 10
    const label = String(d?.[labelKey] ?? '').slice(0, 10)
    doc.text(label, x, innerY + boxH + 2.6)
  })

  return innerY + boxH + 8
}

/**
 * @param {object} opts
 * @param {Array} opts.rows — parsed cholera rows (same shape as dashboard)
 * @param {object} opts.summary — aggregateSummary result
 * @param {object} opts.dateRange — { start, end } strings
 * @param {string[]} opts.selectedRegions
 * @param {string[]} opts.selectedDistricts
 */
export async function createAnalyticsReportPdfBlob({
  rows = [],
  summary = {},
  dateRange = {},
  selectedRegions = [],
  selectedDistricts = [],
  chartData = {},
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  let logoDataUrl = null
  try {
    logoDataUrl = await brandMarkDataUrl()
  } catch {
    logoDataUrl = null
  }

  doc.setFillColor(29, 78, 216)
  doc.rect(0, 0, pageW, 32, 'F')
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.2)
  doc.line(0, 32, pageW, 32)

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', 12, 7, 10, 10)
  }

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Cholera Watch', logoDataUrl ? 26 : 12, 14)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Analytics export — filtered records', logoDataUrl ? 26 : 12, 21)
  doc.setFontSize(8)
  const generated = new Date().toLocaleString()
  doc.text(`Generated ${generated}`, logoDataUrl ? 26 : 12, 27)

  doc.setTextColor(15, 23, 42)
  let y = 40
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Active filters', 14, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const filterText = buildFilterSummary({
    dateRange,
    selectedRegions,
    selectedDistricts,
  })
  const splitFilters = doc.splitTextToSize(filterText, pageW - 28)
  doc.text(splitFilters, 14, y)
  y += splitFilters.length * 4.2 + 6

  doc.setFont('helvetica', 'bold')
  doc.text('Summary totals (filtered window)', 14, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  const lines = [
    `Reports: ${Number(summary.totalReports ?? rows.length).toLocaleString()}`,
    `Suspected: ${Number(summary.totalSuspected ?? 0).toLocaleString()}`,
    `Confirmed: ${Number(summary.totalConfirmed ?? 0).toLocaleString()}`,
    `Deaths: ${Number(summary.totalDeaths ?? 0).toLocaleString()}`,
    `Avg CFR: ${Number(summary.avgCFR ?? 0).toFixed(2)}%`,
    `Positivity: ${Number(summary.positivityRate ?? 0).toFixed(1)}%`,
  ]
  doc.setFontSize(9)
  doc.text(lines, 14, y)
  y += lines.length * 4.5 + 8

  // Mean / mode plus compact chart snapshots.
  const recordStats = computeRecordStats(rows)
  doc.setFont('helvetica', 'bold')
  doc.text('Mean & mode (per record)', 14, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.7)
  doc.setTextColor(15, 23, 42)
  doc.text(
    [
      `Suspected: mean ${recordStats.suspected.mean.toFixed(2)}; mode ${recordStats.suspected.mode}.`,
      `Confirmed: mean ${recordStats.confirmed.mean.toFixed(2)}; mode ${recordStats.confirmed.mode}.`,
      `Deaths: mean ${recordStats.deaths.mean.toFixed(2)}; mode ${recordStats.deaths.mode}.`,
    ],
    14,
    y,
  )
  y += 18

  const confirmedMonthly = chartData?.confirmedPositivity?.monthly || []
  const monthlySuspected = chartData?.monthlySuspected || []
  const seasonalitySeries = chartData?.seasonality || []
  const regionDistributionSeries = chartData?.regionDistribution || []

  const contentLeft = 14
  const contentGap = 4
  const cellW = (pageW - 28 - contentGap) / 2

  const row1Y = y
  const row1LeftBottom = drawTimeSeriesLineChart({
    doc,
    title: 'Confirmed trend (monthly)',
    data: confirmedMonthly,
    yKey: 'confirmed',
    colorHex: '#dc2626',
    cursorY: row1Y,
    pageW,
    cellX: contentLeft,
    cellW,
  })
  const row1RightBottom = drawTimeSeriesLineChart({
    doc,
    title: 'Monthly suspected totals',
    data: monthlySuspected,
    yKey: 'suspected',
    colorHex: '#ea580c',
    cursorY: row1Y,
    pageW,
    cellX: contentLeft + cellW + contentGap,
    cellW,
  })

  y = Math.max(row1LeftBottom, row1RightBottom) + 2

  const row2Y = y
  const row2LeftBottom = drawSeasonalityChart({
    doc,
    title: 'Seasonality (avg suspected vs avg confirmed)',
    data: seasonalitySeries,
    cursorY: row2Y,
    pageW,
    cellX: contentLeft,
    cellW,
  })
  const row2RightBottom = drawBarChart({
    doc,
    title: 'Regional confirmed distribution',
    data: regionDistributionSeries,
    labelKey: 'region',
    valueKey: 'confirmed',
    cursorY: row2Y,
    pageW,
    cellX: contentLeft + cellW + contentGap,
    cellW,
  })

  y = Math.max(row2LeftBottom, row2RightBottom) + 2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Record listing', 14, y)
  y += 4

  const maxRows = 500
  const slice = rows.slice(0, maxRows)
  const head = [['Date', 'District', 'Region', 'Suspected', 'Confirmed', 'Deaths', 'CFR %']]
  const body = slice.map((row) => [
    formatDate(row),
    row.district || row.location || '—',
    row.region || '—',
    String(row.sCh ?? ''),
    String(row.cCh ?? ''),
    String(row.deaths ?? ''),
    String(Number(row.CFR ?? 0).toFixed(2)),
  ])

  autoTable(doc, {
    startY: y,
    head,
    body,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [29, 78, 216], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  })

  const finalY = doc.lastAutoTable?.finalY ?? y + 40
  let footY = finalY + 10
  if (rows.length > maxRows) {
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(
      `Showing first ${maxRows} of ${rows.length.toLocaleString()} rows. Narrow filters for a smaller export.`,
      14,
      footY,
    )
    footY += 6
  }

  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text(
    'Cholera Watch — data for operational understanding only. Verify against official sources.',
    14,
    footY,
  )

  const safeDate = new Date().toISOString().split('T')[0]
  // Return a Blob so callers can preview in an iframe or download later.
  // Note: jsPDF output('blob') is browser-compatible.
  void safeDate
  return doc.output('blob')
}

// Backwards-compatible helper for direct downloads.
export async function generateAnalyticsReportPdf(opts) {
  const blob = await createAnalyticsReportPdfBlob(opts)
  const safeDate = new Date().toISOString().split('T')[0]
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cholera-watch-report-${safeDate}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

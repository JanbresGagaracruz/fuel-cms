// src/lib/reportGenerator.ts

export interface ReportDetail {
  FuelContractDetailID: number
  DeliveryDate:         string | null
  ContractPrice:        number | null
  VolumeOrdered:        number | null
  VolumeValidated:      number | null
  InvoiceNo:            string | null
  PlantName:            string | null
  FunctionalGroup:      string | null
  LocationGroup:        string | null
  ContractType:         string | null
}

export interface ReportPackage {
  FuelContractPackageId:  number
  PackageName:            string
  details:                ReportDetail[]
  totalContractedVolume?: number | null
  totalContractedAmount?: number | null
}

export interface ReportContract {
  ContractNo:      string
  FuelContractID?: number
  Representative:  string | null
  EffectivityFrom: string | null
  EffectivityTo:   string | null
  ExpiredDate:     string | null
  SupplierID:      number | null
  isMiniGrid?:     boolean
}

// Shape saved to rpt_PackageSummary
export interface PackageSummary {
  FuelContractID:        number
  FuelContractPackageId: number
  ContractNo:            string
  PackageName:           string
  BegRunningBalance:     number   // totalContractedAmount — budget before any delivery
  EndRunningBalance:     number   // remaining budget after last RUNNING row
  BegVolumeBalance:      number   // totalContractedVolume
  EndVolumeBalance:      number   // remaining volume after last RUNNING row
  TotalVolumeOrdered:    number   // sum of D from RUNNING rows
  TotalVolumeValidated:  number   // sum of H from RUNNING rows
  TotalAmountOrdered:    number   // sum of G from RUNNING rows (incl. VAT)
  TotalAmountValidated:  number   // sum of K from RUNNING rows (incl. VAT)
  RunningRowCount:       number
}

/** Derives the beg/end running balance and beg/end volume balance for a package. */
export function generatePackageSummary(
  contract: ReportContract,
  pkg:      ReportPackage,
): PackageSummary {
  const { rows, totalContractedAmount, totalContractedVolume, cumVolume, cumAmount } =
    _buildRows(contract, pkg)

  const runningRows = rows.filter((r: any) => !r.isBaseline && !r.isSummary)

  // End values come from the last RUNNING row's remaining balance fields
  const lastRunning = runningRows[runningRows.length - 1]

  return {
    FuelContractID:        contract.FuelContractID ?? 0,
    FuelContractPackageId: pkg.FuelContractPackageId,
    ContractNo:            contract.ContractNo,
    PackageName:           pkg.PackageName,
    // Amount balance
    BegRunningBalance:     totalContractedAmount,
    EndRunningBalance:     lastRunning ? (lastRunning.N ?? (totalContractedAmount - cumAmount)) : totalContractedAmount,
    // Volume balance
    BegVolumeBalance:      totalContractedVolume,
    EndVolumeBalance:      lastRunning ? lastRunning.volumeBalance : totalContractedVolume,
    // Running totals
    TotalVolumeOrdered:    runningRows.reduce((s: number, r: any) => s + (r.D ?? 0), 0),
    TotalVolumeValidated:  runningRows.reduce((s: number, r: any) => s + (r.H ?? 0), 0),
    TotalAmountOrdered:    runningRows.reduce((s: number, r: any) => s + (r.G ?? 0), 0),
    TotalAmountValidated:  runningRows.reduce((s: number, r: any) => s + (r.K ?? 0), 0),
    RunningRowCount:       runningRows.length,
  }
}

// Shape saved to rpt_fcms
export interface ReportRow {
  FuelContractID:        number
  FuelContractPackageId: number
  ContractNo:            string
  PackageName:           string
  FuelContractDetailID:  number
  RowNo:                 number | null
  ContractType:          string | null
  DeliveryDate:          string | null
  EstPrice:              number | null
  VolumeOrdered:         number | null
  AmountPeso:            number | null
  EVatOrdered:           number | null
  TotalOrdered:          number | null
  VolumeValidated:       number | null
  AdjAmount:             number | null
  EVatValidated:         number | null
  TotalValidated:        number | null
  CumulativeVolume:      number | null
  CumulativeAmount:      number | null
  RemainingBudget:       number | null
  EquivalentVolume:      number | null
  VolumeBalance:         number | null
  InvoiceNo:             string | null
  PlantName:             string | null
  FunctionalGroup:       string | null
  LocationGroup:         string | null
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n === null || n === undefined || isNaN(n)) return ''
  return n.toLocaleString('en-PH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return String(d)
  return dt.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' })
}

const TYPE_ORDER: Record<string, number> = {
  ORIGINAL:  0,
  AMENDMENT: 1,
  RUNNING:   2,
  RENEWAL:   3,
  ADDENDUM:  4,
  CLOSING:   5,
}

// ─── internal shared row builder (your corrected version) ────────────────────

function _buildRows(contract: ReportContract, pkg: ReportPackage) {
  const VAT = 0.12

  const normalizeType = (t?: string | null) =>
    (t ?? 'ORIGINAL').toUpperCase()

  const sorted = [...pkg.details].sort((a, b) => {
    const tA = TYPE_ORDER[normalizeType(a.ContractType)] ?? 99
    const tB = TYPE_ORDER[normalizeType(b.ContractType)] ?? 99
    if (tA !== tB) return tA - tB
    if (!a.DeliveryDate) return 1
    if (!b.DeliveryDate) return -1
    return new Date(a.DeliveryDate).getTime() - new Date(b.DeliveryDate).getTime()
  })

  const originalTotal = sorted
    .filter(d => normalizeType(d.ContractType) === 'ORIGINAL')
    .reduce((s, d) => s + (Number(d.ContractPrice) || 0), 0)

  const amendmentTotal = sorted
    .filter(d => normalizeType(d.ContractType) === 'AMENDMENT')
    .reduce((s, d) => s + (Number(d.ContractPrice) || 0), 0)

  const totalContractedAmount = originalTotal + amendmentTotal

  const totalContractedVolume = sorted
    .filter(d => ['ORIGINAL', 'AMENDMENT'].includes(normalizeType(d.ContractType)))
    .reduce((s, d) => s + (Number(d.VolumeOrdered) || 0), 0)

  let rowCounter = 0
  let cumVolume  = 0
  let cumAmount  = 0

  // We keep a parallel array of the original detail objects so we can pull
  // FuelContractDetailID, PlantName, FunctionalGroup, LocationGroup for saving.
  const rows: any[] = []

  sorted.forEach(d => {
    const type       = normalizeType(d.ContractType)
    const isBaseline = type === 'ORIGINAL' || type === 'AMENDMENT'
    const isRunning  = !isBaseline   // RUNNING, RENEWAL, ADDENDUM all count

    const C = Number(d.ContractPrice)  || 0
    const D = Number(d.VolumeOrdered)  || 0
    const H = Number(d.VolumeValidated) || 0

    let E: number | null = null
    let F: number | null = null
    let G: number | null = null
    let I: number | null = null
    let J: number | null = null
    let K: number | null = null

    if (isRunning) {
      E = C * D
      F = E * VAT
      G = E + F

      I = C * H
      J = I * VAT
      K = I + J

      cumVolume += H
      cumAmount += K
      rowCounter++
    }

    // N — Remaining Budget
    let N: number | null = null
    if (type === 'ORIGINAL') {
      N = originalTotal
    } else if (type === 'AMENDMENT') {
      N = C                                        // amendment shows its own price contribution
    } else {
      N = totalContractedAmount - cumAmount        // running: budget − consumed
    }

    // O — Equivalent Volume
    let O: number | null = null
    if (isBaseline) {
      O = D                                        // baseline shows its own volume
    } else if (C > 0 && N !== null) {
      O = N / (C * (1 + VAT))
    }

    const volumeBalance = totalContractedVolume - cumVolume

    rows.push({
      // ── identity (needed for rpt_fcms save) ──
      detailID:        d.FuelContractDetailID,
      rawDeliveryDate: d.DeliveryDate,
      plantName:       d.PlantName       || '',
      functionalGroup: d.FunctionalGroup || '',
      locationGroup:   d.LocationGroup   || '',

      // ── display / computation ──
      contractType:  type,
      isBaseline,
      isSummary:     false,
      rowNo:         isRunning ? String(rowCounter) : '',
      rowNoInt:      isRunning ? rowCounter : null,
      deliveryDate:  fmtDate(d.DeliveryDate),

      C: C || null,
      D: D || null,
      E, F, G,
      H: H || null,
      I, J, K,
      N,
      O,
      cumVolume,
      cumAmount,
      volumeBalance,
      invoiceNo: d.InvoiceNo || '',
    })
  })

  // Inject BALANCE AFTER AO summary row (display only — not saved to rpt_fcms)
  const amendmentIndex = rows.findLastIndex((r: any) => r.contractType === 'AMENDMENT')
  if (amendmentIndex !== -1) {
    rows.splice(amendmentIndex + 1, 0, {
      contractType:  'BALANCE_AFTER_AO',
      label:         'BALANCE AFTER AO',
      N:             totalContractedAmount,
      O:             totalContractedVolume,
      isSummary:     true,
      isBaseline:    false,
      // identity fields not needed (not saved)
      detailID:        null,
      rawDeliveryDate: null,
    })
  }

  return {
    rows,
    totalContractedAmount,
    totalContractedVolume,
    cumVolume,
    cumAmount,
  }
}

// ─── generateReportRows — maps _buildRows output → ReportRow[] for rpt_fcms ──
//
// Skips isSummary rows (BALANCE AFTER AO is display-only, has no detailID).

export function generateReportRows(
  contract: ReportContract,
  pkg:      ReportPackage,
): ReportRow[] {
  const { rows } = _buildRows(contract, pkg)
  const fuelContractID = contract.FuelContractID ?? 0

  return rows
    .filter((r: any) => !r.isSummary && r.detailID != null)
    .map((r: any) => ({
      FuelContractID:        fuelContractID,
      FuelContractPackageId: pkg.FuelContractPackageId,
      ContractNo:            contract.ContractNo,
      PackageName:           pkg.PackageName,
      FuelContractDetailID:  r.detailID,
      RowNo:                 r.rowNoInt ?? null,
      ContractType:          r.contractType ?? null,
      DeliveryDate:          r.rawDeliveryDate ?? null,
      EstPrice:              r.C    ?? null,
      VolumeOrdered:         r.D    ?? null,
      AmountPeso:            r.E    ?? null,
      EVatOrdered:           r.F    ?? null,
      TotalOrdered:          r.G    ?? null,
      VolumeValidated:       r.H    ?? null,
      AdjAmount:             r.I    ?? null,
      EVatValidated:         r.J    ?? null,
      TotalValidated:        r.K    ?? null,
      CumulativeVolume:      r.isBaseline ? null : (r.cumVolume ?? null),
      CumulativeAmount:      r.isBaseline ? null : (r.cumAmount ?? null),
      RemainingBudget:       r.N    ?? null,
      EquivalentVolume:      r.O    ?? null,
      VolumeBalance:         r.isBaseline ? null : (r.volumeBalance ?? null),
      InvoiceNo:             r.invoiceNo     || null,
      PlantName:             r.plantName     || null,
      FunctionalGroup:       r.functionalGroup || null,
      LocationGroup:         r.locationGroup   || null,
    }))
}

// ─── generatePackageReport — full HTML output ─────────────────────────────────

export function generatePackageReport(
  contract: ReportContract,
  pkg:      ReportPackage,
): string {
  const { rows, totalContractedAmount, totalContractedVolume, cumVolume, cumAmount } =
    _buildRows(contract, pkg)

  const isMiniGrid = contract.isMiniGrid === true
  const VAT = 0.12

  const nonBase = rows.filter((r: any) => !r.isBaseline && !r.isSummary)
  const totD = nonBase.reduce((s: number, r: any) => s + (r.D ?? 0), 0)
  const totE = nonBase.reduce((s: number, r: any) => s + (r.E ?? 0), 0)
  const totF = nonBase.reduce((s: number, r: any) => s + (r.F ?? 0), 0)
  const totG = nonBase.reduce((s: number, r: any) => s + (r.G ?? 0), 0)
  const totH = nonBase.reduce((s: number, r: any) => s + (r.H ?? 0), 0)
  const totI = nonBase.reduce((s: number, r: any) => s + (r.I ?? 0), 0)
  const totJ = nonBase.reduce((s: number, r: any) => s + (r.J ?? 0), 0)
  const totK = nonBase.reduce((s: number, r: any) => s + (r.K ?? 0), 0)


  function formatNegative(value: number | null | undefined): string {
    if (value === null || value === undefined) return ''
    if (value < 0) return `(${fmt(-value)})`
    return fmt(value)
  }

  function typeRowClass(t: string): string {
    const map: Record<string, string> = {
      ORIGINAL:  'row-original',
      AMENDMENT: 'row-amendment',
      RUNNING:   'row-running',
      RENEWAL:   'row-renewal',
      ADDENDUM:  'row-addendum',
      CLOSING:   'row-closing',
    }
    return map[t] ?? ''
  }

  // colspan offset — when Mini-Grid, "Order" group gains 1 extra col (Plant Name)
  // and summary rows need +1 to their colspan
  const orderColspan  = isMiniGrid ? 3 : 2   // No. + [Plant Name] + Delivery Date + Price + Volume
  const summaryColspan = isMiniGrid ? 14 : 13  // all cols before N

  const rowsHtml = rows.map((r: any) => {
    if (r.isSummary) {
      return `
      <tr class="summary-row">
        <td colspan="${summaryColspan}" class="right"><b>${r.label}</b></td>
        <td class="highlight-yellow right"><b>${fmt(r.N)}</b></td>
        <td class="highlight-yellow right"><b>${fmt(r.O)}</b></td>
        <td></td>
        <td></td>
      </tr>`
    }

    // Plant Name cell — only shown for Mini-Grid contracts, blank for baseline rows
    const plantCell = isMiniGrid
      ? `<td class="left" style="max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.isBaseline ? '' : (r.plantName || '')}</td>`
      : ''

    return `
    <tr class="${typeRowClass(r.contractType)}">
      <td class="center type-tag">${r.isBaseline ? '' : r.rowNo}</td>
      ${plantCell}
      <td class="center">${r.deliveryDate}</td>
      <td class="right">${r.isBaseline ? '' :  r.C !== null ? fmt(r.C, 4) : ''}</td>
      <td class="right">${r.isBaseline ? '' : fmt(r.D)}</td>
      <td class="right">${r.E !== null ? fmt(r.E) : ''}</td>
      <td class="right">${r.F !== null ? fmt(r.F) : ''}</td>
      <td class="right">${r.G !== null ? fmt(r.G) : ''}</td>
      <td class="right">${r.H !== null ? fmt(r.H) : ''}</td>
      <td class="right">${r.I !== null ? fmt(r.I) : ''}</td>
      <td class="right">${r.J !== null ? fmt(r.J) : ''}</td>
      <td class="right">${r.K !== null ? fmt(r.K) : ''}</td>
      <td class="right">${r.isBaseline ? '' : fmt(r.cumVolume)}</td>
      <td class="right">${r.isBaseline ? '' : fmt(r.cumAmount)}</td>
      <td class="highlight-yellow right">${formatNegative(r.N)}</td>
      <td class="highlight-yellow right">${formatNegative(r.O)}</td>
      <td class="center">${r.invoiceNo || ''}</td>
      <td class="right">${r.isBaseline ? '' : fmt(r.volumeBalance)}</td>
    </tr>`
  }).join('')

  // Table header — Plant Name column injected after No. when Mini-Grid
  const plantNameHeader = isMiniGrid
    ? `<th rowspan="3">Plant Name</th>`
    : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${pkg.PackageName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; color: #000; }
  .report-title    { font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 2px; }
  .report-subtitle { font-size: 13px; font-weight: bold; margin-bottom: 10px; color: #333; }
  .report-header { font-size: 13px; font-weight: bold; margin-bottom: 5px; color: #333; }
  .meta-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 4px 24px; font-size: 11px; border: 1px solid #ccc;
    padding: 8px 12px; background: #f9f9f9; margin-bottom: 6px;
  }
  .meta-row   { display: flex; gap: 6px; }
  .meta-label { font-weight: bold; white-space: nowrap; color: #444; }
  .print-date { font-size: 10px; color: #666; text-align: right; margin-bottom: 12px; }
  .legend      { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 10px; font-size: 10px; align-items: center; }
  .legend-item { display: flex; align-items: center; gap: 4px; }
  .legend-swatch { width: 12px; height: 12px; border: 1px solid #aaa; flex-shrink: 0; }
  .mini-grid-badge {
    display: inline-block; background: #cffafe; color: #0e7490;
    border: 1px solid #a5f3fc; border-radius: 4px; padding: 2px 8px;
    font-size: 11px; font-weight: bold; margin-bottom: 8px;
  }
  table { border-collapse: collapse; width: 100%; text-align: center; }
  th, td { border: 1px solid #000; padding: 5px 6px; font-size: 11px; vertical-align: middle; }
  thead th        { background: #d9d9d9; font-weight: bold; line-height: 1.3; }
  .subhead th     { background: #efefef; font-weight: bold; }
  .formula-row th { background: #e8e8e8; font-style: italic; font-size: 10px; color: #555; }
  .row-original  td { background: #dbeafe; }
  .row-amendment td { background: #fef9c3; }
  .row-running   td { background: #ffffff; }
  .row-renewal   td { background: #dcfce7; }
  .row-addendum  td { background: #f3e8ff; }
  .row-closing   td { background: #fee2e2; color: #991b1b; font-weight: bold; }
  .summary-row   td { background: #f0fdf4; font-weight: bold; }
  .highlight-yellow { background: #fff200 !important; font-weight: bold; color: red; }
  .right  { text-align: right;  }
  .left   { text-align: left;   }
  .center { text-align: center; }
  .totals-row td                { background: #d9d9d9; font-weight: bold; }
  .totals-row .highlight-yellow { background: #fff200 !important; color: red; }
  .notes { margin-top: 14px; font-size: 10px; color: #555; border-top: 1px solid #ccc; padding-top: 8px; line-height: 1.6; }
  .signature-block { display: flex; gap: 48px; margin-top: 32px; }
  .sig-item  { flex: 1; text-align: center; }
  .sig-line  { border-top: 1px solid #000; margin-top: 28px; padding-top: 4px; font-weight: bold; font-size: 11px; }
  .sig-label { font-size: 10px; color: #666; }
  .print-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: #f97316; color: white; border: none;
    padding: 8px 18px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; margin-bottom: 14px;
  }
  .print-btn:hover { background: #ea6c0a; }
  @media print {
    body { padding: 10px; }
    @page { size: A3 landscape; margin: 12mm; }
    .no-print { display: none !important; }
    .row-original  td { background: #dbeafe !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .row-amendment td { background: #fef9c3 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .row-closing   td { background: #fee2e2 !important; color: #991b1b !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .summary-row   td { background: #f0fdf4 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .highlight-yellow { background: #fff200 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .mini-grid-badge  { background: #cffafe !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="report-title">NATIONAL POWER CORPORATION</div>
<div class="report-header">SMALL POWER UTILITIES GROUP</div>
<div class="report-header">OIL BASED FUEL SUPPLY AND DELIVERY MONITORING</div>
<div class="report-subtitle">${pkg.PackageName}</div>
<div class="meta-grid">
  <div class="meta-row"><span class="meta-label">Contract No.:</span><span>${contract.ContractNo}</span></div>
  <div class="meta-row"><span class="meta-label">Effectivity:</span><span>${fmtDate(contract.EffectivityFrom)} – ${fmtDate(contract.EffectivityTo)}</span></div>
  <div class="meta-row"><span class="meta-label">Expiry Date:</span><span>${fmtDate(contract.ExpiredDate)}</span></div>
  <div class="meta-row"><span class="meta-label">Representative:</span><span>${contract.Representative || '—'}</span></div>
  <div class="meta-row"><span class="meta-label">Baseline Vol. (ORIG+AMEND):</span><span>${fmt(totalContractedVolume)} L</span></div>
  <div class="meta-row"><span class="meta-label">Baseline Amt. (ORIG+AMEND):</span><span>₱ ${fmt(totalContractedAmount)}</span></div>
</div>
<div class="legend no-print">
  <strong>Legend:</strong>
  <div class="legend-item"><div class="legend-swatch" style="background:#dbeafe"></div> ORIGINAL</div>
  <div class="legend-item"><div class="legend-swatch" style="background:#fef9c3"></div> AMENDMENT</div>
  <div class="legend-item"><div class="legend-swatch" style="background:#f0fdf4;border-color:#86efac"></div> BALANCE AFTER AO</div>
  <div class="legend-item"><div class="legend-swatch" style="background:#fff;border-color:#888"></div> RUNNING</div>
  <div class="legend-item"><div class="legend-swatch" style="background:#fee2e2;border-color:#f87171"></div> <span style="color:#991b1b;font-weight:bold;">CLOSING</span></div>
</div>
<table>
  <thead>
    <tr>
      <th colspan="${orderColspan}">Order</th>
      <th colspan="5">Volume Ordered</th>
      <th colspan="4">Validated</th>
      <th colspan="2">Cumulative Total</th>
      <th colspan="2">Contracted Running Balance</th>
      <th rowspan="3">Petron Invoice No.</th>
      <th rowspan="3">Volume Balance</th>
    </tr>
    <tr class="subhead">
      <th>No.</th>${plantNameHeader}<th>Delivery Date</th><th>Est. Price<br>Peso / Liter</th><th>Volume<br>Liter</th>
      <th>Amount<br>Peso</th><th>E-VAT<br>Pesos</th><th>Total Amount<br>Pesos</th>
      <th>Volume<br>Liters</th><th>Adj. Amount<br>Pesos</th><th>E-VAT<br>Pesos</th><th>Total Amount<br>Pesos</th>
      <th>Volume<br>Liters (L)</th><th>Amount<br>Pesos (M)</th>
      <th>Remaining Budget<br>(Pesos)</th><th>Equivalent Volume<br>(Liters)</th>
    </tr>
    <tr class="formula-row">
      <th>A</th><th>B</th><th>C</th><th>D</th>
      <th>E=C×D</th><th>F=E×12%</th><th>G=E+F</th>
      <th>H</th><th>I=H×C</th><th>J=I×12%</th><th>K=I+J</th>
      <th>L</th><th>M</th><th>N</th><th>O</th>
    </tr>
  </thead>
  <tbody>
    ${rowsHtml}
    <tr class="totals-row">
      <td colspan="${isMiniGrid ? 4 : 3}" class="left" style="padding-left:8px;">TOTAL (RUNNING / non-baseline)</td>
      <td class="right">${fmt(totD)}</td><td class="right">${fmt(totE)}</td>
      <td class="right">${fmt(totF)}</td><td class="right">${fmt(totG)}</td>
      <td class="right">${fmt(totH)}</td><td class="right">${fmt(totI)}</td>
      <td class="right">${fmt(totJ)}</td><td class="right">${fmt(totK)}</td>
      <td class="right">${fmt(cumVolume)}</td><td class="right">${fmt(cumAmount)}</td>
      <td class="right"></td><td class="right"></td><td></td><td></td>
    </tr>
  </tbody>
</table>
<div class="notes">
  <strong>Notes:</strong><br>
  a. The respective estimate price (C) of each fuel deliveries shall be used the preceeding month fuel rate based on MOPS price.<br>
  b. Volume to be ordered (D) shall not exceed the Equivalent Volume (O) of the ramaining budget after the last delivery.<br>
  c. The Cumulative Total in Peso of Validated Volume (M) shall not be more than the Contract amount indicated above.<br>
  d. Validated Volume is the actual volume received net of applicable deductions.<br>
  e. Validated Adjusted amount is based on adjusted price per liter.<br>
  f.  Value of (L) is equal to the cumulative validated volume.<br>
  g. Value of (M) is equal to the cumulative validated amount.<br>
</div>
</body>
</html>`
}

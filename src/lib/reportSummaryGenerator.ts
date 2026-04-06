// src/lib/reportSummaryGenerator.ts
//
// Generates a single-page HTML summary report for an entire contract.
// Shows, per package:
//   • Beginning Running Balance  (totalContractedAmount)
//   • Ending Running Balance     (N of last RUNNING row = remaining budget ₱)
//   • Beginning Volume Balance   (totalContractedVolume)
//   • Ending Volume Balance      (remaining volume L)
//   • Total Vol. Ordered / Validated
//   • Total Amt. Ordered / Validated
//   • # of RUNNING rows
//   • Certified status
// Plus a grand-total footer row.

import { generatePackageSummary, ReportContract, ReportPackage } from './reportGenerator'

export interface SummaryReportContract extends ReportContract {
  isMiniGrid?: boolean
  signatories?: {
    Title?:          string | null
    PreparedByName?: string | null
    PreparedByPos?:  string | null
    ReviewedByName?: string | null
    ReviewedByPos?:  string | null
    NotedByName?:    string | null
    NotedByPos?:     string | null
  } | null
}

export interface SummaryReportPackage extends ReportPackage {
  isCertified?: boolean
  CertifiedAt?: string | null
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null || isNaN(n)) return '—'
  return n.toLocaleString('en-PH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return String(d)
  return dt.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' })
}

function pct(part: number, whole: number): string {
  if (!whole) return '0.00%'
  return ((part / whole) * 100).toFixed(2) + '%'
}

// ─── main export ─────────────────────────────────────────────────────────────

export function generateContractSummaryReport(
  contract: SummaryReportContract,
  packages: SummaryReportPackage[],
): string {
  const now = new Date().toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  // Compute summary per package
  const rows = packages.map(pkg => {
    const s = generatePackageSummary(contract, pkg)
    return {
      pkg,
      s,
      budgetUsed:  s.BegRunningBalance - s.EndRunningBalance,
      volUsed:     s.BegVolumeBalance  - s.EndVolumeBalance,
    }
  })

  // Grand totals
  const gt = {
    BegRunningBalance:    rows.reduce((a, r) => a + r.s.BegRunningBalance,   0),
    EndRunningBalance:    rows.reduce((a, r) => a + r.s.EndRunningBalance,   0),
    BegVolumeBalance:     rows.reduce((a, r) => a + r.s.BegVolumeBalance,    0),
    EndVolumeBalance:     rows.reduce((a, r) => a + r.s.EndVolumeBalance,    0),
    TotalVolumeOrdered:   rows.reduce((a, r) => a + r.s.TotalVolumeOrdered,  0),
    TotalVolumeValidated: rows.reduce((a, r) => a + r.s.TotalVolumeValidated,0),
    TotalAmountOrdered:   rows.reduce((a, r) => a + r.s.TotalAmountOrdered,  0),
    TotalAmountValidated: rows.reduce((a, r) => a + r.s.TotalAmountValidated,0),
  }
  const sig = contract.signatories

  const sigBlock = `
  <div class="signature-block">
    <div class="sig-item">
      <div class="sig-line">Prepared by</div>
      <div class="sig-name">${sig?.PreparedByName  || '&nbsp;'}</div>
      <div class="sig-pos">${sig?.PreparedByPos    || '&nbsp;'}</div>
    </div>
    <div class="sig-item">
      <div class="sig-line">Reviewed by</div>
      <div class="sig-name">${sig?.ReviewedByName  || '&nbsp;'}</div>
      <div class="sig-pos">${sig?.ReviewedByPos    || '&nbsp;'}</div>
    </div>
    <div class="sig-item">
      <div class="sig-line">Noted by</div>
      <div class="sig-name">${sig?.NotedByName     || '&nbsp;'}</div>
      <div class="sig-pos">${sig?.NotedByPos       || '&nbsp;'}</div>
    </div>
  </div>
  `

  const tableRows = rows.map((r, idx) => {
    const { s, pkg, budgetUsed, volUsed } = r
    const budgetPct = pct(budgetUsed, s.BegRunningBalance)
    const volPct    = pct(volUsed,    s.BegVolumeBalance)
    const isLow     = s.EndRunningBalance > 0 && (s.EndRunningBalance / s.BegRunningBalance) < 0.10
    const isOver    = s.EndRunningBalance < 0

    return `
    <tr>
      <td class="center muted">${idx + 1}</td>
      <td class="bold">${pkg.PackageName}</td>
      <td class="right">${fmt(s.BegRunningBalance)}</td>
      <td class="right ${isOver ? 'red bold' : isLow ? 'amber bold' : 'green bold'}">${fmt(s.EndRunningBalance)}</td>
      <td class="right muted">${fmt(budgetUsed)}</td>
      <td class="right muted">${budgetPct}</td>
      <td class="right">${fmt(s.BegVolumeBalance)}</td>
      <td class="right ${isOver ? 'red bold' : isLow ? 'amber bold' : 'green bold'}">${fmt(s.EndVolumeBalance)}</td>
      <td class="right muted">${fmt(volUsed)}</td>
      <td class="right muted">${volPct}</td>
      <td class="right muted">${fmt(s.TotalVolumeOrdered)}</td>
      <td class="right muted">${fmt(s.TotalVolumeValidated)}</td>
      <td class="right muted">${fmt(s.TotalAmountOrdered)}</td>
      <td class="right muted">${fmt(s.TotalAmountValidated)}</td>
    </tr>`
  }).join('')

  const budgetUsedGt  = gt.BegRunningBalance - gt.EndRunningBalance
  const volUsedGt     = gt.BegVolumeBalance  - gt.EndVolumeBalance

  return `<!DOCTYPE html>
          <html>
          <head>
          <meta charset="UTF-8">
          <title>Summary Report — ${contract.ContractNo}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; color: #111; }

            .header-block { margin-bottom: 12px; }
            .org-title  { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: .4px; }
            .org-sub    { font-size: 11px; color: #444; }
            .report-title { font-size: 15px; font-weight: bold; margin: 8px 0 2px; text-transform: uppercase; }
            .report-header { font-size: 13px; font-weight: bold; margin-bottom: 5px; color: #333; }

            .meta-grid {
              display: grid; grid-template-columns: repeat(3, 1fr);
              gap: 3px 24px; border: 1px solid #ccc;
              padding: 7px 12px; background: #f9f9f9; margin-bottom: 8px; font-size: 10.5px;
            }
            .meta-row  { display: flex; gap: 5px; }
            .meta-key  { font-weight: bold; white-space: nowrap; color: #555; }
            .print-date{ font-size: 9.5px; color: #888; text-align: right; margin-bottom: 10px; }

            table { border-collapse: collapse; width: 100%; font-size: 10.5px; }
            th, td { border: 1px solid #000; padding: 4px 6px; vertical-align: middle; }
            thead th { background: #d9d9d9; font-weight: bold; text-align: center; line-height: 1.3; }
            .subhead th { background: #eeeeee; font-size: 10px; }
  
            .center { text-align: center; }
            .right  { text-align: right;  }
            .bold   { font-weight: bold;  }
            .muted  { color: #555;        }
            .green  { color: #166534;     }
            .amber  { color: #92400e;     }
            .red    { color: #991b1b;     }

            .badge          { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 9.5px; font-weight: bold; }
            .badge.certified{ background: #dcfce7; color: #166534; border: 1px solid #86efac; }
            .badge.pending  { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }

            .totals-row td  { background: #d9d9d9; font-weight: bold; }

            .legend { display: flex; gap: 16px; margin: 8px 0; font-size: 9.5px; align-items: center; flex-wrap: wrap; }
            .dot    { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }

            .signature-block { display: flex; gap: 48px; margin-top: 40px;}
            .sig-item { flex: 1; text-align: center;}
            .sig-name { font-size: 12px; font-weight: bold; color: #000; min-height: 18px;}
            .sig-pos { font-size: 10px; color: #444; min-height: 14px; margin-bottom: 28px;}
            .sig-line { font-size: 10px; color: #666; font-style: italic; padding-bottom: 8px;}
            .sig-title { text-align: center; margin-top: 10px; font-size: 10px; color: #555; font-style: italic;}
            @media print {
              body { padding: 8px; }
              @page { size: A3 landscape; margin: 10mm; }
              .no-print { display: none !important; }
              thead th { background: #d9d9d9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .subhead th { background: #eeeeee !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .totals-row td { background: #d9d9d9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .badge.certified { background: #dcfce7 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .badge.pending   { background: #fef9c3 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
          </head>
          <body>

          <div class="header-block">
            <div class="org-title">National Power Corporation</div>
            <div class="org-sub">Small Power Utilities Group</div>
            <div class="report-title">Contract Running Balance Summary Report</div>
          </div>

          <div class="meta-grid no-print">
            <div class="meta-row"><span class="meta-key">Contract No.:</span><span>${contract.ContractNo}</span></div>
            <div class="meta-row"><span class="meta-key">Effectivity:</span><span>${fmtDate(contract.EffectivityFrom)} – ${fmtDate(contract.EffectivityTo)}</span></div>
            <div class="meta-row"><span class="meta-key">Expiry Date:</span><span>${fmtDate(contract.ExpiredDate)}</span></div>
            <div class="meta-row"><span class="meta-key">Total Packages:</span><span>${packages.length}</span></div>
            <div class="meta-row"><span class="meta-key">Type:</span><span>${contract.isMiniGrid ? 'Mini-Grid' : '—'}</span></div>
          </div>

          <div class="legend no-print">
            <strong>Balance indicators:</strong>
            <div style="display:flex;gap:4px;align-items:center;"><div class="dot" style="background:#166534"></div> <span class="green">Sufficient balance (&gt;10%)</span></div>
            <div style="display:flex;gap:4px;align-items:center;"><div class="dot" style="background:#92400e"></div> <span class="amber">Low balance (≤10%)</span></div>
            <div style="display:flex;gap:4px;align-items:center;"><div class="dot" style="background:#991b1b"></div> <span class="red">Over budget (&lt;0)</span></div>
          </div>

          <table>
            <thead>
              <tr>
                <th rowspan="2">#</th>
                <th rowspan="2">Package Name</th>
                <th colspan="4">Running Balance (₱)</th>
                <th colspan="4">Volume Balance (L)</th>
                <th colspan="2">Volume Summary (L)</th>
                <th colspan="2">Amount Summary (₱)</th>
              </tr>
              <tr class="subhead">
                <th>Beg. Balance</th>
                <th>End Balance</th>
                <th>Consumed</th>
                <th>% Used</th>
                <th>Beg. Volume</th>
                <th>End Volume</th>
                <th>Consumed</th>
                <th>% Used</th>
                <th>Vol. Ordered</th>
                <th>Vol. Validated</th>
                <th>Amt. Ordered</th>
                <th>Amt. Validated</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr class="totals-row">
                <td colspan="2" class="center">GRAND TOTAL</td>
                <td class="right">${fmt(gt.BegRunningBalance)}</td>
                <td class="right">${fmt(gt.EndRunningBalance)}</td>
                <td class="right">${fmt(budgetUsedGt)}</td>
                <td class="right">${pct(budgetUsedGt, gt.BegRunningBalance)}</td>
                <td class="right">${fmt(gt.BegVolumeBalance)}</td>
                <td class="right">${fmt(gt.EndVolumeBalance)}</td>
                <td class="right">${fmt(volUsedGt)}</td>
                <td class="right">${pct(volUsedGt, gt.BegVolumeBalance)}</td>
                <td class="right">${fmt(gt.TotalVolumeOrdered)}</td>
                <td class="right">${fmt(gt.TotalVolumeValidated)}</td>
                <td class="right">${fmt(gt.TotalAmountOrdered)}</td>
                <td class="right">${fmt(gt.TotalAmountValidated)}</td>
              </tr>
            </tbody>
          </table>
          ${sigBlock}
          </body>
          </html>`
}
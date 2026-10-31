export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function openPrintDocument(title: string, content: string, preparedBy: string): boolean {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return false

  let printStarted = false
  const startPrint = () => {
    if (printStarted || printWindow.closed || printWindow.document.documentElement.dataset.printStarted === 'true') return
    printStarted = true
    printWindow.document.documentElement.dataset.printStarted = 'true'
    printWindow.focus()
    printWindow.print()
  }

  printWindow.addEventListener('load', () => {
    const logo = printWindow.document.querySelector<HTMLImageElement>('.company-logo')
    if (logo && !logo.complete) {
      logo.addEventListener('load', () => window.setTimeout(startPrint, 150), { once: true })
      logo.addEventListener('error', () => window.setTimeout(startPrint, 150), { once: true })
      window.setTimeout(startPrint, 2000)
      return
    }
    window.setTimeout(startPrint, 150)
  }, { once: true })

  printWindow.document.write(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(title)}</title>
        <style>
          body { font: 12px Arial, sans-serif; color: #172033; margin: 28px; }
          .company-header { display: flex; align-items: center; gap: 14px; padding-bottom: 14px; border-bottom: 2px solid #0891b2; }
          .company-logo { width: 68px; height: 68px; object-fit: contain; }
          .company-name { font-size: 19px; font-weight: 700; margin: 0; color: #0f172a; }
          .document-title { font-size: 13px; margin: 5px 0 0; color: #475569; }
          .document-content { margin-top: 20px; }
          h1 { font-size: 22px; margin: 0 0 4px; }
          h2 { font-size: 14px; margin: 22px 0 8px; padding-bottom: 5px; border-bottom: 1px solid #cbd5e1; }
          p { margin: 0 0 18px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 7px 9px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
          th { width: 35%; color: #475569; text-transform: uppercase; font-size: 10px; }
          td { white-space: pre-wrap; overflow-wrap: anywhere; }
          a { color: #0e7490; overflow-wrap: anywhere; }
          section { break-inside: avoid; }
          .signature { margin-top: 42px; break-inside: avoid; }
          .signature-line { width: 250px; height: 34px; border-bottom: 1px solid #334155; }
          .signature-name { margin-top: 7px; color: #334155; }
          .signature-date { margin-top: 4px; color: #64748b; font-size: 10px; }
          .print-action { margin: 18px 0; padding: 9px 16px; border: 0; background: #0891b2; color: #fff; font-weight: 700; cursor: pointer; }
          @media print { body { margin: 14mm; } .print-action { display: none; } }
        </style>
      </head>
      <body>
        <header class="company-header">
          <img class="company-logo" src="${escapeHtml(`${window.location.origin}/sbclogo.png`)}" alt="SBC logo">
          <div>
            <p class="company-name">SBC</p>
            <p class="document-title">${escapeHtml(title)}</p>
          </div>
        </header>
        <button class="print-action" type="button" onclick="document.documentElement.dataset.printStarted='true';window.print()">Print / Save as PDF</button>
        <main class="document-content">${content}</main>
        <footer class="signature">
          <div class="signature-line"></div>
          <div class="signature-name">${escapeHtml(preparedBy)}</div>
          <div class="signature-date">Admin signature &nbsp; | &nbsp; Date: ____________________</div>
        </footer>
      </body>
    </html>`)
  printWindow.document.close()
  window.setTimeout(startPrint, 2500)
  return true
}

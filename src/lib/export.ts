import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { BRREGEnhet } from './types'

export function exportToCSV(data: BRREGEnhet[], filename: string = 'bedriftssok-data') {
  const csvData = data.map(enhet => ({
    'Organisasjonsnummer': enhet.organisasjonsnummer,
    'Navn': enhet.navn,
    'Postadresse': `${enhet.postadresse} ${enhet.postnummer}`,
    'Kommunenummer': enhet.kommunenummer,
    'Antall ansatte': enhet.antallAnsatte || '',
    'NACE-kode': enhet.naceKode,
    'NACE-beskrivelse': enhet.naceBeskrivelse,
    'Organisasjonsform': enhet.organisasjonsform,
    'Registreringsdato': enhet.registreringsdato,
    'Status': enhet.status,
    'Telefon': 'Ikke tilgjengelig i åpne API'
  }))

  const csv = Papa.unparse(csvData)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function exportToExcel(data: BRREGEnhet[], filename: string = 'bedriftssok-data') {
  const excelData = data.map(enhet => ({
    'Organisasjonsnummer': enhet.organisasjonsnummer,
    'Navn': enhet.navn,
    'Postadresse': `${enhet.postadresse} ${enhet.postnummer}`,
    'Kommunenummer': enhet.kommunenummer,
    'Antall ansatte': enhet.antallAnsatte || '',
    'NACE-kode': enhet.naceKode,
    'NACE-beskrivelse': enhet.naceBeskrivelse,
    'Organisasjonsform': enhet.organisasjonsform,
    'Registreringsdato': enhet.registreringsdato,
    'Status': enhet.status,
    'Telefon': 'Ikke tilgjengelig i åpne API'
  }))

  const ws = XLSX.utils.json_to_sheet(excelData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Bedrifter')
  
  // Auto-size columns
  const colWidths = Object.keys(excelData[0] || {}).map(key => ({ wch: Math.max(key.length, 20) }))
  ws['!cols'] = colWidths
  
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

'use client'

import { BRREGEnhet } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'

interface ResultsTableProps {
  results: BRREGEnhet[]
  totalCount: number
  onExportCSV: () => void
  onExportExcel: () => void
}

export function ResultsTable({ results, totalCount, onExportCSV, onExportExcel }: ResultsTableProps) {
  if (results.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalCount} treff funnet
        </div>
        <div className="flex gap-2">
          <Button onClick={onExportCSV} variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Last ned CSV
          </Button>
          <Button onClick={onExportExcel} variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Last ned Excel
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Organisasjonsnummer</th>
                <th className="text-left p-3 font-medium">Navn</th>
                <th className="text-left p-3 font-medium">Postadresse</th>
                <th className="text-left p-3 font-medium">Kommunenummer</th>
                <th className="text-left p-3 font-medium">Antall ansatte</th>
                <th className="text-left p-3 font-medium">NACE-kode</th>
                <th className="text-left p-3 font-medium">Organisasjonsform</th>
                <th className="text-left p-3 font-medium">Registreringsdato</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Telefon</th>
              </tr>
            </thead>
            <tbody>
              {results.map((enhet, index) => (
                <tr key={enhet.organisasjonsnummer} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                  <td className="p-3 font-mono">{enhet.organisasjonsnummer}</td>
                  <td className="p-3 font-medium">{enhet.navn}</td>
                  <td className="p-3">{enhet.postadresse} {enhet.postnummer}</td>
                  <td className="p-3">{enhet.kommunenummer}</td>
                  <td className="p-3">{enhet.antallAnsatte || '-'}</td>
                  <td className="p-3">
                    <div>
                      <div className="font-mono">{enhet.naceKode}</div>
                      <div className="text-xs text-muted-foreground">{enhet.naceBeskrivelse}</div>
                    </div>
                  </td>
                  <td className="p-3">{enhet.organisasjonsform}</td>
                  <td className="p-3">{new Date(enhet.registreringsdato).toLocaleDateString('no-NO')}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      enhet.status === 'AKTIV' ? 'bg-green-100 text-green-800' :
                      enhet.status === 'KONKURS' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {enhet.status}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    <span className="text-xs">Ikke tilgjengelig i åpne API</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

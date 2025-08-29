'use client'

import { BRREGEnhet } from '@/lib/types'
import { Button } from '@/components/ui/button'

interface ResultsTableProps {
  results: BRREGEnhet[]
  totalCount: number
  onExportCSV: () => void
  onExportExcel: () => void
}

export function ResultsTable({ results, totalCount, onExportCSV, onExportExcel }: ResultsTableProps) {
  const getContactInfo = (enhet: BRREGEnhet) => {
    const hasContactInfo = enhet.mobil || enhet.epost
    
    if (!hasContactInfo) {
      return (
        <div className="text-xs text-muted-foreground">
          Ingen kontaktinfo
        </div>
      )
    }

    return (
      <div className="text-xs space-y-1">
        {enhet.mobil && (
          <div className="font-medium">📱 {enhet.mobil}</div>
        )}
        {enhet.epost && (
          <div className="font-medium">✉️ {enhet.epost}</div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Resultater</h3>
          <p className="text-sm text-muted-foreground">
            {totalCount} bedrifter funnet
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={onExportCSV} variant="outline" size="sm">
            Eksporter CSV
          </Button>
          <Button onClick={onExportExcel} variant="outline" size="sm">
            Eksporter Excel
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Org.nr</th>
                <th className="text-left p-3 font-medium">Navn</th>
                <th className="text-left p-3 font-medium">Adresse</th>
                <th className="text-left p-3 font-medium">Kommune</th>
                <th className="text-left p-3 font-medium">Ansatte</th>
                <th className="text-left p-3 font-medium">NACE</th>
                <th className="text-left p-3 font-medium">Org.form</th>
                <th className="text-left p-3 font-medium">Reg.dato</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Kontaktinfo</th>
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
                  <td className="p-3">
                    {getContactInfo(enhet)}
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

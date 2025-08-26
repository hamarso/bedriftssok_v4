'use client'

import { useState } from 'react'
import { SearchForm } from '@/components/SearchForm'
import { ResultsTable } from '@/components/ResultsTable'
import { SearchFilters, BRREGEnhet, SearchResult } from '@/lib/types'
import { exportToCSV, exportToExcel } from '@/lib/export'

export default function Home() {
  const [results, setResults] = useState<BRREGEnhet[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (filters: SearchFilters) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters }),
      })
      
      if (!response.ok) {
        throw new Error('Søket feilet')
      }
      
      const data: SearchResult = await response.json()
      setResults(data.data)
      setTotalCount(data.totalCount)
      
      if (data.hasMore) {
        console.log(`Merk: Kun ${data.data.length} av ${data.totalCount} treff ble hentet (maks 10 000)`)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'En feil oppstod')
      setResults([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (results.length > 0) {
      exportToCSV(results)
    }
  }

  const handleExportExcel = () => {
    if (results.length > 0) {
      exportToExcel(results)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Søk etter bedrifter
        </h2>
        <p className="text-muted-foreground">
          Bruk filtrene nedenfor for å søke i BRREG Enhetsregisteret
        </p>
      </div>

      <SearchForm onSearch={handleSearch} isLoading={isLoading} />

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Søker i BRREG API...</p>
        </div>
      )}

      {results.length > 0 && (
        <ResultsTable
          results={results}
          totalCount={totalCount}
          onExportCSV={handleExportCSV}
          onExportExcel={handleExportExcel}
        />
      )}

      {results.length === 0 && !isLoading && !error && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Ingen søkeresultater ennå. Bruk søkefiltrene ovenfor for å starte et søk.</p>
        </div>
      )}
    </div>
  )
}

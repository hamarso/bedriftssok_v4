import { NextRequest, NextResponse } from 'next/server'
import { SearchFilters, BRREGResponse, BRREGEnhet, SearchResult } from '@/lib/types'

const BRREG_BASE_URL = 'https://data.brreg.no/enhetsregisteret/api/enheter'

async function fetchBRREGData(filters: SearchFilters, page: number = 0): Promise<BRREGResponse> {
  const params = new URLSearchParams()
  
  // Add filters
  if (filters.naceCodes.length > 0) {
    params.append('naceKode', filters.naceCodes.join(','))
  }
  
  if (filters.postnummer) {
    params.append('postnummer', filters.postnummer)
  }
  
  if (filters.kommunenummer) {
    params.append('kommunenummer', filters.kommunenummer)
  }
  
  // Add pagination
  params.append('page', page.toString())
  params.append('size', '1000') // Max page size
  
  // Add enhet type
  if (filters.enhetType === 'underenhet') {
    params.append('type', 'UNDERENHET')
  }
  
  const url = `${BRREG_BASE_URL}?${params.toString()}`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  })
  
  if (!response.ok) {
    throw new Error(`BRREG API error: ${response.status}`)
  }
  
  return response.json()
}

function transformBRREGData(brregData: BRREGResponse): BRREGEnhet[] {
  if (!brregData._embedded?.enheter) {
    return []
  }
  
  return brregData._embedded.enheter.map((enhet: any) => ({
    organisasjonsnummer: enhet.organisasjonsnummer || '',
    navn: enhet.navn?.navn || '',
    postadresse: enhet.postadresse?.adresse?.[0] || '',
    postnummer: enhet.postadresse?.postnummer || '',
    kommunenummer: enhet.postadresse?.kommunenummer || '',
    antallAnsatte: enhet.antallAnsatte || 0,
    naceKode: enhet.naceKoder?.[0]?.kode || '',
    naceBeskrivelse: enhet.naceKoder?.[0]?.beskrivelse || '',
    organisasjonsform: enhet.organisasjonsform?.kode || '',
    registreringsdato: enhet.registreringsdato || '',
    status: enhet.status || '',
    telefon: undefined // Not available in open API
  }))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const filters: SearchFilters = body.filters
    
    let allResults: BRREGEnhet[] = []
    let currentPage = 0
    let totalElements = 0
    let hasMore = true
    
    // Fetch data with pagination, up to 10,000 results
    while (hasMore && allResults.length < 10000) {
      const brregData = await fetchBRREGData(filters, currentPage)
      
      if (currentPage === 0) {
        totalElements = brregData.page.totalElements
      }
      
      const transformedData = transformBRREGData(brregData)
      
      if (transformedData.length === 0) {
        break
      }
      
      allResults.push(...transformedData)
      
      // Check if there are more pages
      hasMore = brregData.page.number < brregData.page.totalPages - 1
      currentPage++
      
      // Safety check to prevent infinite loops
      if (currentPage > 100) {
        break
      }
    }
    
    const result: SearchResult = {
      data: allResults,
      totalCount: Math.min(allResults.length, 10000),
      hasMore: hasMore && allResults.length < totalElements
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Failed to search BRREG API' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { SearchFilters, BRREGResponse, BRREGEnhet, SearchResult } from '@/lib/types'

const BRREG_BASE_URL = 'https://data.brreg.no/enhetsregisteret/api/enheter'

async function fetchBRREGData(filters: SearchFilters): Promise<BRREGEnhet[]> {
  const selskaper: BRREGEnhet[] = []
  const params = new URLSearchParams()
  
  // Add NACE code filter if specified
  if (filters.naceCodes.length > 0) {
    params.append('naeringskode', filters.naceCodes[0]) // Use first NACE code
  }
  
  // Add minimum employee count filter
  if (filters.minAnsatte && filters.minAnsatte > 0) {
    params.append('fraAntallAnsatte', filters.minAnsatte.toString())
  }
  
  // Add other filters
  if (filters.postnummer && filters.postnummer.trim()) {
    params.append('postnummer', filters.postnummer.trim())
  }
  
  if (filters.kommunenummer && filters.kommunenummer.trim()) {
    params.append('kommunenummer', filters.kommunenummer.trim())
  }
  
  // Add enhet type
  if (filters.enhetType === 'underenhet') {
    params.append('type', 'UNDERENHET')
  }
  
  // Set page size
  params.append('size', '1000')
  
  let page = 0
  
  while (true) {
    // Add page parameter
    params.set('page', page.toString())
    
    const url = `${BRREG_BASE_URL}?${params.toString()}`
    console.log(`Fetching page ${page}:`, url)
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (!response.ok) {
        console.error(`BRREG API error ${response.status}`)
        break
      }
      
      const data: BRREGResponse = await response.json()
      
      if (data._embedded && data._embedded.enheter) {
        const transformedData = transformBRREGData(data)
        selskaper.push(...transformedData)
        
        // Check if there are more pages
        if (data._links && data._links.next) {
          page++
        } else {
          break
        }
      } else {
        break
      }
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error)
      break
    }
  }
  
  return selskaper
}

function transformBRREGData(brregData: BRREGResponse): BRREGEnhet[] {
  if (!brregData._embedded?.enheter) {
    return []
  }
  
  return brregData._embedded.enheter.map((enhet: any) => ({
    organisasjonsnummer: enhet.organisasjonsnummer || '',
    navn: enhet.navn?.navn || enhet.navn || '',
    postadresse: enhet.forretningsadresse?.poststed || enhet.postadresse?.adresse?.[0] || '',
    postnummer: enhet.postadresse?.postnummer || '',
    kommunenummer: enhet.postadresse?.kommunenummer || '',
    antallAnsatte: enhet.antallAnsatte || 0,
    naceKode: enhet.naeringskode1?.kode || '',
    naceBeskrivelse: enhet.naeringskode1?.beskrivelse || '',
    organisasjonsform: enhet.organisasjonsform?.kode || '',
    registreringsdato: enhet.registreringsdatoEnhetsregisteret || enhet.registreringsdato || '',
    status: enhet.konkurs ? 'KONKURS' : enhet.underAvvikling ? 'AVVIKLING' : 'AKTIV',
    telefon: undefined
  }))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const filters: SearchFilters = body.filters
    
    console.log('=== SEARCH REQUEST START ===')
    console.log('Search filters received:', filters)
    
    // Fetch all data with filters
    const allResults = await fetchBRREGData(filters)
    
    console.log(`Found ${allResults.length} total results`)
    
    const result: SearchResult = {
      data: allResults,
      totalCount: allResults.length,
      hasMore: false
    }
    
    console.log(`Final result: ${result.data.length} items`)
    console.log('=== SEARCH REQUEST END ===')
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('=== SEARCH API ERROR ===')
    console.error('Error details:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to search BRREG API', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { SearchFilters, BRREGResponse, BRREGEnhet, SearchResult } from '@/lib/types'

const BRREG_BASE_URL = 'https://data.brreg.no/enhetsregisteret/api/enheter'

async function fetchBRREGData(filters: SearchFilters, page: number = 0): Promise<BRREGResponse> {
  const params = new URLSearchParams()
  
  // Add pagination first
  params.append('page', page.toString())
  params.append('size', '100') // Smaller page size for testing
  
  // Add filters only if they have values
  // Note: BRREG API doesn't support NACE code filtering directly
  // We'll need to filter results after fetching
  
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
  
  const url = `${BRREG_BASE_URL}?${params.toString()}`
  console.log('BRREG API URL:', url)
  console.log('Search filters:', filters)
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })
    
    console.log('BRREG API response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`BRREG API error ${response.status}:`, errorText)
      throw new Error(`BRREG API error: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log('BRREG API response data keys:', Object.keys(data))
    console.log('Response has _embedded:', !!data._embedded)
    console.log('Response has enheter:', !!data._embedded?.enheter)
    
    return data
  } catch (error) {
    console.error('Fetch error:', error)
    throw error
  }
}

function transformBRREGData(brregData: BRREGResponse): BRREGEnhet[] {
  console.log('Transforming BRREG data:', brregData)
  
  if (!brregData._embedded?.enheter) {
    console.log('No _embedded.enheter found in response')
    return []
  }
  
  const enheter = brregData._embedded.enheter
  console.log(`Found ${enheter.length} enheter to transform`)
  
  return enheter.map((enhet: any, index: number) => {
    console.log(`Transforming enhet ${index}:`, enhet.organisasjonsnummer)
    
    return {
      organisasjonsnummer: enhet.organisasjonsnummer || '',
      navn: enhet.navn?.navn || enhet.navn || '',
      postadresse: enhet.postadresse?.adresse?.[0] || '',
      postnummer: enhet.postadresse?.postnummer || '',
      kommunenummer: enhet.postadresse?.kommunenummer || '',
      antallAnsatte: enhet.antallAnsatte || 0,
      naceKode: enhet.naeringskode1?.kode || enhet.naceKoder?.[0]?.kode || enhet.nacekoder?.[0]?.kode || '',
      naceBeskrivelse: enhet.naeringskode1?.beskrivelse || enhet.naceKoder?.[0]?.beskrivelse || enhet.nacekoder?.[0]?.beskrivelse || '',
      organisasjonsform: enhet.organisasjonsform?.kode || '',
      registreringsdato: enhet.registreringsdatoEnhetsregisteret || enhet.registreringsdato || '',
      status: enhet.konkurs ? 'KONKURS' : enhet.underAvvikling ? 'AVVIKLING' : 'AKTIV',
      telefon: undefined
    }
  })
}

// Filter results by NACE codes after fetching
function filterByNACECodes(enheter: BRREGEnhet[], naceCodes: string[]): BRREGEnhet[] {
  if (naceCodes.length === 0) {
    return enheter
  }
  
  return enheter.filter(enhet => {
    // Check if any of the NACE codes match (exact or starts with)
    return naceCodes.some(naceCode => {
      const enhetNace = enhet.naceKode
      if (!enhetNace) return false
      
      // Exact match
      if (enhetNace === naceCode) return true
      
      // Starts with match (e.g., "62" matches "620100")
      if (naceCode.length < enhetNace.length && enhetNace.startsWith(naceCode)) return true
      
      return false
    })
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const filters: SearchFilters = body.filters
    
    console.log('=== SEARCH REQUEST START ===')
    console.log('Search filters received:', filters)
    
    // If no filters are set, return empty result instead of all companies
    if (!filters.naceCodes.length && !filters.postnummer && !filters.kommunenummer) {
      console.log('No filters set, returning empty result')
      return NextResponse.json({
        data: [],
        totalCount: 0,
        hasMore: false
      })
    }
    
    let allResults: BRREGEnhet[] = []
    let currentPage = 0
    let totalElements = 0
    let hasMore = true
    let maxPages = 50 // Limit to prevent too many API calls
    
    // Fetch data with pagination
    while (hasMore && allResults.length < 10000 && currentPage < maxPages) {
      console.log(`Fetching page ${currentPage}...`)
      
      const brregData = await fetchBRREGData(filters, currentPage)
      
      if (currentPage === 0) {
        totalElements = brregData.page?.totalElements || 0
        console.log(`Total elements found: ${totalElements}`)
      }
      
      const transformedData = transformBRREGData(brregData)
      console.log(`Page ${currentPage}: ${transformedData.length} results`)
      
      if (transformedData.length === 0) {
        console.log('No more data, stopping pagination')
        break
      }
      
      allResults.push(...transformedData)
      
      // Check if there are more pages
      hasMore = brregData.page && brregData.page.number < brregData.page.totalPages - 1
      currentPage++
    }
    
    // Filter by NACE codes if specified
    if (filters.naceCodes.length > 0) {
      console.log(`Filtering ${allResults.length} results by NACE codes:`, filters.naceCodes)
      allResults = filterByNACECodes(allResults, filters.naceCodes)
      console.log(`After NACE filtering: ${allResults.length} results`)
    }
    
    const result: SearchResult = {
      data: allResults,
      totalCount: Math.min(allResults.length, 10000),
      hasMore: hasMore && allResults.length < totalElements
    }
    
    console.log(`Final result: ${result.data.length} items, total: ${result.totalCount}`)
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
